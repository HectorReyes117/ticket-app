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
      <DialogContent
        showCloseButton={false}
        className="max-w-6xl sm:max-w-6xl w-[95vw] md:w-[90vw] p-0 overflow-hidden bg-background border-border flex flex-col h-[90vh] max-h-[92vh] rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex flex-col min-w-0 pr-4">
            <DialogTitle className="text-base font-semibold text-foreground truncate">
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              title="Cerrar visor"
            >
              <span className="text-lg leading-none font-medium">✕</span>
            </Button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6 flex items-center justify-center min-h-0 w-full">
          {category === "image" && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={target.url}
                alt={target.name}
                className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
          )}

          {category === "video" && (
            <div className="w-full h-full max-w-5xl rounded-xl overflow-hidden bg-black shadow-lg flex items-center justify-center">
              <video
                src={target.url}
                controls
                autoPlay
                className="w-full max-h-[78vh] object-contain"
              >
                Tu navegador no soporta reproducción de video HTML5.
              </video>
            </div>
          )}

          {category === "pdf" && (
            <div className="w-full h-full rounded-xl overflow-hidden border border-border shadow-lg bg-white">
              <iframe
                src={`${target.url}#toolbar=1`}
                title={target.name}
                className="w-full h-full min-h-[75vh]"
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
