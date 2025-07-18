import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Edit, Plus, FileText, Trash2, Download, Upload, ZoomIn, Users, Briefcase, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { TrajectoryWithRelations, Note, Document } from "@shared/schema";
import TrajectoryForm from "@/components/trajectory-form";
import OneDriveLink from "@/components/onedrive-link";
import { NoteEditor } from "@/components/note-editor";

import { 
  formatTrajectoryTitle, 
  formatTrajectoryStatus, 
  getTrajectoryStatusColor
} from "@/lib/trajectory-formatters";

export default function TrajectoryDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);


  // Fetch trajectory data
  const { data: trajectory, isLoading } = useQuery<TrajectoryWithRelations>({
    queryKey: ["/api/trajectories", id],
    enabled: !!id,
    select: (data: any) => {
      // If data is an array, find the trajectory by id
      if (Array.isArray(data)) {
        return data.find((t: any) => t.id === parseInt(id!));
      }
      return data;
    }
  });

  // Fetch notes
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: [`/api/notes/trajectory/${id}`],
    enabled: !!id,
  });

  // Fetch documents
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: [`/api/documents/trajectory/${id}`],
    enabled: !!id,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/notes', {
        entityType: 'trajectory',
        entityId: parseInt(id!),
        content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/trajectory/${id}`] });
      setNewNote("");
      setIsAddingNote(false);
      toast({
        title: "Notitie toegevoegd",
        description: "De notitie is succesvol toegevoegd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen notitie",
        description: error.message || "Er is een fout opgetreden.",
        variant: "destructive",
      });
    }
  });



  const getStatusBadge = (status: string) => {
    const colorClasses = getTrajectoryStatusColor(status);
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClasses}`}>
        {formatTrajectoryStatus(status)}
      </span>
    );
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote);
  };





  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Traject laden...</p>
        </div>
      </div>
    );
  }

  if (!trajectory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Traject niet gevonden</p>
          <Button
            variant="outline"
            onClick={() => setLocation("/trajectories")}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar trajecten
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/trajectories")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Terug</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {trajectory.jobTitle || 'Onbekende functie'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {trajectory.client?.name || 'Onbekende opdrachtgever'} - {trajectory.candidate?.name || 'Onbekende kandidaat'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(trajectory.status || 'interview')}
            <Button
              onClick={() => setShowEditForm(true)}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bewerken
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notities ({notes.length})</TabsTrigger>
              <TabsTrigger value="documents">Documenten ({documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <div className="grid gap-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Traject Informatie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Functietitel</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.jobTitle || 'Niet opgegeven'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(trajectory.status || 'interview')}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Traject ID</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          #{trajectory.id}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Locatie</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.location || 'Niet opgegeven'}
                        </p>
                      </div>
                    </div>
                    
                    {trajectory.description && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-500">Beschrijving</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                          {trajectory.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Candidate Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Kandidaat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Naam</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.candidate?.name || 'Onbekend'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.candidate?.email || 'Niet opgegeven'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Telefoon</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.candidate?.phone || 'Niet opgegeven'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Beroep</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.candidate?.profession || 'Niet opgegeven'}
                        </p>
                      </div>
                    </div>
                    {trajectory.candidate && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/candidate/${trajectory.candidate?.id}`)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Bekijk kandidaat
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Client Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      Opdrachtgever
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Bedrijfsnaam</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.client?.name || 'Onbekend'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Contactpersoon</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.client?.contactPerson || 'Niet opgegeven'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.client?.email || 'Niet opgegeven'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Telefoon</Label>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                          {trajectory.client?.phone || 'Niet opgegeven'}
                        </p>
                      </div>
                    </div>
                    {trajectory.client && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/client/${trajectory.client?.id}`)}
                        >
                          <Building className="w-4 h-4 mr-2" />
                          Bekijk opdrachtgever
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Notities
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setIsAddingNote(true)}
                      className="bg-primary hover:bg-primary-hover"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Notitie toevoegen
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isAddingNote && (
                    <div className="mb-4 p-4 border rounded-lg">
                      <Label className="text-sm font-medium mb-2 block">Nieuwe notitie</Label>
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Voer je notitie in..."
                        className="mb-3"
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleAddNote}
                          disabled={!newNote.trim() || addNoteMutation.isPending}
                        >
                          {addNoteMutation.isPending ? "Bezig..." : "Opslaan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNote("");
                          }}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Geen notities gevonden. Voeg de eerste notitie toe.
                      </p>
                    ) : (
                      notes.map((note) => (
                        <NoteEditor
                          key={note.id}
                          note={note}
                          entityType="trajectory"
                          entityId={parseInt(id!)}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <OneDriveLink
                    entityType="trajectory"
                    entityId={parseInt(id!)}
                    documents={documents}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Form */}
      {showEditForm && trajectory && (
        <TrajectoryForm
          isOpen={showEditForm}
          trajectory={trajectory}
          mode="edit"
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            queryClient.invalidateQueries({ queryKey: ["/api/trajectories", id] });
            toast({
              title: "Traject bijgewerkt",
              description: "Het traject is succesvol bijgewerkt.",
            });
          }}
        />
      )}


    </div>
  );
}