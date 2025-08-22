import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { z } from "zod";
import { insertTrajectorySchema, type Candidate, type Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewTrajectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewTrajectoryModal({ isOpen, onClose }: NewTrajectoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const newTrajectorySchema = insertTrajectorySchema.extend({
    note: z.string().optional(),
  });

  type NewTrajectoryFormData = z.infer<typeof newTrajectorySchema>;

  const form = useForm<NewTrajectoryFormData>({
    resolver: zodResolver(newTrajectorySchema),
    defaultValues: {
      status: "geaccepteerd",
      jobTitle: "",
      note: "",
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
    mutationFn: async (data: NewTrajectoryFormData) => {
      const { note, ...trajectoryData } = data;
      return apiRequest("POST", "/api/trajectories", {
        ...trajectoryData,
        ...(note ? { note } : {}),
      });
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

  const onSubmit = (data: NewTrajectoryFormData) => {
    createTrajectoryMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nieuw Traject Toevoegen</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="candidateId">Kandidaat *</Label>
              <SearchableSelect
                options={(candidates as Candidate[]).map((candidate: Candidate) => ({
                  value: candidate.id.toString(),
                  label: candidate.name
                }))}
                value={form.watch("candidateId")?.toString()}
                onValueChange={(value) => form.setValue("candidateId", parseInt(value))}
                placeholder="Selecteer kandidaat"
                searchPlaceholder="Zoek kandidaat..."
                emptyMessage="Geen kandidaten gevonden."
                className="mt-1"
              />
              {form.formState.errors.candidateId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.candidateId.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="clientId">Opdrachtgever *</Label>
              <SearchableSelect
                options={(clients as Client[]).map((client: Client) => ({
                  value: client.id.toString(),
                  label: client.name
                }))}
                value={form.watch("clientId")?.toString()}
                onValueChange={(value) => form.setValue("clientId", parseInt(value))}
                placeholder="Selecteer opdrachtgever"
                searchPlaceholder="Zoek opdrachtgever..."
                emptyMessage="Geen opdrachtgevers gevonden."
                className="mt-1"
              />
              {form.formState.errors.clientId && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.clientId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jobTitle">Functie</Label>
              <Input
                id="jobTitle"
                {...form.register("jobTitle")}
                className="mt-1"
              />
              {form.formState.errors.jobTitle && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.jobTitle.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => form.setValue("status", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geaccepteerd">Geaccepteerd</SelectItem>
                  <SelectItem value="voorgesteld_aan_klant">Voorgesteld aan klant</SelectItem>
                  <SelectItem value="gesprek_met_klant">Gesprek met klant</SelectItem>
                  <SelectItem value="geplaatst">Geplaatst</SelectItem>
                  <SelectItem value="niet_geplaatst">Niet geplaatst</SelectItem>
                  <SelectItem value="gestopt">Gestopt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="note">Notitie</Label>
            <Textarea
              id="note"
              {...form.register("note")}
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
