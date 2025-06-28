import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, X, FileText, Image as ImageIcon, File } from "lucide-react";
import type { Document as DocumentType } from "@shared/schema";

interface DocumentViewerProps {
  document: DocumentType | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ document: documentFile, isOpen, onClose }: DocumentViewerProps) {
  const [imageError, setImageError] = useState(false);

  if (!documentFile) return null;

  // Cast to ensure TypeScript knows this is our DocumentType, not DOM Document
  const doc = documentFile as DocumentType;

  const getFileExtension = (filename: string) => {
    return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
  };

  const getFileType = (filename: string) => {
    const ext = getFileExtension(filename);
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
    return 'file';
  };

  const getFileIcon = (filename: string) => {
    const type = getFileType(filename);
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'spreadsheet': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getFileTypeColor = (filename: string) => {
    const type = getFileType(filename);
    switch (type) {
      case 'image': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pdf': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'document': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'spreadsheet': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = doc.storageUrl;
    link.download = doc.filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(doc.storageUrl, '_blank');
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Onbekende datum';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFilePreview = () => {
    const fileType = getFileType(doc.filename);

    switch (fileType) {
      case 'image':
        return (
          <div className="w-full h-96 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
            {!imageError ? (
              <img
                src={doc.storageUrl}
                alt={doc.filename}
                className="max-w-full max-h-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-center text-gray-500">
                <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                <p>Afbeelding kan niet worden geladen</p>
              </div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-96 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                PDF preview niet beschikbaar
              </p>
              <div className="space-x-2">
                <Button onClick={handleOpenInNewTab} className="btn-primary-enhanced">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Openen in nieuw tabblad
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-96 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <File className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Preview niet beschikbaar voor dit bestandstype
              </p>
              <div className="space-x-2">
                <Button onClick={handleOpenInNewTab} className="btn-primary-enhanced">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Openen in nieuw tabblad
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-content max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white">
                {getFileIcon(doc.filename)}
              </div>
              <div>
                <DialogTitle className="heading-enhanced text-xl">
                  {doc.filename}
                </DialogTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getFileTypeColor(doc.filename)}>
                    {getFileExtension(doc.filename).toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Geüpload op {formatDate(doc.uploadedAt)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {renderFilePreview()}
        </div>

        <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Bestandsnaam:</strong> {doc.filename}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleOpenInNewTab} className="btn-primary-enhanced">
                <ExternalLink className="w-4 h-4 mr-2" />
                Openen in nieuw tabblad
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}