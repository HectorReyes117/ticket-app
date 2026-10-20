import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, resolveFileUrl } from "@/utils";
import { cn } from "@/utils";
import type { Presence } from "@/types";

const PRESENCE_DOT: Record<Presence, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  offline: "bg-slate-400",
};

const SIZE = {
  xs: { avatar: "size-6 text-[10px]", dot: "size-1.5" },
  sm: { avatar: "size-8 text-xs", dot: "size-2" },
  md: { avatar: "size-10 text-sm", dot: "size-2.5" },
  lg: { avatar: "size-12 text-base", dot: "size-3" },
} as const;

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  color?: string;
  presence?: Presence;
  size?: keyof typeof SIZE;
  className?: string;
}

export function UserAvatar({
  name,
  avatarUrl,
  color = "#2563eb",
  presence,
  size = "md",
  className,
}: UserAvatarProps) {
  const tokens = SIZE[size];
  const fullAvatarUrl = avatarUrl ? resolveFileUrl(avatarUrl) : "";

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={cn("select-none", tokens.avatar)}>
        <AvatarImage src={fullAvatarUrl} alt={name} />
        <AvatarFallback
          className="border font-semibold text-white"
          style={{ backgroundColor: color, borderColor: color }}
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {presence ? (
        <span
          aria-label={presence}
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-background",
            PRESENCE_DOT[presence],
            tokens.dot,
          )}
        />
      ) : null}
    </span>
  );
}