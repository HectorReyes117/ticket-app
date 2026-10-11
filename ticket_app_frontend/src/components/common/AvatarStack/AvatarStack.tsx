import { UserAvatar } from "../UserAvatar";
import { cn } from "@/utils";
import type { Presence } from "@/types";

interface AvatarItem {
  name: string;
  color?: string;
  presence?: Presence;
}

interface AvatarStackProps {
  items: AvatarItem[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function AvatarStack({
  items,
  max = 4,
  size = "sm",
  className,
}: AvatarStackProps) {
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((item, index) => (
        <span
          key={`${item.name}-${index}`}
          className="ring-2 ring-card"
          style={{ marginLeft: index === 0 ? 0 : -6 }}
        >
          <UserAvatar
            name={item.name}
            color={item.color}
            presence={item.presence}
            size={size}
          />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className="flex items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground ring-2 ring-card"
          style={{ marginLeft: -6 }}
        >
          <span className={cn(size === "xs" && "size-6", size === "sm" && "size-8", size === "md" && "size-10", "flex items-center justify-center")}>
            +{overflow}
          </span>
        </span>
      ) : null}
    </div>
  );
}