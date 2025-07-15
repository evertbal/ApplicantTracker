import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Edit, Plus, FileText, Trash2, Download, Upload, ZoomIn, Route, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CandidateWithRelations, Note, Document } from "@shared/schema";
import CandidateForm from "@/components/candidate-form";
import DocumentUpload from "@/components/document-upload";
import DocumentViewer from "@/components/document-viewer";

import { 
  formatTrajectoryTitle, 
  formatTrajectoryStatus, 
  getTrajectoryStatusColor
} from "@/lib/trajectory-formatters";

export default function CandidateDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);


  // Fetch candidate data
  const { data: candidate, isLoading } = useQuery<CandidateWithRelations>({
    queryKey: ["/api/candidates", id],
    enabled: !!id,
    select: (data: any) => {
      // If data is an array, find the candidate by id
      if (Array.isArray(data)) {
        return data.find((c: any) => c.id === parseInt(id!));
      }
      return data;
    }
  });

  // Fetch notes
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: [`/api/notes/candidate/${id}`],
    enabled: !!id,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/documents/candidate/${id}`],
    enabled: !!id,
  });

  // Fetch candidate trajectories
  const { data: candidateTrajectories = [], isLoading: trajectoriesLoading } = useQuery({
    queryKey: [`/api/trajectories/candidate/${id}`],
    enabled: !!id,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          entityType: "candidate",
          entityId: parseInt(id!),
          content,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create note');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/candidate/${id}`] });
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

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest(`/api/documents/${documentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents/candidate", id] });
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

  const handleDocumentView = (document: Document) => {
    setSelectedDocument(document);
    setIsDocumentViewerOpen(true);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "placed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getUserInitials = (authorId: string | null) => {
    if (!authorId) return "?";
    
    // Handle format like "evert-doeners"
    if (authorId.includes("-")) {
      const parts = authorId.split("-");
      return parts.map(part => part.charAt(0).toUpperCase()).join("");
    } else {
      // Handle simple name format
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

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Kandidaat niet gevonden</div>
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
                  {candidate.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Kandidaat Details
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowEditForm(true)}
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
                <CardTitle>Kandidaat Informatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Beroep
                      </Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {candidate.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Naam
                    </Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {candidate.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {candidate.email || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Telefoon
                    </Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {candidate.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Woonplaats
                    </Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {candidate.city || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Regio
                    </Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {candidate.region || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Marketing
                    </Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {candidate.marketing || "-"}
                    </p>
                  </div>
                </div>


              </CardContent>
            </Card>
          </div>

          {/* Status & Licenses */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status & Fase</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(candidate.status || "")}>
                      {candidate.status || "Onbekend"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fase
                  </Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {candidate.phase || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Datum toegevoegd
                  </Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {candidate.dateAdded ? formatDate(candidate.dateAdded) : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Toegevoegd door
                  </Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {candidate.addedByUser 
                      ? `${candidate.addedByUser.firstName || ''} ${candidate.addedByUser.lastName || ''}`.trim() || candidate.addedByUser.email || candidate.addedByUser.id
                      : "Onbekend"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rijbewijzen</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.drivingLicenses && candidate.drivingLicenses.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {candidate.drivingLicenses.map((license: string) => (
                        <Badge
                          key={license}
                          variant="outline"
                          className="text-xs"
                        >
                          {license}
                        </Badge>
                      ))}
                    </div>

                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Geen rijbewijzen geregistreerd
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for Notes and Documents */}
        <div className="mt-8">
          <Tabs defaultValue="notes" className="w-full">
            <div className="relative">
              <div className="overflow-x-auto">
                <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-3">
                  <TabsTrigger value="notes" className="whitespace-nowrap flex-shrink-0">
                    Notities ({notes.length})
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="whitespace-nowrap flex-shrink-0">
                    Documenten ({documents.length})
                  </TabsTrigger>
                  <TabsTrigger value="trajectories" className="whitespace-nowrap flex-shrink-0">
                    Trajecten ({(candidateTrajectories as any[]).length})
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Fade indicators for scroll */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none md:hidden"></div>
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none md:hidden"></div>
            </div>

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
                      notes.map((note: Note) => (
                        <div
                          key={note.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {getUserInitials(note.authorId)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(note.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        Geen notities gevonden
                      </p>
                    )}
                  </div>
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
                        entityType="candidate"
                        entityId={parseInt(id!)}
                        onUploadComplete={() => {
                          setShowUploadForm(false);
                          queryClient.invalidateQueries({ queryKey: [`/api/documents/candidate/${id}`] });
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
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nog geen documenten geüpload.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trajectories" className="mt-6">
              <div className="space-y-4">
                {trajectoriesLoading ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">Trajecten laden...</p>
                    </CardContent>
                  </Card>
                ) : (candidateTrajectories as any[]).length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Geen trajecten gevonden</p>
                      <p className="text-sm text-gray-400 mt-1">Deze kandidaat heeft nog geen trajecten</p>
                    </CardContent>
                  </Card>
                ) : (
                  (candidateTrajectories as any[]).map((trajectory: any) => (
                    <Card key={trajectory.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                          onClick={() => setLocation(`/trajectory/${trajectory.id}`)}>
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                  {trajectory.jobTitle || "Onbekende functie"}
                                </h3>
                                <div className="flex items-center text-gray-600 mb-3">
                                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                                  <span className="font-medium">
                                    {trajectory.client?.name || "Onbekende opdrachtgever"}
                                  </span>
                                </div>
                              </div>
                              <Badge className={`${getTrajectoryStatusColor(trajectory.status)} text-white px-3 py-1 text-sm font-medium`}>
                                {formatTrajectoryStatus(trajectory.status)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center text-gray-600">
                                <Route className="h-5 w-5 mr-3 text-orange-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Traject ID</p>
                                  <p className="text-sm">#{trajectory.id}</p>
                                </div>
                              </div>
                            </div>

                            {trajectory.description && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {trajectory.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <CandidateForm
          candidate={candidate}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/candidates", id] });
          }}
        />
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={isDocumentViewerOpen}
          onClose={() => {
            setIsDocumentViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {/* Trajectory Detail Modal - TODO: Implement trajectory detail modal */}
    </div>
  );
}