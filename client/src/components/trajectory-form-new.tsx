import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { trajectoryApi, candidateApi, clientApi } from "@/lib/api";
import { TrajectoryWithRelations } from "@shared/schema";
import { z } from "zod";

const trajectoryFormSchema = z.object({
  jobTitle: z.string().optional(),
  candidateId: z.string().min(1, "Kandidaat is verplicht"),
  clientId: z.string().min(1, "Opdrachtgever is verplicht"),
  startDate: z.string().optional(),
  status: z.string().optional(),
  hourlyRate: z.string().optional(),
  notes: z.string().optional(),
});

type TrajectoryFormData = z.infer<typeof trajectoryFormSchema>;

interface TrajectoryFormProps {
  trajectory?: TrajectoryWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrajectoryFormNew({ trajectory, isOpen, onClose, onSuccess }: TrajectoryFormProps) {
  const { toast } = useToast();
  const isEditing = !!trajectory;

  const form = useForm<TrajectoryFormData>({
    resolver: zodResolver(trajectoryFormSchema),
    defaultValues: {
      jobTitle: trajectory?.jobTitle || "",
      candidateId: trajectory?.candidateId?.toString() || "",
      clientId: trajectory?.clientId?.toString() || "",
      startDate: trajectory?.startDate || "",
      status: trajectory?.status || "interview",
      hourlyRate: trajectory?.hourlyRate || "",
      notes: "",
    },
  });

  // Fetch candidates and clients for dropdowns
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/candidates'],
    queryFn: () => candidateApi.getAll(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: () => clientApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => trajectoryApi.create({
      ...data,
      candidateId: parseInt(data.candidateId),
      clientId: parseInt(data.clientId),
    }),
    onSuccess: () => {
      toast({
        title: "Traject toegevoegd",
        description: "Het traject is succesvol toegevoegd aan het systeem.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het traject.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => trajectoryApi.update(trajectory!.id, {
      ...data,
      candidateId: parseInt(data.candidateId),
      clientId: parseInt(data.clientId),
    }),
    onSuccess: () => {
      toast({
        title: "Traject bijgewerkt",
        description: "Het traject is succesvol bijgewerkt.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het traject.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TrajectoryFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Traject bewerken" : "Nieuw traject"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="jobTitle">Functie</Label>
            <Input
              id="jobTitle"
              {...form.register("jobTitle")}
              placeholder="Optioneel"
            />
          </div>

          <div>
            <Label htmlFor="candidateId">Kandidaat *</Label>
            <Select
              value={form.watch("candidateId")}
              onValueChange={(value) => form.setValue("candidateId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer kandidaat" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate: any) => (
                  <SelectItem key={candidate.id} value={candidate.id.toString()}>
                    {candidate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.candidateId && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.candidateId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="clientId">Opdrachtgever *</Label>
            <Select
              value={form.watch("clientId")}
              onValueChange={(value) => form.setValue("clientId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer opdrachtgever" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.clientId && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.clientId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="proposal">Voorstel</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="completed">Afgerond</SelectItem>
                <SelectItem value="rejected">Afgewezen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate">Startdatum</Label>
            <Input
              id="startDate"
              type="date"
              {...form.register("startDate")}
            />
          </div>

          <div>
            <Label htmlFor="hourlyRate">Uurtarief</Label>
            <Input
              id="hourlyRate"
              {...form.register("hourlyRate")}
              placeholder="Bijvoorbeeld: 25.00"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Optionele notities..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? "Bezig..." 
                : isEditing 
                  ? "Bijwerken" 
                  : "Toevoegen"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}