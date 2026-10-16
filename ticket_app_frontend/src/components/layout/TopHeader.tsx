import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Moon,
  Plus,
  Search,
  Sun,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/common/UserAvatar/UserAvatar";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/auth-context";

const THEME_KEY = "ticketapp.theme";

export function TopHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dark mode state with persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) return stored === "dark";
      return document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      try {
        localStorage.setItem(THEME_KEY, "dark");
      } catch {
        /* noop */
      }
    } else {
      root.classList.remove("dark");
      try {
        localStorage.setItem(THEME_KEY, "light");
      } catch {
        /* noop */
      }
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
    toast.add({
      title: !isDark ? "Modo oscuro activado" : "Modo claro activado",
      description: `El tema visual ha cambiado a modo ${!isDark ? "oscuro" : "claro"}.`,
      type: "info",
    });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 px-6 backdrop-blur-md shadow-xs">
      {/* Search Input Bar (from Stitch) */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tickets, usuarios, activos o incidentes..."
            className="w-full h-9 pl-9 pr-12 rounded-xl bg-muted/60 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-border focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-card px-1.5 py-0.5 rounded border border-border text-muted-foreground pointer-events-none shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions: Dark Mode, Notifications, Quick Action & User Avatar */}
      <div className="flex items-center gap-3">
        {/* Toggle Dark / Light Mode */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={isDark ? "Modo Claro" : "Modo Oscuro"}
          className="size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
        </button>

        {/* Notifications Icon with dot badge */}
        <button
          type="button"
          onClick={() =>
            toast.add({
              title: "Notificaciones",
              description: "No tienes notificaciones urgentes pendientes.",
              type: "info",
            })
          }
          aria-label="Notificaciones"
          title="Notificaciones"
          className="relative size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors cursor-pointer"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-brand animate-pulse" />
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Quick Ticket Creation Button */}
        <Link
          to="/tickets/new"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="size-3.5" />
          <span>Nuevo Ticket</span>
        </Link>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-brand rounded-full cursor-pointer">
            <div className="flex items-center gap-2 pl-1 group">
              <UserAvatar
                name={user?.name || "Carlos Mendoza"}
                avatarUrl={user?.avatarUrl}
                presence={user?.presence}
                size="md"
                className="ring-2 ring-brand/40 group-hover:ring-brand transition-all cursor-pointer"
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1.5">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold leading-none text-foreground">{user?.name || "Carlos Mendoza"}</p>
                <p className="text-[11px] leading-none text-muted-foreground truncate">
                  {user?.email || "carlos.mendoza@unicaribe.edu.do"}
                </p>
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-soft-fg">
                  {user?.role === "admin" ? "Administrador" : user?.role === "technician" ? "Técnico L2" : "Solicitante"}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(user?.role === "admin" || user?.role === "director") && (
              <DropdownMenuItem
                className="text-xs cursor-pointer gap-2"
                onClick={() => navigate("/users")}
              >
                <User className="size-3.5 text-muted-foreground" />
                <span>Directorio de Usuarios</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-xs cursor-pointer gap-2"
              onClick={() =>
                toast.add({
                  title: "Ajustes de cuenta",
                  description: "Preferencia de notificaciones y contraseñas.",
                  type: "info",
                })
              }
            >
              <Settings className="size-3.5 text-muted-foreground" />
              <span>Ajustes &amp; Preferencias</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs cursor-pointer text-destructive focus:text-destructive gap-2"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="size-3.5" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
