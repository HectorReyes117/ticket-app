import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";
import { useAuth } from "@/context/auth-context";
import { FirstLoginPasswordModal } from "@/features/auth/components/FirstLoginPasswordModal";

export function AppLayout() {
  const { user } = useAuth();
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const fetchSites = useSiteStore((state) => state.fetchSites);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);

  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowFirstLoginModal(true);
    } else {
      setShowFirstLoginModal(false);
    }
  }, [user?.mustChangePassword]);

  useEffect(() => {
    fetchUsers();
    fetchSites();
    fetchTickets();
  }, [fetchUsers, fetchSites, fetchTickets]);

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <FirstLoginPasswordModal
        isOpen={showFirstLoginModal}
        onSuccess={() => setShowFirstLoginModal(false)}
      />
    </>
  );
}