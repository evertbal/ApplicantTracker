import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Plus, FileText, Download, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { notesApi, documentsApi } from "@/lib/api";
import DocumentUpload from "@/components/document-upload";
import TrajectoryForm from "@/components/trajectory-form";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { TrajectoryWithRelations, Note, Document } from "@shared/schema";
import { 
  formatTrajectoryStatus, 
  getTrajectoryStatusColor 
} from "@/lib/trajectory-formatters";

export default function TrajectoryDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  const { data: trajectory, isLoading, error } = useQuery<TrajectoryWithRelations>({
    queryKey: ["/api/trajectories", id],
    enabled: !!id,
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: [`/api/notes/trajectory/${id}`],
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/documents/trajectory/${id}`],
    enabled: !!id,
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => notesApi.create({
      entityType: "trajectory",
      entityId: parseInt(id!),
      content,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/trajectory/${id}`] });
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

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => documentsApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/trajectory/${id}`] });
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
      addNoteMutation.mutate(newNote.trim());
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Onbekend";
    return format(new Date(dateString), 'dd MMM yyyy \'om\' HH:mm', { locale: nl });
  };

  const getUserInitials = (userId: string | null) => {
    if (!userId) return "?";
    return userId.split("-").map(part => part.charAt(0).toUpperCase()).join("").slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Traject laden...</p>
        </div>
      </div>
    );
  }

  if (error || !trajectory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Fout bij het laden van het traject</p>
          <Link href="/trajectories">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar Trajecten
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/trajectories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {trajectory.jobTitle}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {trajectory.candidate?.name} bij {trajectory.client?.name}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowEditForm(true)}
          className="bg-primary hover:bg-primary-hover text-white w-full md:w-auto"
        >
          <Edit className="w-4 h-4 mr-2" />
          Bewerken
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Traject Informatie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Functietitel
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {trajectory.jobTitle}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <Badge className={getTrajectoryStatusColor(trajectory.status)}>
                    {formatTrajectoryStatus(trajectory.status)}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Startdatum
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {trajectory.startDate ? format(new Date(trajectory.startDate), 'dd MMM yyyy', { locale: nl }) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Uurtarief
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {trajectory.hourlyRate || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Related Info */}
        <div className="space-y-6">
          {/* Candidate Info */}
          <Card>
            <CardHeader>
              <CardTitle>Kandidaat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {trajectory.candidate?.name}
                </p>
                {trajectory.candidate?.email && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trajectory.candidate.email}
                  </p>
                )}
                {trajectory.candidate?.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trajectory.candidate.phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Opdrachtgever</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {trajectory.client?.name}
                </p>
                {trajectory.client?.contactPerson && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contactpersoon: {trajectory.client.contactPerson}
                  </p>
                )}
                {trajectory.client?.email && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trajectory.client.email}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for Notes and Documents */}
      <div className="mt-8">
        <Tabs defaultValue="notes" className="w-full">
          <div className="relative">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-2">
                <TabsTrigger value="notes" className="whitespace-nowrap flex-shrink-0">
                  Notities ({notes.length})
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
                              {note.createdAt ? formatDate(note.createdAt) : 'Onbekend'}
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
                      Nog geen notities toegevoegd
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
                      entityType="trajectory"
                      entityId={parseInt(id!)}
                      onUploadComplete={() => {
                        setShowUploadForm(false);
                        queryClient.invalidateQueries({ queryKey: [`/api/documents/trajectory/${id}`] });
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
                              {document.uploadedAt ? formatDate(document.uploadedAt) : 'Onbekend'}
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

      {/* Edit Form Modal */}
      {showEditForm && (
        <TrajectoryForm
          trajectory={trajectory}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}