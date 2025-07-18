import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { clientApi } from "@/lib/api";
import { insertClientSchema } from "@shared/schema";
import type { ClientWithRelations, InsertClient } from "@shared/schema";
import { z } from "zod";

// Extended schema for form validation
const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(1, "Bedrijfsnaam is verplicht"),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client?: ClientWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!client;

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || "",
      contactPerson: client?.contactPerson || "",
      location: client?.location || "",
      workType: client?.workType || "",
      adresHoofdlocatie: client?.adresHoofdlocatie || "",
      notities: client?.notities || "",
      status: client?.status || "actief",
    },
  });

  const createMutation = useMutation({
    mutationFn: clientApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Opdrachtgever toegevoegd",
        description: "De opdrachtgever is succesvol toegevoegd aan het systeem.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de opdrachtgever.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertClient>) => clientApi.update(client!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Opdrachtgever bijgewerkt",
        description: "De opdrachtgever is succesvol bijgewerkt.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de opdrachtgever.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      contactPerson: data.contactPerson || null,
      location: data.location || null,
      workType: data.workType || null,
      adresHoofdlocatie: data.adresHoofdlocatie || null,
      notities: data.notities || null,
      status: data.status || null,
    };

    if (isEditing) {
      updateMutation.mutate(cleanedData);
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Opdrachtgever Bewerken' : 'Nieuwe Opdrachtgever Toevoegen'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrijfsnaam *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bijv. Transport BV" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contactpersoon</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Bijv. Jan Janssen" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Locatie</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Bijv. Amsterdam" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soort Werkzaamheden</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "clear" ? "" : value)} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer werkzaamheden" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clear">
                            <span className="text-muted-foreground italic">Geen selectie</span>
                          </SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="logistics">Logistiek</SelectItem>
                          <SelectItem value="warehouse">Magazijn</SelectItem>
                          <SelectItem value="construction">Bouw</SelectItem>
                          <SelectItem value="manufacturing">Productie</SelectItem>
                          <SelectItem value="cleaning">Schoonmaak</SelectItem>
                          <SelectItem value="security">Beveiliging</SelectItem>
                          <SelectItem value="catering">Horeca</SelectItem>
                          <SelectItem value="healthcare">Zorg</SelectItem>
                          <SelectItem value="other">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "clear" ? "" : value)} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clear">
                            <span className="text-muted-foreground italic">Geen selectie</span>
                          </SelectItem>
                          <SelectItem value="actief">Actief</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="inactief">Inactief</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adresHoofdlocatie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres Hoofdlocatie</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Bijv. Hoofdstraat 123, 1234 AB Amsterdam" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Belangrijke Informatie</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="Voeg belangrijke informatie toe over deze opdrachtgever..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Bezig..." : isEditing ? "Bijwerken" : "Toevoegen"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}