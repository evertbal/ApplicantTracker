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

  const { data: agreements = [] } = useQuery<any[]>({
    queryKey: [`/api/clients/${id}/agreements`],
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

  const deleteAgreementMutation = useMutation({
    mutationFn: async (agreementId: number) => {
      await apiRequest("DELETE", `/api/clients/${id}/agreements/${agreementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/agreements`] });
      toast({
        title: "Afspraak verwijderd",
        description: "De afspraak is succesvol verwijderd.",
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

  const handleAddAgreement = () => {
    setEditingAgreement(null);
    setIsAgreementFormOpen(true);
  };

  const handleEditAgreement = (agreement: any) => {
    setEditingAgreement(agreement);
    setIsAgreementFormOpen(true);
  };

  const handleDeleteAgreement = (agreementId: number) => {
    if (confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) {
      deleteAgreementMutation.mutate(agreementId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Laden...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Opdrachtgever niet gevonden</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {client.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Opdrachtgever Details
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bewerken
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Opdrachtgever Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Bedrijfsnaam
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Contactpersoon
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.contactPerson || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Locatie
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.location || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Werktype
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.workType || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Adres Hoofdlocatie
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.adresHoofdlocatie || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Notities
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {client.notities || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status & Additional Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aanvullende Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Werktype
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {client.workType || "Niet opgegeven"}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Datum toegevoegd
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {client.createdAt ? format(new Date(client.createdAt), "d MMM yyyy, HH:mm", { locale: nl }) : "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Aantal contactpersonen
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {client.contacts?.length || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Aantal afspraken
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {agreements.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for additional content */}
        <div className="mt-8">
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contacts">
                Contactpersonen ({client.contacts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="notes">
                Notities ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="agreements">
                Specifieke Afspraken ({agreements.length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documenten ({documents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Contactpersonen</CardTitle>
                    <Button
                      onClick={() => setIsNewContactModalOpen(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nieuwe Contactpersoon
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {client.contacts && client.contacts.length > 0 ? (
                    <div className="space-y-4">
                      {client.contacts.map((contact) => (
                        <div key={contact.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Naam
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {contact.name}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Rol
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {contact.role}
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Email
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {contact.email || "-"}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Telefoon
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {contact.phone || "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingContact(contact);
                                  setIsNewContactModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Geen contactpersonen gevonden.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Notities</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setIsAddingNote(true)}
                      className="bg-primary hover:bg-primary-hover text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nieuwe Notitie
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAddingNote && (
                    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Voer je notitie in..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingNote(false);
                              setNewNote("");
                            }}
                          >
                            Annuleren
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || addNoteMutation.isPending}
                            className="bg-primary hover:bg-primary-hover text-white"
                          >
                            {addNoteMutation.isPending ? "Toevoegen..." : "Toevoegen"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-white mb-2">
                                {note.content}
                              </p>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-2">
                                  {getUserInitials(note.authorId)}
                                </div>
                                {formatDate(note.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nog geen notities toegevoegd.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agreements" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Specifieke Afspraken</CardTitle>
                    <Button
                      onClick={() => setIsNewAgreementModalOpen(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nieuwe Afspraak
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {agreements.length > 0 ? (
                    <div className="space-y-4">
                      {agreements.map((agreement) => (
                        <div key={agreement.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Titel
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white font-medium">
                                  {agreement.title}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Beschrijving
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {agreement.description}
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Status
                                  </label>
                                  <Badge variant="outline" className="text-xs">
                                    {agreement.status}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Datum
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {agreement.agreementDate ? format(new Date(agreement.agreementDate), "d MMM yyyy", { locale: nl }) : "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingAgreement(agreement);
                                  setIsNewAgreementModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAgreement(agreement.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Geen specifieke afspraken gevonden.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Documenten</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setIsAddingDocument(true)}
                      className="bg-primary hover:bg-primary-hover text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Document Toevoegen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((document) => (
                        <div key={document.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {document.filename}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Toegevoegd: {formatDate(document.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(document.url, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDocument(document.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Geen documenten gevonden.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Opdrachtgever Bewerken</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            onClose={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={isNewContactModalOpen} onOpenChange={setIsNewContactModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Contactpersoon Bewerken" : "Nieuwe Contactpersoon"}
            </DialogTitle>
          </DialogHeader>
          <ContactForm
            clientId={client.id}
            contact={editingContact}
            onClose={() => {
              setIsNewContactModalOpen(false);
              setEditingContact(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Agreement Modal */}
      <Dialog open={isNewAgreementModalOpen} onOpenChange={setIsNewAgreementModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAgreement ? "Afspraak Bewerken" : "Nieuwe Afspraak"}
            </DialogTitle>
          </DialogHeader>
          <AgreementForm
            clientId={client.id}
            agreement={editingAgreement}
            onClose={() => {
              setIsNewAgreementModalOpen(false);
              setEditingAgreement(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
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

        <TabsContent value="agreements" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Specifieke Afspraken</h3>
            <Button onClick={handleAddAgreement} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe afspraak
            </Button>
          </div>
          
          <div className="space-y-4">
            {agreements.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Nog geen afspraken toegevoegd</p>
                </CardContent>
              </Card>
            ) : (
              agreements.map((agreement: any) => (
                <Card key={agreement.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{agreement.title}</h4>
                            <p className="text-sm text-gray-500">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Toegevoegd op {format(new Date(agreement.createdAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {agreement.description.length > 200 
                              ? `${agreement.description.substring(0, 200)}...` 
                              : agreement.description
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditAgreement(agreement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAgreement(agreement.id)}
                          className="text-red-600 hover:text-red-700"
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

      {/* Agreement Form Modal */}
      <AgreementForm
        isOpen={isAgreementFormOpen}
        onClose={() => {
          setIsAgreementFormOpen(false);
          setEditingAgreement(null);
        }}
        clientId={parseInt(id!)}
        agreement={editingAgreement}
      />
    </div>
  );
}