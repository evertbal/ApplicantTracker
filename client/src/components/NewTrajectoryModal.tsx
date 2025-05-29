import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { insertTrajectorySchema, type InsertTrajectory, type Candidate, type Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewTrajectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTrajectoryModal({ isOpen, onClose }: NewTrajectoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertTrajectory>({
    resolver: zodResolver(insertTrajectorySchema),
    defaultValues: {
      position: "",
      rate: "",
      notes: "",
      status: "interview",
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["/api/candidates"],
    enabled: isOpen,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isOpen,
  });

  const createTrajectoryMutation = useMutation({
    mutationFn: async (data: InsertTrajectory) => {
      return apiRequest("POST", "/api/trajectories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trajectories"] });
      toast({
        title: "Traject toegevoegd",
        description: "Het traject is succesvol toegevoegd aan het systeem.",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van het traject.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTrajectory) => {
    createTrajectoryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Nieuw Traject Toevoegen</DialogTitle>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="candidateId">Kandidaat *</Label>
              <Select onValueChange={(value) => form.setValue("candidateId", parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer kandidaat" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate: Candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id.toString()}>
                      {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.candidateId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.candidateId.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="clientId">Opdrachtgever *</Label>
              <Select onValueChange={(value) => form.setValue("clientId", parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer opdrachtgever" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: Client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.clientId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Functie *</Label>
              <Input
                id="position"
                {...form.register("position")}
                className="mt-1"
              />
              {form.formState.errors.position && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.position.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rate">Tarief</Label>
              <Input
                id="rate"
                {...form.register("rate")}
                placeholder="€18,50 per uur"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Startdatum</Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue("status", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">In Gesprek</SelectItem>
                  <SelectItem value="proposed">Voorgesteld</SelectItem>
                  <SelectItem value="placed">Geplaatst</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Aanvullende informatie over het traject..."
              {...form.register("notes")}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={createTrajectoryMutation.isPending}
              className="bg-primary hover:bg-primary-hover"
            >
              {createTrajectoryMutation.isPending ? "Toevoegen..." : "Traject Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
