import { useState, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/utils";

export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "word"
  | "excel"
  | "archive"
  | "code"
  | "other";

export function getFileCategory(fileName: string, mimeType?: string): FileCategory {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mime = (mimeType || "").toLowerCase();

  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext)) {
    return "image";
  }
  if (mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext)) {
    return "video";
  }
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(ext)) {
    return "audio";
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    ["doc", "docx", "odt", "rtf"].includes(ext)
  ) {
    return "word";
  }
  if (
    mime.includes("excel") ||
    mime.includes("spreadsheetml") ||
    ["xls", "xlsx", "csv", "ods"].includes(ext)
  ) {
    return "excel";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return "archive";
  }
  if (["json", "xml", "html", "css", "js", "ts", "tsx", "jsx", "py", "sql", "log", "pcap", "txt"].includes(ext)) {
    return "code";
  }

  return "other";
}

export function isPreviewable(category: FileCategory): boolean {
  return category === "image" || category === "video" || category === "pdf";
}

interface FileThumbnailProps {
  fileName: string;
  mimeType?: string;
  previewUrl?: string;
  className?: string;
  iconClassName?: string;
}

export function FileThumbnail({
  fileName,
  mimeType,
  previewUrl,
  className,
  iconClassName = "size-4",
}: FileThumbnailProps) {
  const [imgError, setImgError] = useState(false);
  const category = getFileCategory(fileName, mimeType);

  // Reset imgError whenever previewUrl changes
  useEffect(() => {
    setImgError(false);
  }, [previewUrl]);

  if (category === "image" && previewUrl && !imgError) {
    return (
      <div
        className={cn(
          "size-10 rounded-xl overflow-hidden bg-muted/60 border border-border/80 shrink-0 flex items-center justify-center relative shadow-xs group",
          className
        )}
      >
        <img
          src={previewUrl}
          alt={fileName}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Visual styled icon badge per file category
  const badgeMeta = {
    image: { icon: ImageIcon, bg: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    video: { icon: FileVideo, bg: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    audio: { icon: FileAudio, bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    pdf: { icon: FileText, bg: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    word: { icon: FileText, bg: "bg-sky-600/10 text-sky-600 border-sky-600/20" },
    excel: { icon: FileSpreadsheet, bg: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20" },
    archive: { icon: FileArchive, bg: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    code: { icon: FileCode, bg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
    other: { icon: File, bg: "bg-muted text-muted-foreground border-border" },
  }[category];

  const IconComponent = badgeMeta.icon;

  return (
    <div
      className={cn(
        "size-10 rounded-xl border shrink-0 flex items-center justify-center shadow-xs",
        badgeMeta.bg,
        className
      )}
    >
      <IconComponent className={iconClassName} />
    </div>
  );
}
