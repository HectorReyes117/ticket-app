import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { cn } from "@/utils";

export type NavItemName =
  | "dashboard"
  | "all-tickets"
  | "assigned"
  | "create"
  | "users"
  | "sites"
  | "help"
  | "settings";

const NAV_GROUPS: Array<{
  title: string;
  items: Array<{ name: NavItemName; to: string; label: string; icon: typeof Users }>;
}> = [
  {
    title: "Principal",
    items: [
      { name: "dashboard", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { name: "all-tickets", to: "/tickets", label: "Todas las Solicitudes", icon: TicketIcon },
      { name: "assigned", to: "/tickets/assigned", label: "Mis Asignaciones", icon: ClipboardList },
      { name: "create", to: "/tickets/new", label: "Crear Solicitud", icon: FilePlus2 },
    ],
  },
  {
    title: "Gestión",
    items: [
      { name: "users", to: "/users", label: "Personal y Usuarios", icon: Users },
      { name: "sites", to: "/sites", label: "Sedes y Ubicaciones", icon: Building2 },
    ],
  },
  {
    title: "Soporte",
    items: [
      { name: "help", to: "/help", label: "Ayuda", icon: LifeBuoy },
      { name: "settings", to: "/settings", label: "Configuración", icon: Settings },
    ],
  },
];

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          {!collapsed ? (
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.title}
            </p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-brand-soft text-brand-soft-fg"
                        : "text-foreground/70 hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}