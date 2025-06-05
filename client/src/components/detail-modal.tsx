import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Edit, Plus, Download, Trash2, Upload, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { notesApi, documentsApi } from "@/lib/api";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { CandidateWithRelations, TrajectoryWithRelations, ClientWithRelations } from "@shared/schema";

interface DetailModalProps {
  entity: CandidateWithRelations | TrajectoryWithRelations | ClientWithRelations;
  entityType: 'candidate' | 'trajectory' | 'client';
  onClose: () => void;
  onEdit: () => void;
}

export default function DetailModal({ entity, entityType, onClose, onEdit }: DetailModalProps) {
  const [activeTab, setActiveTab] = useState("information");
  const [newNote, setNewNote] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(entity);
  const { toast } = useToast();

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['/api/notes', entityType, entity.id],
    queryFn: () => notesApi.getByEntity(entityType, entity.id),
  });

  const { data: documents = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['/api/documents', entityType, entity.id],
    queryFn: () => documentsApi.getByEntity(entityType, entity.id),
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) => notesApi.create({
      entityType,
      entityId: entity.id,
      content,
    }),
    onSuccess: () => {
      refetchNotes();
      setNewNote("");
      toast({
        title: "Notitie toegevoegd",
        description: "De notitie is succesvol opgeslagen.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de notitie.",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => documentsApi.delete(documentId),
    onSuccess: () => {
      refetchDocuments();
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'candidate') {
      switch (status) {
        case 'active':
          return <Badge className="status-active">Actief</Badge>;
        case 'placed':
          return <Badge className="status-placed">Geplaatst</Badge>;
        case 'inactive':
          return <Badge className="status-inactive">Inactief</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    } else if (type === 'trajectory') {
      switch (status) {
        case 'interview':
          return <Badge className="status-interview">In Gesprek</Badge>;
        case 'proposed':
          return <Badge className="status-proposed">Voorgesteld</Badge>;
        case 'placed':
          return <Badge className="status-placed">Geplaatst</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createNoteMutation.mutate(newNote);
  };

  const renderInformationTab = () => {
    if (entityType === 'candidate') {
      const candidate = entity as CandidateWithRelations;
      return (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Persoonlijke Gegevens</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Volledige Naam</Label>
                <Input value={candidate.name} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</Label>
                <Input value={candidate.phone || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</Label>
                <Input value={candidate.email || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Woonplaats</Label>
                <Input value={candidate.city || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Regio</Label>
                <Input value={candidate.region || ''} readOnly className="mt-1" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professionele Informatie</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(candidate.status || 'active', 'candidate')}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fase</Label>
                <Input value={candidate.phase || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rijbewijs</Label>
                <div className="space-y-2">
                  {candidate.drivingLicenses && candidate.drivingLicenses.length > 0 ? (
                    candidate.drivingLicenses.map((license) => (
                      <div key={license} className="flex items-center space-x-2">
                        <Checkbox checked={true} disabled />
                        <Label className="text-sm">
                          {license} ({
                            license === 'A' ? 'Motor' :
                            license === 'AM' ? 'Brommer' :
                            license === 'B' ? 'Auto' :
                            license === 'BE' ? 'Auto met aanhanger' :
                            license === 'C' ? 'Vrachtwagen' :
                            license === 'CE' ? 'Vrachtwagen met aanhanger' :
                            license === 'D' ? 'Bus' :
                            license === 'DE' ? 'Bus met aanhanger' :
                            license === 'T' ? 'Trekker' :
                            'Onbekend'
                          })
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Geen rijbewijs opgegeven</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Marketing Bron</Label>
                <Input value={candidate.marketing || ''} readOnly className="mt-1" />
              </div>
            </div>
          </div>

          <div className="col-span-2 mt-8">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Beschrijving</Label>
            <Textarea
              value={candidate.description || ''}
              readOnly
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
      );
    } else if (entityType === 'trajectory') {
      const trajectory = entity as TrajectoryWithRelations;
      return (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trajectinformatie</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Functie</Label>
                <Input value={trajectory.jobTitle || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(trajectory.status || 'interview', 'trajectory')}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarief</Label>
                <Input value={trajectory.hourlyRate || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Startdatum</Label>
                <Input 
                  value={trajectory.startDate ? format(new Date(trajectory.startDate), 'dd-MM-yyyy') : ''} 
                  readOnly 
                  className="mt-1" 
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Betrokken partijen</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kandidaat</Label>
                <Input value={trajectory.candidate?.name || 'Niet gekoppeld'} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opdrachtgever</Label>
                <Input value={trajectory.client?.name || 'Niet gekoppeld'} readOnly className="mt-1" />
              </div>
            </div>
          </div>

          <div className="col-span-2 mt-8">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opmerkingen</Label>
            <Textarea
              value={trajectory.notes || ''}
              readOnly
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
      );
    } else {
      const client = entity as ClientWithRelations;
      return (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bedrijfsinformatie</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bedrijfsnaam</Label>
                <Input value={client.name} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contactpersoon</Label>
                <Input value={client.contactPerson || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Locatie</Label>
                <Input value={client.location || ''} readOnly className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Soort Werkzaamheden</Label>
                <Input value={client.workType || ''} readOnly className="mt-1" />
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-full sm:h-5/6 flex flex-col">
        {/* Modal Header */}
        <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <Avatar className="w-10 h-10 sm:w-16 sm:h-16 flex-shrink-0">
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xl">
                {getInitials(
                  entityType === 'candidate' ? (entity as CandidateWithRelations).name :
                  entityType === 'trajectory' ? (entity as TrajectoryWithRelations).jobTitle || 'T' :
                  (entity as ClientWithRelations).name
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                {entityType === 'candidate' ? (entity as CandidateWithRelations).name :
                 entityType === 'trajectory' ? `${(entity as TrajectoryWithRelations).jobTitle} - ${(entity as TrajectoryWithRelations).client?.name}` :
                 (entity as ClientWithRelations).name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {entityType === 'candidate' ? 
                  `${(entity as CandidateWithRelations).city}, ${(entity as CandidateWithRelations).region} • ${(entity as CandidateWithRelations).phone}` :
                 entityType === 'trajectory' ?
                  `Startdatum: ${(entity as TrajectoryWithRelations).startDate ? format(new Date((entity as TrajectoryWithRelations).startDate!), 'dd MMM yyyy', { locale: nl }) : 'Onbekend'}` :
                  `${(entity as ClientWithRelations).location} • ${(entity as ClientWithRelations).contactPerson}`
                }
              </p>
              <div className="flex items-center mt-2 space-x-2">
                {entityType === 'candidate' ? (
                  <>
                    {getStatusBadge((entity as CandidateWithRelations).status || 'active', 'candidate')}
                    {(entity as CandidateWithRelations).drivingLicenses?.map((license) => (
                      <Badge key={license} className="driving-license-badge">
                        {license}
                      </Badge>
                    ))}
                  </>
                ) : entityType === 'trajectory' ? (
                  getStatusBadge((entity as TrajectoryWithRelations).status || 'interview', 'trajectory')
                ) : (
                  <Badge variant="secondary">{(entity as ClientWithRelations).workType || 'Algemeen'}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            <Button
              className="bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm px-2 sm:px-4"
              onClick={onEdit}
              size="sm"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Bewerken</span>
            </Button>
            <Button variant="ghost" onClick={onClose} size="sm">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col sm:flex-row">
            {/* Tab Navigation */}
            <div className="w-full sm:w-64 bg-gray-50 dark:bg-gray-900 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 p-2 sm:p-4 overflow-x-auto sm:overflow-x-visible">
              <TabsList className="flex sm:flex-col h-auto space-x-1 sm:space-x-0 sm:space-y-1 bg-transparent w-full overflow-x-auto">
                <TabsTrigger 
                  value="information" 
                  className="w-full sm:justify-start justify-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0"
                >
                  Info
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="w-full sm:justify-start justify-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0"
                >
                  Notities
                  <Badge variant="secondary" className="ml-1 sm:ml-auto text-xs">
                    {notes.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="w-full sm:justify-start justify-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0"
                >
                  Docs
                  <Badge variant="secondary" className="ml-1 sm:ml-auto text-xs">
                    {documents.length}
                  </Badge>
                </TabsTrigger>
                {entityType === 'candidate' && (
                  <TabsTrigger 
                    value="trajectories" 
                    className="w-full sm:justify-start justify-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0"
                  >
                    Trajec
                    <Badge variant="secondary" className="ml-1 sm:ml-auto text-xs">
                      {(entity as CandidateWithRelations).trajectories?.length || 0}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <TabsContent value="information" className="mt-0">
                {renderInformationTab()}
              </TabsContent>

              <TabsContent value="notes" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notities</h3>
                </div>

                {/* Add Note Form */}
                <Card>
                  <CardContent className="p-4">
                    <Textarea
                      placeholder="Voeg een notitie toe..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="resize-none mb-3"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || createNoteMutation.isPending}
                        className="bg-primary hover:bg-primary-hover text-white"
                      >
                        {createNoteMutation.isPending ? 'Opslaan...' : 'Opslaan'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes List */}
                <div className="space-y-4">
                  {notes.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Nog geen notities toegevoegd.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    notes.map((note) => (
                      <Card key={note.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                Gebruiker
                              </span>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-500">
                                {note.createdAt ? format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: nl }) : 'Onbekend'}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{note.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Documenten</h3>
                  <Button className="bg-primary hover:bg-primary-hover text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </div>

                {/* Document Upload Area */}
                <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <CardContent className="p-8 text-center">
                    <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Sleep bestanden hierheen of klik om te uploaden</p>
                    <p className="text-sm text-gray-500">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                  </CardContent>
                </Card>

                {/* Documents List */}
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Nog geen documenten geüpload.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    documents.map((document) => (
                      <Card key={document.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{document.filename}</p>
                                <p className="text-sm text-gray-500">
                                  Geüpload op {document.uploadedAt ? format(new Date(document.uploadedAt), 'dd MMM yyyy', { locale: nl }) : 'Onbekend'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteDocumentMutation.mutate(document.id)}
                                disabled={deleteDocumentMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {entityType === 'candidate' && (
                <TabsContent value="trajectories" className="mt-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trajecten</h3>
                    <Button className="bg-primary hover:bg-primary-hover text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Nieuw Traject
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(entity as CandidateWithRelations).trajectories?.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <p className="text-gray-500 dark:text-gray-400">Nog geen trajecten gekoppeld.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      (entity as CandidateWithRelations).trajectories?.map((trajectory) => (
                        <Card key={trajectory.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {trajectory.jobTitle || 'Onbekende functie'}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Gestart op {trajectory.startDate ? format(new Date(trajectory.startDate), 'dd MMM yyyy', { locale: nl }) : 'Onbekende datum'}
                                </p>
                              </div>
                              {getStatusBadge(trajectory.status || 'interview', 'trajectory')}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">TARIEF</Label>
                                <p className="text-sm text-gray-900 dark:text-white">{trajectory.hourlyRate || 'Niet opgegeven'}</p>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">OPMERKINGEN</Label>
                                <p className="text-sm text-gray-900 dark:text-white">{trajectory.notes || 'Geen opmerkingen'}</p>
                              </div>
                            </div>
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
      </div>
    </div>
  );
}
