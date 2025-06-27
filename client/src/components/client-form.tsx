import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { clientApi } from "@/lib/api";
import { insertClientSchema, insertClientLocationSchema, insertClientContactSchema } from "@shared/schema";
import type { ClientWithRelations, InsertClient, InsertClientLocation, InsertClientContact } from "@shared/schema";
import { z } from "zod";

// Extended schema with locations and contacts
const clientFormSchema = insertClientSchema.extend({
  name: z.string().min(1, "Bedrijfsnaam is verplicht"),
  locations: z.array(insertClientLocationSchema.omit({ clientId: true })).optional(),
  contacts: z.array(insertClientContactSchema.omit({ clientId: true })).optional(),
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
      locations: client?.locations || [],
      contacts: client?.contacts || [],
    },
  });

  const { fields: locationFields, append: appendLocation, remove: removeLocation } = useFieldArray({
    control: form.control,
    name: "locations",
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "contacts",
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

  const onSubmit = async (data: ClientFormData) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      name: data.name,
      contactPerson: data.contactPerson || null,
      location: data.location || null,
      workType: data.workType || null,
      adresHoofdlocatie: data.adresHoofdlocatie || null,
      notities: data.notities || null,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(cleanedData);
        // Handle locations and contacts separately for editing
        // Note: This would require additional API calls for locations/contacts
      } else {
        await createMutation.mutateAsync(cleanedData);
        // For new clients, we'll handle locations/contacts after creation
      }
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
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
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer werkzaamheden" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bouw">Bouw</SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Logistiek">Logistiek</SelectItem>
                        <SelectItem value="Distributie">Distributie</SelectItem>
                        <SelectItem value="Magazijn">Magazijn</SelectItem>
                        <SelectItem value="Productie">Productie</SelectItem>
                        <SelectItem value="Bouw">Bouw</SelectItem>
                        <SelectItem value="Techniek">Techniek</SelectItem>
                        <SelectItem value="Zorg">Zorg</SelectItem>
                        <SelectItem value="Administratief">Administratief</SelectItem>
                        <SelectItem value="Anders">Anders</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary-hover text-white"
                >
                  {isLoading ? (isEditing ? 'Bijwerken...' : 'Toevoegen...') : (isEditing ? 'Bijwerken' : 'Opdrachtgever Toevoegen')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
