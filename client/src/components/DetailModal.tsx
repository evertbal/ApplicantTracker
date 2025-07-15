import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Edit, FileText, Download, Trash2, ZoomIn, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { CandidateWithRelations, ClientWithRelations, TrajectoryWithRelations } from "@shared/schema";

interface DetailModalProps {
  entity: CandidateWithRelations | ClientWithRelations | TrajectoryWithRelations;
  entityType: 'candidate' | 'client' | 'trajectory';
  isOpen?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export default function DetailModal({ entity, entityType, isOpen = true, onClose, onEdit }: DetailModalProps) {
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: [`/api/notes/${entityType}/${entity.id}`],
    enabled: isOpen,
  });

  const { data: documents = [] } = useQuery({
    queryKey: [`/api/documents/${entityType}/${entity.id}`],
    enabled: isOpen,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const response = await fetch(`/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId: entity.id,
          content: noteText,
        }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${entityType}/${entity.id}`] });
      setNewNote("");
      setIsAddingNote(false);
      toast({ title: "Notitie toegevoegd" });
    },
    onError: () => {
      toast({ title: "Fout bij toevoegen notitie", variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entity.id.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entity.id}`] });
      setUploadedFile(null);
      setIsUploading(false);
      toast({ title: "Document geüpload" });
    },
    onError: () => {
      toast({ title: "Fout bij uploaden", variant: "destructive" });
      setIsUploading(false);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entity.id}`] });
      toast({ title: "Document verwijderd" });
    },
    onError: () => {
      toast({ title: "Fout bij verwijderen document", variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  const renderEntityDetails = () => {
    switch (entityType) {
      case 'candidate':
        const candidate = entity as CandidateWithRelations;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Naam</Label>
                <p className="mt-1">{candidate.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="mt-1">{candidate.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Telefoon</Label>
                <p className="mt-1">{candidate.phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="mt-1">
                  <Badge variant="outline">{candidate.status}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Regio</Label>
                <p className="mt-1">{candidate.region}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Rijbewijs</Label>
                <p className="mt-1">{candidate.drivingLicense}</p>
              </div>
            </div>
          </div>
        );
      
      case 'client':
        const client = entity as ClientWithRelations;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Naam</Label>
                <p className="mt-1">{client.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Contactpersoon</Label>
                <p className="mt-1">{client.contactPerson}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="mt-1">{client.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Telefoon</Label>
                <p className="mt-1">{client.phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Werksoort</Label>
                <p className="mt-1">{client.workType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Uurtarief</Label>
                <p className="mt-1">€{client.hourlyRate}</p>
              </div>
            </div>
          </div>
        );
      
      case 'trajectory':
        const trajectory = entity as TrajectoryWithRelations;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Functietitel</Label>
                <p className="mt-1">{trajectory.position}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <p className="mt-1">
                  <Badge variant="outline">{trajectory.status}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Kandidaat</Label>
                <p className="mt-1">{trajectory.candidate?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Opdrachtgever</Label>
                <p className="mt-1">{trajectory.client?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Startdatum</Label>
                <p className="mt-1">{trajectory.startDate ? format(new Date(trajectory.startDate), 'dd MMM yyyy', { locale: nl }) : 'Niet opgegeven'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Einddatum</Label>
                <p className="mt-1">{trajectory.endDate ? format(new Date(trajectory.endDate), 'dd MMM yyyy', { locale: nl }) : 'Niet opgegeven'}</p>
              </div>
            </div>
            {trajectory.description && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Beschrijving</Label>
                <p className="mt-1">{trajectory.description}</p>
              </div>
            )}
          </div>
        );
    }
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case 'candidate':
        return (entity as CandidateWithRelations).name;
      case 'client':
        return (entity as ClientWithRelations).name;
      case 'trajectory':
        return (entity as TrajectoryWithRelations).position;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getEntityTitle()}</span>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bewerken
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderEntityDetails()}

          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Documenten</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`file-upload-${entity.id}`)?.click()}
                  disabled={isUploading}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                <input
                  id={`file-upload-${entity.id}`}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            {documents.length > 0 ? (
              <div className="grid gap-3">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(doc.createdAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setIsDocumentViewerOpen(true);
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/api/documents/${doc.id}/download`;
                          link.download = doc.filename;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Geen documenten gevonden</p>
            )}
          </div>

          {/* Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notities</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNote(true)}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Notitie toevoegen
              </Button>
            </div>

            {isAddingNote && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <Textarea
                  placeholder="Voeg een notitie toe..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                  >
                    {addNoteMutation.isPending ? 'Bezig...' : 'Opslaan'}
                  </Button>
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
                </div>
              </div>
            )}

            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note: any) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{note.addedByUser?.username || 'Onbekend'}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(note.createdAt), 'dd MMM yyyy HH:mm', { locale: nl })}
                      </span>
                    </div>
                    <p className="text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Geen notities gevonden</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}