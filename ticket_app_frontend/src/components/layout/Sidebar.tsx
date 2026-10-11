import { Link } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, Ticket as TicketIcon } from "lucide-react";
import { cn } from "@/utils";
import { SidebarNav } from "./SidebarNav";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <Link
        to="/dashboard"
        className={cn(
          "flex h-16 items-center gap-3 border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <TicketIcon className="size-5" />
        </span>
        {!collapsed ? (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-foreground">
              FlowService
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Solicitudes de Servicios
            </span>
          </span>
        ) : null}
      </Link>

      <SidebarNav collapsed={collapsed} />

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          {!collapsed ? <span>Contraer</span> : null}
        </button>
      </div>
    </aside>
  );
}