import { cn } from "@/utils";
import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  time: string;
  author: string;
  message: string;
  icon: ReactNode;
  tone: string;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("space-y-1", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={item.id} className="relative flex gap-3 pb-4">
            {!isLast ? (
              <span
                aria-hidden
                className="absolute top-7 left-[11px] h-[calc(100%-28px)] w-px bg-border"
              />
            ) : null}
            <span
              className={cn(
                "mt-1 flex size-6 shrink-0 items-center justify-center rounded-full",
                item.tone,
              )}
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-foreground">
                  {item.author}
                </span>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                {item.message}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}