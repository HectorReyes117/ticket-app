import { Download, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getFileCategory, type FileCategory } from "../FileThumbnail";

export interface PreviewFileTarget {
  name: string;
  url: string;
  mimeType?: string;
  size?: string;
}

interface FilePreviewModalProps {
  target: PreviewFileTarget | null;
  onClose: () => void;
  onDownload?: (url: string, fileName: string) => void;
}

export function FilePreviewModal({
  target,
  onClose,
  onDownload,
}: FilePreviewModalProps) {
  if (!target) return null;

  const category: FileCategory = getFileCategory(target.name, target.mimeType);

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background border-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div className="flex flex-col min-w-0 pr-4">
            <DialogTitle className="text-sm font-semibold text-foreground truncate">
              {target.name}
            </DialogTitle>
            {target.size && (
              <span className="text-xs text-muted-foreground">{target.size}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onDownload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onDownload(target.url, target.name)}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                <Download className="size-3.5" />
                <span>Descargar</span>
              </Button>
            )}
            <a
              href={target.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4 flex items-center justify-center min-h-[300px]">
          {category === "image" && (
            <div className="relative max-h-[70vh] flex items-center justify-center">
              <img
                src={target.url}
                alt={target.name}
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          )}

          {category === "video" && (
            <div className="w-full max-w-3xl rounded-lg overflow-hidden bg-black shadow-md">
              <video
                src={target.url}
                controls
                autoPlay
                className="w-full max-h-[70vh]"
              >
                Tu navegador no soporta reproducción de video HTML5.
              </video>
            </div>
          )}

          {category === "pdf" && (
            <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-border shadow-md bg-white">
              <iframe
                src={`${target.url}#toolbar=1`}
                title={target.name}
                className="w-full h-full"
              />
            </div>
          )}

          {category !== "image" && category !== "video" && category !== "pdf" && (
            <div className="text-center p-8 text-muted-foreground space-y-2">
              <p className="text-sm font-medium">
                La vista previa directa no está disponible para este tipo de archivo.
              </p>
              <p className="text-xs">
                Puedes descargarlo para abrirlo con el software correspondiente.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
