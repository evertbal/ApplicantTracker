import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { candidateApi } from "@/lib/api";
import { insertCandidateSchema } from "@shared/schema";
import type { CandidateWithRelations, InsertCandidate } from "@shared/schema";
import { z } from "zod";

// Extend the schema with client-side validation
const candidateFormSchema = insertCandidateSchema.extend({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().or(z.literal("")),
  phone: z.string().optional(),
  drivingLicenseNotes: z.string().optional(),
});

type CandidateFormData = z.infer<typeof candidateFormSchema>;

interface CandidateFormProps {
  candidate?: CandidateWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CandidateForm({ candidate, onClose, onSuccess }: CandidateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!candidate;

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: candidate?.name || "",
      email: candidate?.email || "",
      phone: candidate?.phone || "",
      city: candidate?.city || "",
      region: candidate?.region || "",
      marketing: candidate?.marketing || "",
      description: candidate?.description || "",
      status: candidate?.status || "active",
      phase: candidate?.phase || "intake",
      drivingLicenses: candidate?.drivingLicenses || [],
      drivingLicenseNotes: candidate?.drivingLicenseNotes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: candidateApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Kandidaat toegevoegd",
        description: "De kandidaat is succesvol toegevoegd aan het systeem.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de kandidaat.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertCandidate>) => candidateApi.update(candidate!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Kandidaat bijgewerkt",
        description: "De kandidaat is succesvol bijgewerkt.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de kandidaat.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CandidateFormData) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      city: data.city || null,
      region: data.region || null,
      marketing: data.marketing || null,
      description: data.description || null,
    };

    if (isEditing) {
      updateMutation.mutate(cleanedData);
    } else {
      createMutation.mutate(cleanedData);
    }
  };



  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Kandidaat Bewerken' : 'Nieuwe Kandidaat Toevoegen'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <Form {...form}>
            <form id="candidate-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Beroep eerst */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beroep</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Bijvoorbeeld: chauffeur, magazijnmedewerker, kok..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volledige Naam *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefoon</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Woonplaats</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regio</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={[
                            { value: "Noord-Holland", label: "Noord-Holland" },
                            { value: "Zuid-Holland", label: "Zuid-Holland" },
                            { value: "Utrecht", label: "Utrecht" },
                            { value: "Gelderland", label: "Gelderland" },
                            { value: "Noord-Brabant", label: "Noord-Brabant" },
                            { value: "Overijssel", label: "Overijssel" },
                            { value: "Groningen", label: "Groningen" },
                            { value: "Friesland", label: "Friesland" },
                            { value: "Drenthe", label: "Drenthe" },
                            { value: "Flevoland", label: "Flevoland" },
                            { value: "Zeeland", label: "Zeeland" },
                            { value: "Limburg", label: "Limburg" }
                          ]}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Selecteer regio"
                          searchPlaceholder="Zoek regio..."
                          emptyMessage="Geen regio's gevonden."
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clear">
                            <span className="text-muted-foreground italic">Geen selectie</span>
                          </SelectItem>
                          <SelectItem value="active">Actief</SelectItem>
                          <SelectItem value="placed">Geplaatst</SelectItem>
                          <SelectItem value="inactive">Inactief</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer fase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clear">
                            <span className="text-muted-foreground italic">Geen selectie</span>
                          </SelectItem>
                          <SelectItem value="intake">Intake</SelectItem>
                          <SelectItem value="matching">Matching</SelectItem>
                          <SelectItem value="placed">Geplaatst</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="marketing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketing Bron</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer bron" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clear">
                            <span className="text-muted-foreground italic">Geen selectie</span>
                          </SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Indeed">Indeed</SelectItem>
                          <SelectItem value="Doorverwijzing">Doorverwijzing</SelectItem>
                          <SelectItem value="Advertentie">Advertentie</SelectItem>
                          <SelectItem value="Anders">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="drivingLicenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rijbewijs</FormLabel>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        'A', 'AM', 'B', 'BE', 'C', 'CE', 'D', 'DE', 'T'
                      ].map((license) => (
                        <div key={license} className="flex items-center space-x-2">
                          <Checkbox
                            id={`license-${license}`}
                            checked={(field.value || []).includes(license)}
                            onCheckedChange={(checked) => {
                              const currentLicenses = field.value || [];
                              if (checked) {
                                field.onChange([...currentLicenses, license]);
                              } else {
                                field.onChange(currentLicenses.filter(l => l !== license));
                              }
                            }}
                          />
                          <Label htmlFor={`license-${license}`} className="text-sm font-mono">
                            {license}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </form>
          </Form>
        </div>
        
        {/* Modal Footer - Fixed at bottom */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuleren
            </Button>
            <Button
              type="submit"
              form="candidate-form"
              disabled={isLoading}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              {isLoading ? (isEditing ? 'Bijwerken...' : 'Toevoegen...') : (isEditing ? 'Bijwerken' : 'Kandidaat Toevoegen')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
