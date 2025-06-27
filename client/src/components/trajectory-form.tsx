import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  formatTrajectoryDate,
  validateTrajectoryData 
} from "@/lib/trajectory-formatters";
import type { TrajectoryWithRelations, Candidate, Client } from "@shared/schema";

const trajectoryFormSchema = z.object({
  candidateId: z.number().min(1, "Selecteer een kandidaat"),
  clientId: z.number().min(1, "Selecteer een opdrachtgever"),
  jobTitle: z.string().min(1, "Functietitel is verplicht"),
  status: z.string().optional(),
  startDate: z.string().optional(),
  hourlyRate: z.string().optional(),
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

  // Validate trajectory data when editing
  const validation = validateTrajectoryData(trajectory || null);

  // Default values for form
  const defaultValues: TrajectoryFormData = {
    candidateId: trajectory?.candidateId || 0,
    clientId: trajectory?.clientId || 0,
    jobTitle: trajectory?.jobTitle || "",
    status: trajectory?.status || "interview",
    startDate: trajectory?.startDate || "",
    hourlyRate: trajectory?.hourlyRate || "",
  };

  const form = useForm<TrajectoryFormData>({
    resolver: zodResolver(trajectoryFormSchema),
    defaultValues,
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
        status: trajectory.status || "interview",
        startDate: trajectory.startDate || "",
        hourlyRate: trajectory.hourlyRate || "",
      });
    } else if (mode === "create") {
      form.reset({
        candidateId: 0,
        clientId: 0,
        jobTitle: "",
        status: "interview",
        startDate: "",
        hourlyRate: "",
      });
    }
  }, [trajectory, mode, form, toast]);

  // Fetch candidates and clients
  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/candidates"],
    enabled: isOpen,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  // Create/update trajectory mutation
  const saveTrajectoryMutation = useMutation({
    mutationFn: async (data: TrajectoryFormData) => {
      const url = mode === "edit" ? `/api/trajectories/${trajectory?.id}` : "/api/trajectories";
      const method = mode === "edit" ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, {
        candidateId: data.candidateId,
        clientId: data.clientId,
        jobTitle: data.jobTitle,
        status: data.status || "interview",
        startDate: data.startDate || null,
        hourlyRate: data.hourlyRate || null,
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
      
      return response.json();
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
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="proposed">Voorgesteld</SelectItem>
                      <SelectItem value="placed">Geplaatst</SelectItem>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="completed">Afgerond</SelectItem>
                      <SelectItem value="cancelled">Geannuleerd</SelectItem>
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
                    onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : 0)}
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

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Startdatum</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      placeholder="Selecteer startdatum"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hourly Rate */}
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uurtarief</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Bijv. €75 per uur"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
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