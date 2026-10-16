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
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/types";
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

interface NavItemDef {
  name: NavItemName;
  to: string;
  label: string;
  icon: typeof Users;
  allowedRoles?: Role[];
}

const NAV_GROUPS: Array<{
  title: string;
  items: NavItemDef[];
}> = [
  {
    title: "Principal",
    items: [
      { name: "dashboard", to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { name: "all-tickets", to: "/tickets", label: "Todas las Solicitudes", icon: TicketIcon },
      {
        name: "assigned",
        to: "/tickets/assigned",
        label: "Mis Asignaciones",
        icon: ClipboardList,
        allowedRoles: ["technician", "admin", "director"],
      },
      { name: "create", to: "/tickets/new", label: "Crear Solicitud", icon: FilePlus2 },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        name: "users",
        to: "/users",
        label: "Personal y Usuarios",
        icon: Users,
        allowedRoles: ["admin", "director"],
      },
      {
        name: "sites",
        to: "/sites",
        label: "Sedes y Ubicaciones",
        icon: Building2,
        allowedRoles: ["admin", "director"],
      },
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
  const { user } = useAuth();
  const userRole = user?.role;

  const visibleGroups = NAV_GROUPS.map((group) => {
    const items = group.items.filter((item) => {
      if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
      return userRole ? item.allowedRoles.includes(userRole) : false;
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {visibleGroups.map((group) => (
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