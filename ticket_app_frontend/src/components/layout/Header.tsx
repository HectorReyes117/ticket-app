import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CircleCheck,
  FilePlus2,
  LogOut,
  Settings,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchInput } from "@/components/common/SearchInput";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/context/auth-context";
import { ROLE_META, initials } from "@/utils";
import { useUserStore } from "@/store";
import { cn } from "@/utils";

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "SLA en riesgo",
    description: "REQ-10003 · prioridad Crítica",
    tone: "danger",
    time: "hace 8 min",
  },
  {
    id: "n2",
    title: "Nueva asignación",
    description: "REQ-10013 te fue asignada",
    tone: "primary",
    time: "hace 12 min",
  },
  {
    id: "n3",
    title: "Solicitud resuelta",
    description: "REQ-10004 espera tu confirmación",
    tone: "success",
    time: "hace 2 h",
  },
] as const;

const TONE_ICON = {
  danger: <TriangleAlert className="size-4 text-priority-critical" />,
  primary: <Bell className="size-4 text-brand" />,
  success: <CircleCheck className="size-4 text-status-resolved" />,
} as const;

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const users = useUserStore((state) => state.items);
  const currentUser = users.find((u) => u.id === user?.id) ?? user;
  const [notificationsRead, setNotificationsRead] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur">
      <div className="flex-1">
        <SearchInput
          placeholder="Buscar por ID, título o solicitante…"
          className="max-w-md"
          value=""
          onChange={() => {}}
        />
      </div>

      <Popover onOpenChange={(open) => open && setNotificationsRead(true)}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notificaciones"
              className="relative"
            />
          }
        >
          <Bell className="size-5" />
          {!notificationsRead ? (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-priority-critical ring-2 ring-card" />
          ) : null}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notificaciones</p>
            <span className="text-xs text-muted-foreground">{NOTIFICATIONS.length} nuevas</span>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {NOTIFICATIONS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                >
                  <span className={cn("mt-0.5", item.tone === "danger" && "text-priority-critical", item.tone === "primary" && "text-brand", item.tone === "success" && "text-status-resolved")}>
                    {TONE_ICON[item.tone]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground/70">{item.time}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full justify-center text-muted-foreground">
              Marcar todas como leídas
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button size="sm" className="gap-1.5" onClick={() => navigate("/tickets/new")}>
        <FilePlus2 className="size-4" />
        Nueva Solicitud
      </Button>

      {currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 rounded-full outline-none"
                aria-label="Menú de usuario"
              />
            }
          >
            <UserAvatar
              name={currentUser.name}
              color={currentUser.color}
              presence={currentUser.presence}
              size="md"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" alt="" />
                  <AvatarFallback className="bg-brand text-white">
                    {initials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {currentUser.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {ROLE_META[currentUser.role].label}
                  </span>
                </span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Settings className="size-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Iniciar sesión
        </Link>
      )}
    </header>
  );
}