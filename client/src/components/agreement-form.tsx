import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertClientAgreementSchema } from "@shared/schema";
import type { ClientAgreement, InsertClientAgreement } from "@shared/schema";
import { z } from "zod";

// Extended schema for form validation
const agreementFormSchema = insertClientAgreementSchema.extend({
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().min(1, "Beschrijving is verplicht"),
});

type AgreementFormData = z.infer<typeof agreementFormSchema>;

interface AgreementFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  agreement?: ClientAgreement | null;
}

export default function AgreementForm({
  isOpen,
  onClose,
  clientId,
  agreement
}: AgreementFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AgreementFormData>({
    resolver: zodResolver(agreementFormSchema),
    defaultValues: {
      clientId,
      title: agreement?.title || "",
      description: agreement?.description || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClientAgreement) => {
      return apiRequest("POST", `/api/clients/${clientId}/agreements`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/agreements`] });
      toast({
        title: "Afspraak toegevoegd",
        description: "De afspraak is succesvol toegevoegd.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de afspraak.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertClientAgreement>) => {
      return apiRequest("PUT", `/api/clients/${clientId}/agreements/${agreement!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/agreements`] });
      toast({
        title: "Afspraak bijgewerkt",
        description: "De afspraak is succesvol bijgewerkt.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de afspraak.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AgreementFormData) => {
    if (agreement) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            {agreement ? "Afspraak bewerken" : "Nieuwe afspraak"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Bijv. Betalingsvoorwaarden, SLA afspraken..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschrijving *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Gedetailleerde beschrijving van de afspraak..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Bezig..."
                  : agreement
                  ? "Bijwerken"
                  : "Toevoegen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}