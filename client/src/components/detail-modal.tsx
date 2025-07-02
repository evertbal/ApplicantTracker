import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Edit, Plus, Download, Trash2, Upload, CloudUpload, FileText, Eye, Paperclip, ZoomIn } from "lucide-react";
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
import { notesApi, documentsApi } from "@/lib/api";
import DocumentUpload from "@/components/document-upload";
import DocumentViewer from "@/components/document-viewer";
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
  const [editData, setEditData] = useState(entity);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['/api/notes', entityType, entity.id],
    queryFn: () => notesApi.getByEntity(entityType, entity.id),
  });

  const { data: documents = [], refetch: refetchDocuments, isError: documentsError } = useQuery({
    queryKey: [`/api/documents/${entityType}/${entity.id}`],
    queryFn: () => documentsApi.getByEntity(entityType, entity.id),
    retry: 1,
    retryOnMount: false,
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

  const handleAddNote = () => {
    if (newNote.trim()) {
      createNoteMutation.mutate(newNote.trim());
    }
  };

  const handleDocumentView = (document: any) => {
    setSelectedDocument(document);
    setIsDocumentViewerOpen(true);
  };

  const handleUploadComplete = () => {
    console.log(`Upload completed for ${entityType} ${entity.id}`);
    // Invalidate queries to refresh document list
    queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entity.id}`] });
    queryClient.invalidateQueries({ queryKey: ['/api/documents', entityType, entity.id] });
    refetchDocuments();
    setShowUploadForm(false);
    toast({
      title: "Upload voltooid",
      description: "Het document is succesvol geüpload.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string, type: string) => {
    const statusConfig: any = {
      candidate: {
        active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Actief' },
        inactive: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', label: 'Inactief' },
        placed: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Geplaatst' }
      },
      trajectory: {
        interview: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', label: 'Interview' },
        selected: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: 'Geselecteerd' },
        placed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', label: 'Geplaatst' },
        rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: 'Afgewezen' }
      }
    };
    
    const config = statusConfig[type]?.[status] || 
                  { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', label: status };
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const renderInformationTab = () => {
    if (entityType === 'candidate') {
      const candidate = entity as CandidateWithRelations;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Naam</Label>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{candidate.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{candidate.email || 'Niet opgegeven'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{candidate.phone || 'Niet opgegeven'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Leeftijd</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{candidate.age || 'Niet opgegeven'}</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Beroep</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{candidate.profession || 'Niet opgegeven'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Regio</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{candidate.region || 'Niet opgegeven'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
              <div className="mt-1">
                {getStatusBadge(candidate.status || 'active', 'candidate')}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rijbewijzen</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {candidate.drivingLicenses && candidate.drivingLicenses.length > 0 ? (
                  candidate.drivingLicenses.map((license, index) => (
                    <Badge key={index} className="driving-license-badge">
                      {license}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Geen rijbewijzen opgegeven</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Datum toegevoegd</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">
                {candidate.dateAdded ? format(new Date(candidate.dateAdded), 'dd MMMM yyyy', { locale: nl }) : 'Onbekend'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Toegevoegd door</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">
                {candidate.addedByUser 
                  ? `${candidate.addedByUser.firstName || ''} ${candidate.addedByUser.lastName || ''}`.trim() || candidate.addedByUser.email || candidate.addedByUser.id
                  : 'Onbekend'
                }
              </p>
            </div>
          </div>
        </div>
      );
    } else if (entityType === 'trajectory') {
      const trajectory = entity as TrajectoryWithRelations;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Functietitel</Label>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{trajectory.jobTitle}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
              <div className="mt-1">
                {getStatusBadge(trajectory.status || 'interview', 'trajectory')}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kandidaat</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{trajectory.candidate?.name || 'Onbekend'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Opdrachtgever</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{trajectory.client?.name || 'Onbekend'}</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Startdatum</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">
                {trajectory.startDate ? format(new Date(trajectory.startDate), 'dd MMMM yyyy', { locale: nl }) : 'Niet opgegeven'}
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      const client = entity as ClientWithRelations;
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Naam</Label>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">{client.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contactpersoon</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{client.contactPerson || 'Niet opgegeven'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{client.email || 'Niet opgegeven'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{client.phone || 'Niet opgegeven'}</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Adres</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{client.address || 'Niet opgegeven'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type werk</Label>
              <p className="text-base text-gray-900 dark:text-white mt-1">{client.workType || 'Algemeen'}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-start justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold">
                  {entityType === 'candidate' 
                    ? getInitials((entity as CandidateWithRelations).name)
                    : entityType === 'trajectory'
                    ? 'T'
                    : getInitials((entity as ClientWithRelations).name)
                  }
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {entityType === 'candidate' 
                    ? (entity as CandidateWithRelations).name
                    : entityType === 'trajectory'
                    ? (entity as TrajectoryWithRelations).jobTitle
                    : (entity as ClientWithRelations).name
                  }
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {entityType === 'candidate' ? (
                    <>
                      {getStatusBadge((entity as CandidateWithRelations).status || 'active', 'candidate')}
                      {(entity as CandidateWithRelations).drivingLicenses?.map((license, index) => (
                        <Badge key={index} className="driving-license-badge">
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
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col sm:flex-row">
              {/* Tab Navigation */}
              <div className="w-full sm:w-72 bg-gray-50 dark:bg-gray-900 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 p-2 sm:p-4 overflow-x-auto sm:overflow-x-visible">
                <TabsList className="flex sm:flex-col h-auto space-x-1 sm:space-x-0 sm:space-y-2 bg-transparent w-full overflow-x-auto">
                  <TabsTrigger 
                    value="information" 
                    className="w-full justify-center sm:justify-start data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4"
                  >
                    <span className="sm:hidden">Info</span>
                    <span className="hidden sm:inline">Informatie</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="w-full justify-center sm:justify-between data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4"
                  >
                    <span className="sm:hidden">Notities</span>
                    <span className="hidden sm:inline">Notities</span>
                    <Badge variant="secondary" className="ml-1 sm:ml-auto text-xs">
                      {notes.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents" 
                    className="w-full justify-center sm:justify-between data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4"
                  >
                    <span className="sm:hidden">Docs</span>
                    <span className="hidden sm:inline">Documenten</span>
                    <Badge variant="secondary" className="ml-1 sm:ml-auto text-xs">
                      {documents.length}
                    </Badge>
                  </TabsTrigger>
                  {entityType === 'candidate' && (
                    <TabsTrigger 
                      value="trajectories" 
                      className="w-full justify-center sm:justify-between data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm flex-shrink-0 py-2 sm:py-3 px-3 sm:px-4"
                    >
                      <span className="sm:hidden">Trajec</span>
                      <span className="hidden sm:inline">Trajecten</span>
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
                      notes.map((note: any) => (
                        <Card key={note.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  Gebruiker
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">
                                  {note.createdAt ? format(new Date(note.createdAt), 'dd MMM yyyy \'om\' HH:mm', { locale: nl }) : 'Onbekend'}
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
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setShowUploadForm(!showUploadForm)}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Document uploaden
                    </Button>
                  </div>

                  {/* Document Upload Component - Show/Hide */}
                  {showUploadForm && (
                    <DocumentUpload 
                      entityType={entityType}
                      entityId={entity.id}
                      onUploadComplete={handleUploadComplete}
                    />
                  )}

                  {/* Documents List */}
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <p className="text-gray-500 dark:text-gray-400">Nog geen documenten geüpload.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      documents.map((document: any) => (
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
                                {document.uploadedAt ? format(new Date(document.uploadedAt), 'dd MMM yyyy', { locale: nl }) : 'Onbekend'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDocumentView(document)}
                              title="Document bekijken"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(document.storageUrl, "_blank")}
                              title="Document downloaden"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteDocumentMutation.mutate(document.id)}
                              disabled={deleteDocumentMutation.isPending}
                              title="Document verwijderen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {entityType === 'candidate' && (
                  <TabsContent value="trajectories" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trajecten</h3>
                    </div>

                    <div className="space-y-3">
                      {(entity as CandidateWithRelations).trajectories?.length === 0 || !(entity as CandidateWithRelations).trajectories ? (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Nog geen trajecten toegevoegd.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        (entity as CandidateWithRelations).trajectories?.map((trajectory: any) => (
                          <Card key={trajectory.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-white">{trajectory.jobTitle}</p>
                                  <p className="text-sm text-gray-500">
                                    {trajectory.client?.name} • {trajectory.startDate ? format(new Date(trajectory.startDate), 'dd MMM yyyy', { locale: nl }) : 'Geen datum'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge(trajectory.status || 'interview', 'trajectory')}
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

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {isDocumentViewerOpen && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={isDocumentViewerOpen}
          onClose={() => {
            setIsDocumentViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </>
  );
}