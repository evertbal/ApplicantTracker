import { useState } from "react";
import { Edit2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@shared/schema";

interface NoteEditorProps {
  note: Note;
  entityType: string;
  entityId: number;
  onDelete?: () => void;
}

export function NoteEditor({ note, entityType, entityId, onDelete }: NoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (content: string) => notesApi.update(note.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${entityType}/${entityId}`] });
      setIsEditing(false);
      toast({
        title: "Notitie bijgewerkt",
        description: "De notitie is succesvol bijgewerkt.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de notitie.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => notesApi.delete(note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${entityType}/${entityId}`] });
      onDelete?.();
      toast({
        title: "Notitie verwijderd",
        description: "De notitie is succesvol verwijderd.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de notitie.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (editContent.trim() === "") {
      toast({
        title: "Fout",
        description: "Notitie inhoud mag niet leeg zijn.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(editContent.trim());
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Weet je zeker dat je deze notitie wilt verwijderen?")) {
      deleteMutation.mutate();
    }
  };

  const getAuthorInitials = (authorId: string) => {
    if (authorId.includes("@")) {
      return authorId.split("@")[0].split(".").map(name => name.charAt(0).toUpperCase()).join("");
    } else {
      return authorId.split(" ").map(name => name.charAt(0).toUpperCase()).join("");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
            {getAuthorInitials(note.authorId)}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {note.authorId}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Aangemaakt: {formatDate(note.createdAt)}
              {note.updatedAt && note.updatedAt !== note.createdAt && (
                <span className="ml-2">
                  • Bewerkt: {formatDate(note.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {!isEditing && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px] resize-none"
            placeholder="Voer notitie inhoud in..."
          />
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Opslaan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Annuleren
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {note.content}
        </div>
      )}
    </div>
  );
}