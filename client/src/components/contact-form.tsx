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
import { insertClientContactSchema } from "@shared/schema";
import type { ClientContact, InsertClientContact } from "@shared/schema";
import { z } from "zod";

// Extended schema for form validation
const contactFormSchema = insertClientContactSchema.extend({
  naam: z.string().min(1, "Naam is verplicht"),
  emailadres: z.string().email("Ongeldig e-mailadres").min(1, "E-mailadres is verplicht"),
  rol: z.string().optional(),
  telefoonnummer: z.string().optional(),
  geboortedatum: z.string().optional(),
  opmerkingen: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  contact?: ClientContact | null;
}

export default function ContactForm({ isOpen, onClose, clientId, contact }: ContactFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!contact;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      clientId: clientId,
      naam: contact?.naam || "",
      rol: contact?.rol || "",
      telefoonnummer: contact?.telefoonnummer || "",
      emailadres: contact?.emailadres || "",
      geboortedatum: contact?.geboortedatum || "",
      opmerkingen: contact?.opmerkingen || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertClientContact) => {
      return apiRequest("POST", "/api/client-contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Contactpersoon toegevoegd",
        description: "De contactpersoon is succesvol toegevoegd.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de contactpersoon.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertClientContact>) => {
      return apiRequest("PATCH", `/api/client-contacts/${contact!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Contactpersoon bijgewerkt",
        description: "De contactpersoon is succesvol bijgewerkt.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de contactpersoon.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    // Transform empty strings to null for date fields
    const transformedData = {
      ...data,
      geboortedatum: data.geboortedatum === "" ? null : data.geboortedatum,
      rol: data.rol === "" ? null : data.rol,
      telefoonnummer: data.telefoonnummer === "" ? null : data.telefoonnummer,
      opmerkingen: data.opmerkingen === "" ? null : data.opmerkingen,
    };

    if (isEditing) {
      updateMutation.mutate(transformedData);
    } else {
      createMutation.mutate(transformedData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? "Contactpersoon bewerken" : "Contactpersoon toevoegen"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="naam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam *</FormLabel>
                    <FormControl>
                      <Input placeholder="Volledige naam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <Input placeholder="Functietitel" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefoonnummer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefoonnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="06-12345678" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailadres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mailadres *</FormLabel>
                    <FormControl>
                      <Input placeholder="naam@bedrijf.nl" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="geboortedatum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geboortedatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="opmerkingen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opmerkingen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Aanvullende opmerkingen over deze contactpersoon..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
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
                className="bg-primary hover:bg-primary-hover"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Bezig..."
                  : isEditing
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