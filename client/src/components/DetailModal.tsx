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
  File
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CandidateWithRelations, ClientWithRelations, TrajectoryWithRelations, Note, Document } from "@shared/schema";

interface DetailModalProps {
  entity: CandidateWithRelations | ClientWithRelations | TrajectoryWithRelations;
  entityType: "candidate" | "client" | "trajectory";
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailModal({ entity, entityType, isOpen, onClose }: DetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("information");
  const [newNote, setNewNote] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: [`/api/notes/${entityType}/${entity.id}`],
    enabled: isOpen && activeTab === "notes",
  });

  const { data: documents = [] } = useQuery({
    queryKey: [`/api/documents/${entityType}/${entity.id}`],
    enabled: isOpen && activeTab === "documents",
  });

  const createNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest("POST", "/api/notes", {
        entityType,
        entityId: entity.id,
        text,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${entityType}/${entity.id}`] });
      setNewNote("");
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

  const handleAddNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote.trim());
    }
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case "candidate":
        return (entity as CandidateWithRelations).name;
      case "client":
        return (entity as ClientWithRelations).name;
      case "trajectory":
        const trajectory = entity as TrajectoryWithRelations;
        return `${trajectory.position} - ${trajectory.client?.name}`;
      default:
        return "Details";
    }
  };

  const getEntitySubtitle = () => {
    switch (entityType) {
      case "candidate":
        const candidate = entity as CandidateWithRelations;
        return `${candidate.city}, ${candidate.region} • ${candidate.phone}`;
      case "client":
        const client = entity as ClientWithRelations;
        return `${client.contactPerson} • ${client.location}`;
      case "trajectory":
        const trajectory = entity as TrajectoryWithRelations;
        return `Kandidaat: ${trajectory.candidate?.name}`;
      default:
        return "";
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FilePen className="h-5 w-5 text-red-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-green-600" />;
      default:
        return <File className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-5/6 flex flex-col">
        <DialogHeader className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xl font-medium">
                  {getInitials(getEntityTitle())}
                </span>
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold text-gray-900">
                  {getEntityTitle()}
                </DialogTitle>
                <p className="text-sm text-gray-600">{getEntitySubtitle()}</p>
                {entityType === "candidate" && (
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge className="bg-green-100 text-green-800">
                      {(entity as CandidateWithRelations).status}
                    </Badge>
                    {(entity as CandidateWithRelations).drivingLicense?.map((license) => (
                      <Badge key={license} variant="secondary" className="bg-blue-100 text-blue-800">
                        {license}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-primary hover:bg-primary-hover">
                <Edit className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex">
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
              <TabsList className="grid w-full grid-cols-1 gap-1 bg-transparent">
                <TabsTrigger 
                  value="information" 
                  className="justify-start bg-white border border-gray-200 text-primary shadow-sm"
                >
                  <User className="h-4 w-4 mr-2" />
                  Informatie
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="justify-start text-gray-700 hover:bg-white hover:shadow-sm"
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  Notities
                  <Badge variant="secondary" className="ml-auto">
                    {notes.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="justify-start text-gray-700 hover:bg-white hover:shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Documenten
                  <Badge variant="secondary" className="ml-auto">
                    {documents.length}
                  </Badge>
                </TabsTrigger>
                {entityType === "candidate" && (
                  <TabsTrigger 
                    value="trajectories" 
                    className="justify-start text-gray-700 hover:bg-white hover:shadow-sm"
                  >
                    <Route className="h-4 w-4 mr-2" />
                    Trajecten
                    <Badge variant="secondary" className="ml-auto">
                      {(entity as CandidateWithRelations).trajectories?.length || 0}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="information" className="m-0">
                {entityType === "candidate" && (
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Persoonlijke Gegevens</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Volledige Naam</label>
                          <Input value={(entity as CandidateWithRelations).name} readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon</label>
                          <Input value={(entity as CandidateWithRelations).phone || ""} readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                          <Input value={(entity as CandidateWithRelations).email || ""} readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Woonplaats</label>
                          <Input value={(entity as CandidateWithRelations).city || ""} readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Regio</label>
                          <Input value={(entity as CandidateWithRelations).region || ""} readOnly />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Professionele Informatie</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <Input value={(entity as CandidateWithRelations).status || ""} readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                          <Input value={(entity as CandidateWithRelations).phase || ""} readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Marketing Bron</label>
                          <Input value={(entity as CandidateWithRelations).marketing || ""} readOnly />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beschrijving</label>
                      <Textarea 
                        value={(entity as CandidateWithRelations).description || ""} 
                        rows={4} 
                        readOnly 
                      />
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
                  {notes.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500">Nog geen notities toegevoegd</p>
                      </CardContent>
                    </Card>
                  ) : (
                    notes.map((note: Note) => (
                      <Card key={note.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {getUserInitials()}
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {format(new Date(note.timestamp!), "d MMM yyyy, HH:mm", { locale: nl })}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700">{note.text}</p>
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
                  {documents.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500">Nog geen documenten geüpload</p>
                      </CardContent>
                    </Card>
                  ) : (
                    documents.map((document: Document) => (
                      <Card key={document.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              {getFileIcon(document.filename)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{document.filename}</p>
                              <p className="text-sm text-gray-500">
                                Geüpload op {format(new Date(document.uploadedAt!), "d MMM yyyy", { locale: nl })}
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
                                <h4 className="text-lg font-semibold text-gray-900">{trajectory.position}</h4>
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
                                <p className="text-sm text-gray-900">{trajectory.rate}</p>
                              </div>
                            </div>
                            {trajectory.notes && (
                              <p className="text-sm text-gray-600 mt-4">{trajectory.notes}</p>
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
  );
}
