import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
});

type CandidateFormData = z.infer<typeof candidateFormSchema>;

interface CandidateFormProps {
  candidate?: CandidateWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CandidateForm({ candidate, onClose, onSuccess }: CandidateFormProps) {
  const { toast } = useToast();
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
    },
  });

  const createMutation = useMutation({
    mutationFn: candidateApi.create,
    onSuccess: () => {
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

  const handleLicenseChange = (license: string, checked: boolean) => {
    const currentLicenses = form.getValues("drivingLicenses") || [];
    if (checked) {
      form.setValue("drivingLicenses", [...currentLicenses, license]);
    } else {
      form.setValue("drivingLicenses", currentLicenses.filter(l => l !== license));
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
              {isEditing ? 'Kandidaat Bewerken' : 'Nieuwe Kandidaat Toevoegen'}
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
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer regio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Selecteer regio</SelectItem>
                          <SelectItem value="Noord-Holland">Noord-Holland</SelectItem>
                          <SelectItem value="Zuid-Holland">Zuid-Holland</SelectItem>
                          <SelectItem value="Utrecht">Utrecht</SelectItem>
                          <SelectItem value="Gelderland">Gelderland</SelectItem>
                          <SelectItem value="Noord-Brabant">Noord-Brabant</SelectItem>
                          <SelectItem value="Overijssel">Overijssel</SelectItem>
                          <SelectItem value="Groningen">Groningen</SelectItem>
                          <SelectItem value="Friesland">Friesland</SelectItem>
                          <SelectItem value="Drenthe">Drenthe</SelectItem>
                          <SelectItem value="Flevoland">Flevoland</SelectItem>
                          <SelectItem value="Zeeland">Zeeland</SelectItem>
                          <SelectItem value="Limburg">Limburg</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                          <SelectItem value="">Selecteer bron</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Indeed">Indeed</SelectItem>
                          <SelectItem value="Website">Website</SelectItem>
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

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rijbewijs</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'B', label: 'B (Auto)' },
                    { value: 'C', label: 'C (Vrachtwagen)' },
                    { value: 'D', label: 'D (Bus)' },
                  ].map((license) => (
                    <div key={license.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`license-${license.value}`}
                        checked={(form.getValues("drivingLicenses") || []).includes(license.value)}
                        onCheckedChange={(checked) => handleLicenseChange(license.value, checked as boolean)}
                      />
                      <Label htmlFor={`license-${license.value}`} className="text-sm">
                        {license.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Korte beschrijving van de kandidaat..."
                        className="resize-none"
                      />
                    </FormControl>
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
                  {isLoading ? (isEditing ? 'Bijwerken...' : 'Toevoegen...') : (isEditing ? 'Bijwerken' : 'Kandidaat Toevoegen')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
