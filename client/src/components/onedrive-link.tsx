import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Document } from "@shared/schema";

interface OneDriveLinkProps {
  entityType: string;
  entityId: number;
  documents: Document[];
}

export default function OneDriveLink({ entityType, entityId, documents }: OneDriveLinkProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDocumentMutation = useMutation({
    mutationFn: async (url: string) => {
      return await apiRequest('POST', '/api/documents', {
        entityType,
        entityId,
        url
      });
    },
    onSuccess: () => {
      toast({
        title: "OneDrive link toegevoegd",
        description: "De link is succesvol toegevoegd.",
      });
      setNewUrl("");
      setIsAddDialogOpen(false);
      
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entityId}`] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de link.",
        variant: "destructive",
      });
      console.error("Error creating document:", error);
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "OneDrive link verwijderd",
        description: "De link is succesvol verwijderd.",
      });
      
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entityId}`] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de link.",
        variant: "destructive",
      });
      console.error("Error deleting document:", error);
    }
  });

  const handleAddLink = () => {
    if (!newUrl.trim()) {
      toast({
        title: "Ongeldige link",
        description: "Voer een geldige OneDrive link in.",
        variant: "destructive",
      });
      return;
    }
    
    createDocumentMutation.mutate(newUrl);
  };

  const handleDeleteLink = (id: number) => {
    deleteDocumentMutation.mutate(id);
  };

  const openInOneDrive = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">OneDrive Documenten</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              OneDrive Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>OneDrive Link Toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">Plak hier de OneDrive-link</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleAddLink}
                  disabled={createDocumentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createDocumentMutation.isPending ? "Bezig..." : "Toevoegen"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <p>Geen OneDrive documenten gevonden.</p>
              <p className="text-sm mt-1">Gebruik de "OneDrive Link" knop om een document toe te voegen.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        OneDrive Document
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInOneDrive(doc.url)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open in OneDrive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLink(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}