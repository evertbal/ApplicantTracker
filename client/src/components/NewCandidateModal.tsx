import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { insertCandidateSchema, type InsertCandidate } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewCandidateModal({ isOpen, onClose }: NewCandidateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [drivingLicenses, setDrivingLicenses] = useState<string[]>([]);

  const form = useForm<InsertCandidate>({
    resolver: zodResolver(insertCandidateSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      region: "",
      marketing: "",
      description: "",
      status: "active",
      phase: "intake",
      drivingLicenses: [],
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (data: InsertCandidate) => {
      return apiRequest("POST", "/api/candidates", { ...data, drivingLicense: drivingLicenses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Kandidaat toegevoegd",
        description: "De kandidaat is succesvol toegevoegd aan het systeem.",
      });
      onClose();
      form.reset();
      setDrivingLicenses([]);
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de kandidaat.",
        variant: "destructive",
      });
    },
  });

  const handleDrivingLicenseChange = (license: string, checked: boolean) => {
    if (checked) {
      setDrivingLicenses([...drivingLicenses, license]);
    } else {
      setDrivingLicenses(drivingLicenses.filter(l => l !== license));
    }
  };

  const onSubmit = (data: InsertCandidate) => {
    createCandidateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Nieuwe Kandidaat Toevoegen</DialogTitle>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Volledige Naam *</Label>
              <Input
                id="name"
                {...form.register("name")}
                className="mt-1"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Telefoon</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">Woonplaats</Label>
              <Input
                id="city"
                {...form.register("city")}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="region">Regio</Label>
              <Select onValueChange={(value) => form.setValue("region", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer regio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Noord-Holland">Noord-Holland</SelectItem>
                  <SelectItem value="Zuid-Holland">Zuid-Holland</SelectItem>
                  <SelectItem value="Utrecht">Utrecht</SelectItem>
                  <SelectItem value="Gelderland">Gelderland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="marketing">Marketing Bron</Label>
              <Select onValueChange={(value) => form.setValue("marketing", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecteer bron" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="referral">Doorverwijzing</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="other">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Rijbewijs</Label>
            <div className="grid grid-cols-3 gap-4">
              {[
                'A', 'AM', 'B', 'BE', 'C', 'CE', 'D', 'DE', 'T'
              ].map((license) => (
                <div key={license} className="flex items-center space-x-2">
                  <Checkbox
                    id={license}
                    checked={drivingLicenses.includes(license)}
                    onCheckedChange={(checked) => handleDrivingLicenseChange(license, checked as boolean)}
                  />
                  <Label htmlFor={license} className="text-sm text-gray-700 font-mono">
                    {license}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Korte beschrijving van de kandidaat..."
              {...form.register("description")}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={createCandidateMutation.isPending}
              className="bg-primary hover:bg-primary-hover"
            >
              {createCandidateMutation.isPending ? "Toevoegen..." : "Kandidaat Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
