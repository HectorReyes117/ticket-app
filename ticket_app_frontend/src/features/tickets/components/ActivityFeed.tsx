import {
  AlertTriangle,
  FilePlus2,
  FileText,
  MessageSquare,
  RotateCcw,
  Send,
  UserPlus,
} from "lucide-react";
import { Timeline, type TimelineItem } from "@/components/common/Timeline";
import { formatRelativeTime } from "@/utils";
import type { ActivityType, TicketActivity, User } from "@/types";

const ACTIVITY_STYLE: Record<ActivityType, { tone: string; icon: typeof Send }> = {
  created: { tone: "bg-brand-soft text-brand", icon: FilePlus2 },
  status_change: { tone: "bg-brand-soft text-brand", icon: RotateCcw },
  assignment: { tone: "bg-priority-high-bg text-priority-high", icon: UserPlus },
  note: { tone: "bg-secondary text-secondary-foreground", icon: MessageSquare },
  public_response: { tone: "bg-status-resolved-bg text-status-resolved-fg", icon: Send },
  escalation: { tone: "bg-priority-critical-bg text-priority-critical", icon: AlertTriangle },
  attachment: { tone: "bg-muted text-muted-foreground", icon: FileText },
};

interface ActivityFeedProps {
  activities: TicketActivity[];
  usersById: Record<string, User | undefined>;
}

export function ActivityFeed({ activities, usersById }: ActivityFeedProps) {
  const items: TimelineItem[] = [...activities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => {
      const style = ACTIVITY_STYLE[item.type];
      const Icon = style.icon;
      const author = usersById[item.authorId];
      return {
        id: item.id,
        icon: <Icon className="size-3.5" />,
        tone: style.tone,
        author: author?.name ?? "Sistema",
        time: formatRelativeTime(item.createdAt),
        message: item.public
          ? item.message
          : `${item.message} · solo personal`,
      };
    });

  return <Timeline items={items} />;
}