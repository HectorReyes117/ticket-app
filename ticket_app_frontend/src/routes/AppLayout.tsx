import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useSiteStore, useTicketStore, useUserStore } from "@/store";

export function AppLayout() {
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const fetchSites = useSiteStore((state) => state.fetchSites);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);

  useEffect(() => {
    fetchUsers();
    fetchSites();
    fetchTickets();
  }, [fetchUsers, fetchSites, fetchTickets]);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}