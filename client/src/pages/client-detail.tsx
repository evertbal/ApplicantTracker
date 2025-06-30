import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Edit, Plus, FileText, Trash2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { ClientWithRelations, Note, Document, ClientAgreement } from "@shared/schema";
import ClientForm from "@/components/client-form";
import ContactForm from "@/components/contact-form";
import AgreementForm from "@/components/agreement-form";
import DocumentUpload from "@/components/document-upload";

export default function ClientDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isNewAgreementModalOpen, setIsNewAgreementModalOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editingAgreement, setEditingAgreement] = useState<any>(null);

  // Fetch client data
  const { data: client, isLoading } = useQuery<ClientWithRelations>({
    queryKey: ["/api/clients", id],
    enabled: !!id,
    select: (data: any) => {
      if (Array.isArray(data)) {
        return data.find((c: any) => c.id === parseInt(id!));
      }
      return data;
    }
  });

  // Fetch notes
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: [`/api/notes/client/${id}`],
    enabled: !!id,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/documents/client/${id}`],
    enabled: !!id,
  });

  // Fetch agreements
  const { data: agreements = [] } = useQuery<ClientAgreement[]>({
    queryKey: [`/api/clients/${id}/agreements`],
    enabled: !!id,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/notes/client/${id}`, {
        content,
        entityType: "client",
        entityId: parseInt(id!)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/client/${id}`] });
      setNewNote("");
      setIsAddingNote(false);
      toast({
        title: "Notitie toegevoegd",
        description: "De notitie is succesvol toegevoegd.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de notitie.",
        variant: "destructive",
      });
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      await apiRequest("DELETE", `/api/clients/${id}/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", id] });
      toast({
        title: "Contactpersoon verwijderd",
        description: "De contactpersoon is succesvol verwijderd.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de contactpersoon.",
        variant: "destructive",
      });
    },
  });

  // Delete agreement mutation
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
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de afspraak.",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/client/${id}`] });
      toast({
        title: "Document verwijderd",
        description: "Het document is succesvol verwijderd.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van het document.",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    setLocation("/");
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  const handleDeleteContact = (contactId: number) => {
    if (confirm("Weet je zeker dat je deze contactpersoon wilt verwijderen?")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleDeleteAgreement = (agreementId: number) => {
    if (confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) {
      deleteAgreementMutation.mutate(agreementId);
    }
  };

  const handleDeleteDocument = (documentId: number) => {
    if (confirm("Weet je zeker dat je dit document wilt verwijderen?")) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (authorId: string | null) => {
    if (!authorId) return "?";
    
    if (authorId.includes("-")) {
      const parts = authorId.split("-");
      return parts.map(part => part.charAt(0).toUpperCase()).join("");
    } else {
      return authorId.split(" ").map(name => name.charAt(0).toUpperCase()).join("");
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
                onClick={handleBack}
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
            <div className="relative">
              <div className="overflow-x-auto">
                <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-4">
                  <TabsTrigger value="contacts" className="whitespace-nowrap flex-shrink-0">
                    Contactpersonen ({client.contacts?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="whitespace-nowrap flex-shrink-0">
                    Notities ({notes.length})
                  </TabsTrigger>
                  <TabsTrigger value="agreements" className="whitespace-nowrap flex-shrink-0">
                    Specifieke Afspraken ({agreements.length})
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="whitespace-nowrap flex-shrink-0">
                    Documenten ({documents.length})
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Fade indicators for scroll */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none md:hidden"></div>
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none md:hidden"></div>
            </div>

            <TabsContent value="contacts" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <CardTitle>Contactpersonen</CardTitle>
                    <Button
                      onClick={() => setIsNewContactModalOpen(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white w-full md:w-auto"
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
                                  {contact.naam}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Rol
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {contact.rol}
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Email
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {contact.emailadres || "-"}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Telefoon
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {contact.telefoonnummer || "-"}
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
                  <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <CardTitle>Notities</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setIsAddingNote(true)}
                      className="bg-primary hover:bg-primary-hover text-white w-full md:w-auto"
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
                  <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <CardTitle>Specifieke Afspraken</CardTitle>
                    <Button
                      onClick={() => setIsNewAgreementModalOpen(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white w-full md:w-auto"
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
                            <div className="flex-1">
                              <div className="mb-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {agreement.title}
                                </p>
                              </div>
                              <div className="mb-2">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {agreement.description}
                                </p>
                              </div>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-2">
                                  {getUserInitials(agreement.authorId)}
                                </div>
                                {formatDate(agreement.createdAt)}
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
                  <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <CardTitle>Documenten</CardTitle>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setShowUploadForm(!showUploadForm)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Document uploaden
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Document Upload Component - Show/Hide */}
                  {showUploadForm && (
                    <div className="mb-6">
                      <DocumentUpload 
                        entityType="client"
                        entityId={parseInt(id!)}
                        onUploadComplete={() => {
                          setShowUploadForm(false);
                          queryClient.invalidateQueries({ queryKey: [`/api/documents/client/${id}`] });
                          toast({
                            title: "Upload voltooid",
                            description: "Het document is succesvol geüpload.",
                          });
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    {documents.length > 0 ? (
                      documents.map((document: Document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {document.filename}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(document.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(document.storageUrl, "_blank")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDocumentMutation.mutate(document.id)}
                              disabled={deleteDocumentMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nog geen documenten geüpload.
                      </p>
                    )}
                  </div>
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
            onSuccess={() => {
              setIsEditModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/clients", id] });
            }}
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
            isOpen={isNewContactModalOpen}
            onClose={() => {
              setIsNewContactModalOpen(false);
              setEditingContact(null);
            }}
            clientId={client.id}
            contact={editingContact}
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
            isOpen={isNewAgreementModalOpen}
            onClose={() => {
              setIsNewAgreementModalOpen(false);
              setEditingAgreement(null);
            }}
            clientId={client.id}
            agreement={editingAgreement}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}