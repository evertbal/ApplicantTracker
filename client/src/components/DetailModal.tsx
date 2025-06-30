import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  StickyNote, 
  FileText, 
  Route, 
  Edit, 
  X, 
  Upload,
  Download,
  Trash2,
  FilePen,
  FileImage,
  File,
  Users,
  Plus,
  Phone,
  Mail,
  Calendar,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  formatTrajectoryTitle, 
  formatTrajectoryDate, 
  formatTrajectoryStatus, 
  getTrajectoryStatusColor,
  formatCandidateName,
  formatClientName,
  formatJobTitle,
  formatHourlyRate,
  validateTrajectoryData,
  getTrajectorySubtitle
} from "@/lib/trajectory-formatters";
import ContactForm from "./contact-form";
import type { CandidateWithRelations, ClientWithRelations, TrajectoryWithRelations, Note, Document, ClientContact } from "@shared/schema";

interface DetailModalProps {
  entity: CandidateWithRelations | ClientWithRelations | TrajectoryWithRelations;
  entityType: "candidate" | "client" | "trajectory";
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (entity: any) => void;
}

export default function DetailModal({ entity, entityType, isOpen, onClose, onEdit }: DetailModalProps) {
  const { user } = useAuth() as { user: any };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("information");
  const [newNote, setNewNote] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);

  const { data: notes = [] } = useQuery({
    queryKey: [`/api/notes/${entityType}/${entity.id}`],
    enabled: isOpen && activeTab === "notes",
  });

  const { data: documents = [] } = useQuery({
    queryKey: [`/api/documents/${entityType}/${entity.id}`],
    enabled: isOpen && activeTab === "documents",
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/notes", {
        entityType,
        entityId: entity.id,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/notes/${entityType}/${entity.id}`]
      });
      setNewNote("");
      toast({
        title: "Notitie toegevoegd",
        description: "De notitie is succesvol opgeslagen.",
      });
    },
  });

  const handleAddNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote.trim());
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setShowContactForm(true);
  };

  const handleEditContact = (contact: ClientContact) => {
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const handleCloseContactForm = () => {
    setShowContactForm(false);
    setEditingContact(null);
  };

  const handleDeleteContact = async (contactId: number) => {
    if (confirm("Weet je zeker dat je deze contactpersoon wilt verwijderen?")) {
      try {
        await apiRequest("DELETE", `/api/client-contacts/${contactId}`);
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/clients", entity.id] });
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${entity.id}/contacts`] });
        toast({
          title: "Contactpersoon verwijderd",
          description: "De contactpersoon is succesvol verwijderd.",
        });
      } catch (error) {
        toast({
          title: "Fout",
          description: "Er is een fout opgetreden bij het verwijderen van de contactpersoon.",
          variant: "destructive",
        });
      }
    }
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case "candidate":
        return (entity as CandidateWithRelations).name;
      case "client":
        return (entity as ClientWithRelations).name;
      case "trajectory":
        return (entity as TrajectoryWithRelations).jobTitle || "Onbekend traject";
      default:
        return "Onbekend";
    }
  };

  const getEntitySubtitle = () => {
    switch (entityType) {
      case "candidate":
        return (entity as CandidateWithRelations).email || "";
      case "client":
        return (entity as ClientWithRelations).contactPerson || "";
      case "trajectory":
        return getTrajectorySubtitle(entity as TrajectoryWithRelations);
      default:
        return "";
    }
  };

  const getUserInitials = () => {
    const name = user?.firstName || user?.email || "Gebruiker";
    return name.substring(0, 2).toUpperCase();
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FilePen className="h-5 w-5 text-red-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-blue-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground text-sm sm:text-base font-medium">
                  {entityType === "candidate" && <User className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {entityType === "client" && <FileText className="h-5 w-5 sm:h-6 sm:w-6" />}
                  {entityType === "trajectory" && <Route className="h-5 w-5 sm:h-6 sm:w-6" />}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
                  {getEntityTitle()}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">{getEntitySubtitle()}</p>
                {entityType === "candidate" && (
                  <div className="flex flex-wrap items-center mt-2 gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {(entity as CandidateWithRelations).status}
                    </Badge>
                    {(entity as CandidateWithRelations).drivingLicenses?.map((license: any) => (
                      <Badge key={license} variant="secondary" className="bg-blue-100 text-blue-800">
                        {license}
                      </Badge>
                    ))}
                  </div>
                )}
                {entityType === "trajectory" && (
                  <div className="flex flex-wrap items-center mt-2 gap-2">
                    <Badge className={getTrajectoryStatusColor((entity as TrajectoryWithRelations).status)}>
                      {formatTrajectoryStatus((entity as TrajectoryWithRelations).status)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 pr-8">
              {onEdit && (
                <Button 
                  className="bg-primary hover:bg-primary-hover" 
                  size="sm"
                  onClick={() => onEdit(entity)}
                >
                  <Edit className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Bewerken</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col sm:flex-row">
            <div className="w-full sm:w-72 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200 p-3 sm:p-4">
              <TabsList className="flex flex-col sm:flex-col w-full gap-2 bg-transparent h-auto space-y-1">
                <TabsTrigger 
                  value="information" 
                  className="w-full justify-start bg-white border border-gray-200 text-primary shadow-sm text-sm py-3 px-4"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span>Informatie</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="w-full justify-between text-gray-700 hover:bg-white hover:shadow-sm text-sm py-3 px-4"
                >
                  <div className="flex items-center">
                    <StickyNote className="h-4 w-4 mr-2" />
                    <span>Notities</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {(notes as any[])?.length || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="w-full justify-between text-gray-700 hover:bg-white hover:shadow-sm text-sm py-3 px-4"
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Documenten</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {(documents as any[])?.length || 0}
                  </Badge>
                </TabsTrigger>
                {entityType === "client" && (
                  <TabsTrigger 
                    value="contacts" 
                    className="w-full justify-between text-gray-700 hover:bg-white hover:shadow-sm text-sm py-3 px-4"
                  >
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Contactpersonen</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {((entity as any)?.contacts as any[])?.length || 0}
                    </Badge>
                  </TabsTrigger>
                )}
                {entityType === "candidate" && (
                  <TabsTrigger 
                    value="trajectories" 
                    className="w-full justify-between text-gray-700 hover:bg-white hover:shadow-sm text-sm py-3 px-4"
                  >
                    <div className="flex items-center">
                      <Route className="h-4 w-4 mr-2" />
                      <span>Trajecten</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {(entity as CandidateWithRelations).trajectories?.length || 0}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <TabsContent value="information" className="m-0">
                {entityType === "candidate" && (
                  <div className="space-y-6">
                    {/* Beroep eerst - prominent weergegeven */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Beroep</label>
                      <div className="text-base font-medium text-blue-900 dark:text-blue-100">
                        {(entity as CandidateWithRelations).description || "Geen beroep opgegeven"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Persoonlijke Gegevens</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Volledige Naam</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).phone || "Niet opgegeven"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).email || "Niet opgegeven"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Woonplaats</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).city || "Niet opgegeven"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Regio</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).region || "Niet opgegeven"}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Professionele Informatie</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).status || "Niet opgegeven"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).phase || "Niet opgegeven"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marketing Bron</label>
                            <p className="text-gray-900">{(entity as CandidateWithRelations).marketing || "Niet opgegeven"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {entityType === "client" && (
                  <div className="space-y-6">
                    {/* Werktype eerst - prominent weergegeven */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                      <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">Werktype</label>
                      <div className="text-base font-medium text-green-900 dark:text-green-100">
                        {(entity as ClientWithRelations).workType || "Geen werktype opgegeven"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bedrijfsgegevens</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijfsnaam</label>
                            <p className="text-gray-900">{(entity as ClientWithRelations).name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contactpersoon</label>
                            <p className="text-gray-900">{(entity as ClientWithRelations).contactPerson || "Niet opgegeven"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                            <p className="text-gray-900">{(entity as ClientWithRelations).location || "Niet opgegeven"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adres Hoofdlocatie</label>
                            <p className="text-gray-900">{(entity as ClientWithRelations).adresHoofdlocatie || "Niet opgegeven"}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aanvullende Informatie</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Datum Toegevoegd</label>
                            <p className="text-gray-900">
                              {(entity as ClientWithRelations).createdAt 
                                ? format(new Date((entity as ClientWithRelations).createdAt!), "d MMMM yyyy", { locale: nl })
                                : "Niet opgegeven"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Belangrijke Informatie */}
                    {(entity as ClientWithRelations).notities && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Belangrijke Informatie</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">{(entity as ClientWithRelations).notities}</p>
                        </div>
                      </div>
                    )}

                    {/* Locaties */}
                    {(entity as ClientWithRelations).locations && (entity as ClientWithRelations).locations!.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Locaties</h3>
                        <div className="space-y-4">
                          {(entity as ClientWithRelations).locations!.map((location: any) => (
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


                  </div>
                )}

                {entityType === "trajectory" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Traject Informatie</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Functietitel</label>
                            <p className="text-gray-900">{formatJobTitle(entity as TrajectoryWithRelations)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <p className="text-gray-900">{formatTrajectoryStatus((entity as TrajectoryWithRelations).status)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
                            <p className="text-gray-900">{formatTrajectoryDate((entity as TrajectoryWithRelations).startDate)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Uurtarief</label>
                            <p className="text-gray-900">{formatHourlyRate((entity as TrajectoryWithRelations).hourlyRate)}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Betrokkenen</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kandidaatnaam</label>
                            <p className="text-gray-900">{formatCandidateName(entity as TrajectoryWithRelations)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Opdrachtgever</label>
                            <p className="text-gray-900">{formatClientName(entity as TrajectoryWithRelations)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="m-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notities</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <Textarea
                    rows={3}
                    placeholder="Voeg een notitie toe..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <Button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || createNoteMutation.isPending}
                      className="bg-primary hover:bg-primary-hover"
                    >
                      {createNoteMutation.isPending ? "Opslaan..." : "Opslaan"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {(notes as any[])?.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500">Nog geen notities toegevoegd</p>
                      </CardContent>
                    </Card>
                  ) : (
                    (notes as any[])?.map((note: any) => (
                      <Card key={note.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {getUserInitials()}
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {format(new Date(note.createdAt!), "d MMM yyyy 'om' HH:mm", { locale: nl })}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700">{note.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="m-0">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Documenten</h3>
                  <Button className="bg-primary hover:bg-primary-hover">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Sleep bestanden hierheen of klik om te uploaden</p>
                  <p className="text-sm text-gray-500">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                </div>

                <div className="space-y-3">
                  {(documents as any[])?.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500">Nog geen documenten geüpload</p>
                      </CardContent>
                    </Card>
                  ) : (
                    (documents as any[])?.map((document: any) => (
                      <Card key={document.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              {getFileIcon(document.filename)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{document.filename}</p>
                              <p className="text-sm text-gray-500">
                                Geüpload op {format(new Date(document.createdAt!), "d MMM yyyy", { locale: nl })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {entityType === "client" && (
                <TabsContent value="contacts" className="m-0">
                  <div className="flex items-center justify-between mb-6">
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
                    {((entity as any)?.contacts as any[])?.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <p className="text-gray-500">Nog geen contactpersonen toegevoegd</p>
                        </CardContent>
                      </Card>
                    ) : (
                      ((entity as any)?.contacts as any[])?.map((contact: any) => (
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
                                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm text-gray-700">{contact.opmerkingen}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex space-x-2 ml-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-primary hover:text-primary-hover"
                                  onClick={() => handleEditContact(contact)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteContact(contact.id)}
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
              )}

              {entityType === "candidate" && (
                <TabsContent value="trajectories" className="m-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Trajecten</h3>
                    <Button className="bg-primary hover:bg-primary-hover">
                      <Route className="h-4 w-4 mr-2" />
                      Nieuw Traject
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(entity as CandidateWithRelations).trajectories?.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <p className="text-gray-500">Nog geen trajecten toegevoegd</p>
                        </CardContent>
                      </Card>
                    ) : (
                      (entity as CandidateWithRelations).trajectories?.map((trajectory) => (
                        <Card key={trajectory.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{trajectory.jobTitle}</h4>
                                <p className="text-sm text-gray-600">
                                  Gestart op {trajectory.startDate ? format(new Date(trajectory.startDate), "d MMM yyyy", { locale: nl }) : "Onbekend"}
                                </p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">
                                {trajectory.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">TARIEF</label>
                                <p className="text-sm text-gray-900">{trajectory.hourlyRate}</p>
                              </div>
                            </div>
                            {trajectory.status && (
                              <p className="text-sm text-gray-600 mt-4">Status: {trajectory.status}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

    {/* Contact Form Modal */}
    {showContactForm && entityType === "client" && (
      <ContactForm
        isOpen={showContactForm}
        onClose={handleCloseContactForm}
        clientId={(entity as ClientWithRelations).id}
        contact={editingContact}
      />
    )}
    </>
  );
}