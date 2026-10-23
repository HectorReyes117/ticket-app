import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { TicketsPage } from "@/pages/TicketsPage";
import { MyAssignedTicketsPage } from "@/pages/MyAssignedTicketsPage";
import { CreateTicketPage } from "@/pages/CreateTicketPage";
import { TicketDetailPage } from "@/pages/TicketDetailPage";
import { UsersPage } from "@/pages/UsersPage";
import { SitesPage } from "@/pages/SitesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />

          {/* Rutas exclusivas para Técnicos, Administradores y Directores */}
          <Route element={<ProtectedRoute allowedRoles={["technician", "admin", "director"]} />}>
            <Route path="/tickets/assigned" element={<MyAssignedTicketsPage />} />
          </Route>

          {/* Rutas de Gestión del Sistema (Solo Administradores y Directores) */}
          <Route element={<ProtectedRoute allowedRoles={["admin", "director"]} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/sites" element={<SitesPage />} />
          </Route>

          <Route
            path="/help"
            element={
              <div className="text-sm text-muted-foreground">Sección en construcción.</div>
            }
          />
          <Route
            path="/settings"
            element={
              <div className="text-sm text-muted-foreground">Sección en construcción.</div>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}