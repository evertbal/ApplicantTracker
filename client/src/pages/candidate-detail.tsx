import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Edit, Plus, FileText, Trash2, Download } from "lucide-react";
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

export default function CandidateDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

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

                {candidate.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Beschrijving
                    </Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {candidate.description}
                    </p>
                  </div>
                )}
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
                    {candidate.drivingLicenseNotes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Notities
                        </Label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {candidate.drivingLicenseNotes}
                        </p>
                      </div>
                    )}
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notes">
                Notities ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documenten ({documents.length})
              </TabsTrigger>
            </TabsList>

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
                      notes.map((note: Note) => (
                        <div
                          key={note.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {note.content}
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(note.createdAt)}
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
                  <CardTitle>Documenten</CardTitle>
                </CardHeader>
                <CardContent>
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
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        Geen documenten gevonden
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
    </div>
  );
}