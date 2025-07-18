import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2, User, Briefcase, Mail, Phone, MapPin, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { candidateApi, notesApi } from "@/lib/api";
import { insertCandidateSchema, insertTrajectorySchema } from "@shared/schema";
import type { CandidateWithRelations, InsertCandidate, InsertTrajectory, Client } from "@shared/schema";
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

// Trajectory form schema
const trajectoryFormSchema = insertTrajectorySchema.omit({ candidateId: true }).extend({
  clientId: z.number().min(1, "Opdrachtgever is verplicht"),
  jobTitle: z.string().min(1, "Functietitel is verplicht"),
  status: z.string().default("geaccepteerd"),
});

type TrajectoryFormData = z.infer<typeof trajectoryFormSchema>;

export default function CandidateForm({ candidate, onClose, onSuccess }: CandidateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!candidate;
  const [initialNotes, setInitialNotes] = useState<string[]>([""]);
  const [trajectories, setTrajectories] = useState<TrajectoryFormData[]>([]);

  // Fetch clients for trajectory dropdowns
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    enabled: !isEditing, // Only fetch when creating new candidates
  });

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
      salaryIndication: candidate?.salaryIndication || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (candidateData: InsertCandidate) => {
      // Create the candidate with notes - server handles note creation
      const candidate = await candidateApi.create(candidateData);
      return candidate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Kandidaat toegevoegd",
        description: "De kandidaat is succesvol toegevoegd aan het systeem.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      const message = error.message || "Er is een fout opgetreden bij het toevoegen van de kandidaat.";
      toast({
        title: error.response?.data?.duplicate ? "Duplicaat gevonden" : "Fout",
        description: message,
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
      // Voor nieuwe kandidaten, voeg trajecten en notities toe
      const submissionData = {
        ...cleanedData,
        trajectories: trajectories.filter(t => t.clientId > 0 && t.jobTitle.trim()),
        notes: initialNotes
          .filter(note => note.trim())
          .map(content => ({ content }))
      };
      createMutation.mutate(submissionData);
    }
  };

  // Helper functions for managing initial notes
  const addNoteField = () => {
    setInitialNotes([...initialNotes, ""]);
  };

  const removeNoteField = (index: number) => {
    if (initialNotes.length > 1) {
      setInitialNotes(initialNotes.filter((_, i) => i !== index));
    }
  };

  const updateNoteField = (index: number, value: string) => {
    const updated = [...initialNotes];
    updated[index] = value;
    setInitialNotes(updated);
  };

  // Helper functions for managing trajectories
  const addTrajectory = () => {
    setTrajectories([...trajectories, {
      clientId: 0,
      jobTitle: "",
      status: "geaccepteerd",
    }]);
  };

  const removeTrajectory = (index: number) => {
    setTrajectories(trajectories.filter((_, i) => i !== index));
  };

  const updateTrajectory = (index: number, field: keyof TrajectoryFormData, value: any) => {
    const updated = [...trajectories];
    updated[index] = { ...updated[index], [field]: value };
    setTrajectories(updated);
  };



  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="modal-overlay z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="modal-content w-full max-w-3xl max-h-[90vh] flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="heading-enhanced text-2xl">
                {isEditing ? 'Kandidaat Bewerken' : 'Nieuwe Kandidaat Toevoegen'}
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          <Form {...form}>
            <form id="candidate-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Beroep eerst */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="label-enhanced flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      <span>Beroep</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Bijvoorbeeld: chauffeur, magazijnmedewerker, kok..." 
                        className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="label-enhanced flex items-center space-x-2">
                        <User className="w-4 h-4 text-primary" />
                        <span>Volledige Naam *</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="label-enhanced flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>Telefoon</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20 transition-colors"
                        />
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
                      <Select onValueChange={(value) => field.onChange(value === "clear" ? "" : value)} defaultValue={field.value || ""}>
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
                      <Select onValueChange={(value) => field.onChange(value === "clear" ? "" : value)} defaultValue={field.value || ""}>
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
                      <Select onValueChange={(value) => field.onChange(value === "clear" ? "" : value)} defaultValue={field.value || ""}>
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
                name="salaryIndication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salarisindicatie</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Bijvoorbeeld: €2500-€3000 per maand, €16 per uur..." 
                        className="rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary/20 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {/* Initial Notes Section - Only for new candidates */}
              {!isEditing && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Initiële Notities (optioneel)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addNoteField}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Notitie toevoegen</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {initialNotes.map((note, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Textarea
                          placeholder={`Notitie ${index + 1}...`}
                          value={note}
                          onChange={(e) => updateNoteField(index, e.target.value)}
                          rows={3}
                          className="flex-1 resize-none"
                        />
                        {initialNotes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeNoteField(index)}
                            className="mt-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deze notities worden automatisch toegevoegd aan de kandidaat na het opslaan.
                  </p>
                </div>
              )}

              {/* Trajecten sectie - alleen bij nieuwe kandidaten */}
              {!isEditing && (
                <div className="space-y-6">
                  <Separator className="my-8" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="heading-enhanced text-lg">Trajecten</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Voeg direct trajecten toe voor deze kandidaat (optioneel)
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTrajectory}
                        className="flex items-center space-x-2 rounded-xl"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Traject toevoegen</span>
                      </Button>
                    </div>

                    {trajectories.length > 0 && (
                      <div className="space-y-6">
                        {trajectories.map((trajectory, index) => (
                          <div key={index} className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  Traject {index + 1}
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTrajectory(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Opdrachtgever */}
                              <div className="space-y-2">
                                <Label className="label-enhanced flex items-center space-x-2">
                                  <Building2 className="w-4 h-4 text-primary" />
                                  <span>Opdrachtgever *</span>
                                </Label>
                                <Select
                                  value={trajectory.clientId ? trajectory.clientId.toString() : ""}
                                  onValueChange={(value) => updateTrajectory(index, 'clientId', value ? parseInt(value) : 0)}
                                >
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Selecteer opdrachtgever" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(clients as Client[]).map((client) => (
                                      <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Functietitel */}
                              <div className="space-y-2">
                                <Label className="label-enhanced flex items-center space-x-2">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                  <span>Functietitel *</span>
                                </Label>
                                <Input
                                  value={trajectory.jobTitle}
                                  onChange={(e) => updateTrajectory(index, 'jobTitle', e.target.value)}
                                  placeholder="Bijvoorbeeld: Senior Developer, Magazijnmedewerker..."
                                  className="rounded-xl"
                                />
                              </div>

                              {/* Status */}
                              <div className="space-y-2">
                                <Label className="label-enhanced">Status</Label>
                                <Select
                                  value={trajectory.status}
                                  onValueChange={(value) => updateTrajectory(index, 'status', value)}
                                >
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Selecteer status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="interview">Interview</SelectItem>
                                    <SelectItem value="proposed">Voorgesteld</SelectItem>
                                    <SelectItem value="placed">Geplaatst</SelectItem>
                                    <SelectItem value="active">Actief</SelectItem>
                                    <SelectItem value="completed">Afgerond</SelectItem>
                                    <SelectItem value="cancelled">Geannuleerd</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Location */}
                              <div className="space-y-2">
                                <Label className="label-enhanced">Locatie</Label>
                                <Input
                                  value={trajectory.location || ""}
                                  onChange={(e) => updateTrajectory(index, 'location', e.target.value)}
                                  placeholder="Bijvoorbeeld: Amsterdam, Rotterdam"
                                  className="rounded-xl"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {trajectories.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p>Geen trajecten toegevoegd</p>
                        <p className="text-sm">Klik op "Traject toevoegen" om te beginnen</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </form>
          </Form>
        </div>
        
        {/* Modal Footer - Fixed at bottom */}
        <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex justify-end space-x-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="rounded-xl border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              form="candidate-form"
              disabled={isLoading}
              className="btn-primary-enhanced"
            >
              {isLoading ? (isEditing ? 'Bijwerken...' : 'Toevoegen...') : (isEditing ? 'Bijwerken' : 'Kandidaat Toevoegen')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
