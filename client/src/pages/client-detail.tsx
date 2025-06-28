import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Edit,
  FileText,
  StickyNote,
  Users,
  Plus,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Building2,
  Calendar,
  Trash2,
} from "lucide-react";
import type { ClientWithRelations } from "@shared/schema";
import ClientForm from "@/components/client-form";
import ContactForm from "@/components/contact-form";
import AgreementForm from "@/components/agreement-form";

export default function ClientDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [isAgreementFormOpen, setIsAgreementFormOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState(null);

  const { data: client, isLoading } = useQuery<ClientWithRelations>({
    queryKey: [`/api/clients/${id}`],
  });

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: [`/api/documents/client/${id}`],
  });

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: [`/api/notes/client/${id}`],
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      await apiRequest("DELETE", `/api/clients/${id}/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
      toast({
        title: "Contactpersoon verwijderd",
        description: "De contactpersoon is succesvol verwijderd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddContact = () => {
    setEditingContact(null);
    setIsContactFormOpen(true);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setIsContactFormOpen(true);
  };

  const handleDeleteContact = (contactId: number) => {
    if (confirm("Weet je zeker dat je deze contactpersoon wilt verwijderen?")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Opdrachtgever niet gevonden</h1>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar overzicht
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.workType || "Geen werktype opgegeven"}</p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-primary hover:bg-primary-hover"
        >
          <Edit className="h-4 w-4 mr-2" />
          Bewerken
        </Button>
      </div>

      <Tabs defaultValue="information" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger 
            value="information" 
            className="flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Informatie
          </TabsTrigger>
          <TabsTrigger 
            value="contacts" 
            className="flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Contactpersonen
            <Badge variant="secondary" className="ml-2">
              {client.contacts?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-sm"
          >
            <StickyNote className="h-4 w-4 mr-2" />
            Notities
            <Badge variant="secondary" className="ml-2">
              {notes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            Documenten
            <Badge variant="secondary" className="ml-2">
              {documents.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="information" className="space-y-6">
          {/* Werktype - prominent weergegeven */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">Werktype</label>
            <div className="text-base font-medium text-green-900 dark:text-green-100">
              {client.workType || "Geen werktype opgegeven"}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bedrijfsgegevens</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
                  <p className="text-gray-900">{client.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contactpersoon</label>
                  <p className="text-gray-900">{client.contactPerson || "Niet opgegeven"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                  <p className="text-gray-900">{client.location || "Niet opgegeven"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres Hoofdlocatie</label>
                  <p className="text-gray-900">{client.adresHoofdlocatie || "Niet opgegeven"}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aanvullende Informatie</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum Toegevoegd</label>
                  <p className="text-gray-900">
                    {client.createdAt 
                      ? format(new Date(client.createdAt), "d MMMM yyyy", { locale: nl })
                      : "Niet opgegeven"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Belangrijke Informatie */}
          {client.notities && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Belangrijke Informatie</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{client.notities}</p>
              </div>
            </div>
          )}

          {/* Locaties */}
          {client.locations && client.locations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Locaties</h3>
              <div className="space-y-4">
                {client.locations.map((location: any) => (
                  <div key={location.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Locatienaam</label>
                        <p className="text-gray-900 font-medium">{location.naamLocatie}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Functie</label>
                        <p className="text-gray-900">{location.functie || "Niet opgegeven"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                        <p className="text-gray-900">{location.adres || "Niet opgegeven"}</p>
                      </div>
                      {location.opmerkingen && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Opmerkingen</label>
                          <p className="text-gray-900 whitespace-pre-wrap">{location.opmerkingen}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Contactpersonen</h3>
            <Button 
              className="bg-primary hover:bg-primary-hover"
              onClick={handleAddContact}
            >
              <Plus className="h-4 w-4 mr-2" />
              Contactpersoon toevoegen
            </Button>
          </div>

          <div className="space-y-4">
            {!client.contacts || client.contacts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Nog geen contactpersonen toegevoegd</p>
                </CardContent>
              </Card>
            ) : (
              client.contacts.map((contact: any) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{contact.naam}</h4>
                            {contact.rol && (
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {contact.rol}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {contact.telefoonnummer && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <a href={`tel:${contact.telefoonnummer}`} className="hover:text-primary">
                                {contact.telefoonnummer}
                              </a>
                            </div>
                          )}
                          
                          {contact.emailadres && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <a href={`mailto:${contact.emailadres}`} className="hover:text-primary">
                                {contact.emailadres}
                              </a>
                            </div>
                          )}
                          
                          {contact.geboortedatum && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {format(new Date(contact.geboortedatum), "d MMMM yyyy", { locale: nl })}
                            </div>
                          )}
                        </div>
                        
                        {contact.opmerkingen && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.opmerkingen}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notities</h3>
          </div>
          
          <div className="space-y-4">
            {notes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Nog geen notities toegevoegd</p>
                </CardContent>
              </Card>
            ) : (
              notes.map((note: any) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-500">
                        {format(new Date(note.createdAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                        {note.userId && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {note.userId.split('-')[0]}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Documenten</h3>
          </div>
          
          <div className="space-y-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Nog geen documenten toegevoegd</p>
                </CardContent>
              </Card>
            ) : (
              documents.map((document: any) => (
                <Card key={document.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{document.filename}</h4>
                        <p className="text-sm text-gray-500">
                          Toegevoegd op {format(new Date(document.createdAt), "d MMMM yyyy", { locale: nl })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ClientForm
            client={client}
            onSuccess={() => {
              setIsEditModalOpen(false);
              queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
            }}
            onClose={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Contact Form Modal */}
      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => {
          setIsContactFormOpen(false);
          queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
        }}
        clientId={parseInt(id!)}
        contact={editingContact}
      />
    </div>
  );
}