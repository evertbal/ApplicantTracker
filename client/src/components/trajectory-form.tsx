import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  validateTrajectoryData,
  getTrajectoryStatusOptions,
  getCandidateStatusOptions,
  getSuggestedCandidateStatus,
  formatCandidateStatus
} from "@/lib/trajectory-formatters";
import type { TrajectoryWithRelations, Candidate, Client } from "@shared/schema";

const trajectoryFormSchema = z.object({
  candidateId: z.number().min(1, "Selecteer een kandidaat"),
  clientId: z.number().min(1, "Selecteer een opdrachtgever"),
  jobTitle: z.string().min(1, "Functietitel is verplicht"),
  status: z.string().optional(),
  candidateStatus: z.string().optional(),
});

type TrajectoryFormData = z.infer<typeof trajectoryFormSchema>;

interface TrajectoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  trajectory?: TrajectoryWithRelations | null;
  mode: "create" | "edit";
}

export default function TrajectoryForm({ isOpen, onClose, trajectory, mode }: TrajectoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCandidateStatus, setShowCandidateStatus] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Validate trajectory data when editing
  const validation = validateTrajectoryData(trajectory || null);

  // Default values for form
  const defaultValues: TrajectoryFormData = {
    candidateId: trajectory?.candidateId || 0,
    clientId: trajectory?.clientId || 0,
    jobTitle: trajectory?.jobTitle || "",
    status: trajectory?.status || "geaccepteerd",
    candidateStatus: "",
  };

  const form = useForm<TrajectoryFormData>({
    resolver: zodResolver(trajectoryFormSchema),
    defaultValues,
  });

  // Fetch candidates and clients
  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/candidates"],
    enabled: isOpen,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  // Reset form when trajectory changes
  React.useEffect(() => {
    if (trajectory && mode === "edit") {
      const validation = validateTrajectoryData(trajectory);
      if (!validation.isValid) {
        console.error("Trajectory validation errors:", validation.errors);
        toast({
          title: "Data validatie fout",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
      }
      
      form.reset({
        candidateId: trajectory.candidateId || 0,
        clientId: trajectory.clientId || 0,
        jobTitle: trajectory.jobTitle || "",
        status: trajectory.status || "geaccepteerd",
        startDate: trajectory.startDate || "",
        hourlyRate: trajectory.hourlyRate || "",
        candidateStatus: "",
      });
      
      // Set the selected candidate for edit mode
      if (trajectory.candidateId && candidates.length > 0) {
        const candidate = candidates.find((c: Candidate) => c.id === trajectory.candidateId);
        setSelectedCandidate(candidate || null);
      }
    } else if (mode === "create") {
      form.reset({
        candidateId: 0,
        clientId: 0,
        jobTitle: "",
        status: "geaccepteerd",
        startDate: "",
        hourlyRate: "",
        candidateStatus: "",
      });
      setSelectedCandidate(null);
      setShowCandidateStatus(false);
    }
  }, [trajectory, mode, form, toast, candidates]);

  // Create/update trajectory mutation
  const saveTrajectoryMutation = useMutation({
    mutationFn: async (data: TrajectoryFormData) => {
      const url = mode === "edit" ? `/api/trajectories/${trajectory?.id}` : "/api/trajectories";
      const method = mode === "edit" ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, {
        candidateId: data.candidateId,
        clientId: data.clientId,
        jobTitle: data.jobTitle,
        status: data.status || "geaccepteerd",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response");
      }
      
      const result = await response.json();
      
      // Update candidate status if provided
      if (data.candidateStatus && data.candidateId) {
        try {
          await apiRequest("PUT", `/api/candidates/${data.candidateId}`, {
            status: data.candidateStatus
          });
        } catch (error) {
          console.error("Failed to update candidate status:", error);
          // Don't fail the trajectory update if candidate status update fails
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trajectories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: mode === "edit" ? "Traject bijgewerkt" : "Traject aangemaakt",
        description: mode === "edit" 
          ? "Het traject is succesvol bijgewerkt." 
          : "Het nieuwe traject is succesvol aangemaakt.",
      });
      
      form.reset();
      setShowCandidateStatus(false);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: mode === "edit" ? "Fout bij bijwerken" : "Fout bij aanmaken",
        description: error.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TrajectoryFormData) => {
    if (!data.candidateId || !data.clientId) {
      toast({
        title: "Ontbrekende gegevens",
        description: "Selecteer zowel een kandidaat als een opdrachtgever.",
        variant: "destructive",
      });
      return;
    }
    
    saveTrajectoryMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!validation.isValid && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Fout bij laden traject</DialogTitle>
            <DialogDescription>
              Het traject kan niet worden bewerkt vanwege ontbrekende gegevens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Het traject kan niet worden geladen vanwege de volgende problemen:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <Button onClick={handleClose} className="w-full">
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Traject bewerken" : "Nieuw traject"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Bewerk de gegevens van dit traject." 
              : "Maak een nieuw traject aan door de onderstaande velden in te vullen."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Title */}
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Functietitel *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Bijv. Senior Developer, Project Manager..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    value={field.value || ""} 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Show candidate status selection when trajectory status changes
                      const candidateId = form.watch('candidateId');
                      if (value && candidateId && candidates.length > 0) {
                        const candidate = candidates.find((c: Candidate) => c.id === candidateId);
                        if (candidate) {
                          setSelectedCandidate(candidate);
                          setShowCandidateStatus(true);
                          const suggestedStatus = getSuggestedCandidateStatus(value);
                          form.setValue('candidateStatus', suggestedStatus);
                        }
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getTrajectoryStatusOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Candidate Selection */}
            <FormField
              control={form.control}
              name="candidateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kandidaat *</FormLabel>
                  <Select 
                    value={field.value ? field.value.toString() : ""} 
                    onValueChange={(value) => {
                      const candidateId = value ? parseInt(value, 10) : 0;
                      field.onChange(candidateId);
                      
                      // Find selected candidate and show status selection if trajectory status is set
                      const candidate = candidates.find((c: Candidate) => c.id === candidateId);
                      setSelectedCandidate(candidate || null);
                      
                      if (candidateId && form.watch('status')) {
                        setShowCandidateStatus(true);
                        const suggestedStatus = getSuggestedCandidateStatus(form.watch('status'));
                        form.setValue('candidateStatus', suggestedStatus);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer kandidaat" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(candidates as Candidate[]).map((candidate: Candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Candidate Status Selection - shows when trajectory status changes */}
            {showCandidateStatus && selectedCandidate && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <Label className="text-sm font-medium">
                  Wijzig status van kandidaat: {selectedCandidate.name}
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Huidige status: {formatCandidateStatus(selectedCandidate.status)}
                </p>
                
                <FormField
                  control={form.control}
                  name="candidateStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          className="grid grid-cols-1 gap-2"
                        >
                          {getCandidateStatusOptions().map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={option.value} />
                              <Label htmlFor={option.value} className="text-sm cursor-pointer">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opdrachtgever *</FormLabel>
                  <Select 
                    value={field.value ? field.value.toString() : ""} 
                    onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : 0)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer opdrachtgever" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(clients as Client[]).map((client: Client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={saveTrajectoryMutation.isPending}
                className="bg-primary hover:bg-primary-hover"
              >
                {saveTrajectoryMutation.isPending 
                  ? (mode === "edit" ? "Bijwerken..." : "Aanmaken...") 
                  : (mode === "edit" ? "Bijwerken" : "Aanmaken")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}