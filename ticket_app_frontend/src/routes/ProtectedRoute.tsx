import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Ticket as TicketIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import type { Role } from "@/types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps = {}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <TicketIcon className="size-6" />
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}