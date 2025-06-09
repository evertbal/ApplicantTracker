import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { insertClientSchema, type InsertClient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      location: "",
      workType: "",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertClient) => {
      return apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Opdrachtgever toegevoegd",
        description: "De opdrachtgever is succesvol toegevoegd aan het systeem.",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de opdrachtgever.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClient) => {
    createClientMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Nieuwe Opdrachtgever Toevoegen</DialogTitle>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div>
            <Label htmlFor="name">Bedrijfsnaam *</Label>
            <Input
              id="name"
              {...form.register("name")}
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPerson">Contactpersoon</Label>
              <Input
                id="contactPerson"
                {...form.register("contactPerson")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">Locatie</Label>
              <Input
                id="location"
                {...form.register("location")}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="workType">Soort Werkzaamheden</Label>
            <Input
              id="workType"
              {...form.register("workType")}
              placeholder="Bijv. Transport, Logistiek, Bouw"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={createClientMutation.isPending}
              className="bg-primary hover:bg-primary-hover"
            >
              {createClientMutation.isPending ? "Toevoegen..." : "Opdrachtgever Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
