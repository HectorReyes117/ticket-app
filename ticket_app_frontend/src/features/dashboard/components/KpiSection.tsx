import { KpiCard } from "@/components/common/KpiCard";
import type { ReactNode } from "react";

export interface KpiItem {
  id: string;
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "default" | "danger" | "primary" | "success";
  trend?: string;
}

interface KpiSectionProps {
  items: KpiItem[];
}

export function KpiSection({ items }: KpiSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard
          key={item.id}
          label={item.label}
          value={item.value}
          icon={item.icon}
          tone={item.tone}
          trend={item.trend}
        />
      ))}
    </div>
  );
}