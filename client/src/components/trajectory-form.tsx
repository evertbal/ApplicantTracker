import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { trajectoryApi, candidateApi, clientApi } from "@/lib/api";
import { insertTrajectorySchema } from "@shared/schema";
import type { TrajectoryWithRelations, InsertTrajectory } from "@shared/schema";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Extend the schema with client-side validation
const trajectoryFormSchema = insertTrajectorySchema.extend({
  jobTitle: z.string().min(1, "Functie is verplicht"),
  candidateId: z.number().min(1, "Kandidaat is verplicht"),
  clientId: z.number().min(1, "Opdrachtgever is verplicht"),
});

type TrajectoryFormData = z.infer<typeof trajectoryFormSchema>;

interface TrajectoryFormProps {
  trajectory?: TrajectoryWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrajectoryForm({ trajectory, onClose, onSuccess }: TrajectoryFormProps) {
  const { toast } = useToast();
  const isEditing = !!trajectory;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<TrajectoryFormData>({
    resolver: zodResolver(trajectoryFormSchema),
    defaultValues: {
      jobTitle: trajectory?.jobTitle || "",
      candidateId: trajectory?.candidateId || undefined,
      clientId: trajectory?.clientId || undefined,
      startDate: trajectory?.startDate ? new Date(trajectory.startDate) : undefined,
      status: trajectory?.status || "interview",
      hourlyRate: trajectory?.hourlyRate || "",
      notes: trajectory?.notes || "",
    },
  });

  // Fetch candidates and clients for dropdowns
  const { data: candidates = [] } = useQuery({
    queryKey: ['/api/candidates'],
    queryFn: () => candidateApi.getAll(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: () => clientApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: trajectoryApi.create,
    onSuccess: () => {
      toast({
        title: "Traject toegevoegd",
        description: "Het traject is succesvol toegevoegd aan het systeem.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het traject.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertTrajectory>) => trajectoryApi.update(trajectory!.id, data),
    onSuccess: () => {
      toast({
        title: "Traject bijgewerkt",
        description: "Het traject is succesvol bijgewerkt.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het traject.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TrajectoryFormData) => {
    // Convert data to the correct format
    const cleanedData = {
      ...data,
      startDate: data.startDate ? format(data.startDate, 'yyyy-MM-dd') : null,
      hourlyRate: data.hourlyRate || null,
      notes: data.notes || null,
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Traject Bewerken' : 'Nieuw Traject Toevoegen'}
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
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functie *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bijv. Vrachtwagenchauffeur" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="interview">In Gesprek</SelectItem>
                          <SelectItem value="proposed">Voorgesteld</SelectItem>
                          <SelectItem value="placed">Geplaatst</SelectItem>
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
                  name="candidateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kandidaat *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={candidates.map((candidate) => ({
                            value: candidate.id.toString(),
                            label: candidate.name
                          }))}
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          placeholder="Selecteer kandidaat"
                          searchPlaceholder="Zoek kandidaat..."
                          emptyMessage="Geen kandidaten gevonden."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opdrachtgever *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={clients.map((client) => ({
                            value: client.id.toString(),
                            label: client.name
                          }))}
                          value={field.value?.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          placeholder="Selecteer opdrachtgever"
                          searchPlaceholder="Zoek opdrachtgever..."
                          emptyMessage="Geen opdrachtgevers gevonden."
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
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startdatum</FormLabel>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd MMMM yyyy", { locale: nl })
                              ) : (
                                <span>Selecteer datum</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setIsCalendarOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarief</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Bijv. €18,50 per uur" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opmerkingen</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Aanvullende informatie over het traject..."
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
                  {isLoading ? (isEditing ? 'Bijwerken...' : 'Toevoegen...') : (isEditing ? 'Bijwerken' : 'Traject Toevoegen')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
