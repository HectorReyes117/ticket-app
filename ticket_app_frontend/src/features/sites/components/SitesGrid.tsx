import { Building2, MapPin, Phone } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/common/AvatarStack";
import { cn } from "@/utils";
import type { Site, User } from "@/types";

interface SitesGridProps {
  sites: Site[];
  managersById: Record<string, User | undefined>;
}

export function SitesGrid({ sites, managersById }: SitesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sites.map((site) => {
        const managers = site.managers
          .map((id) => managersById[id])
          .filter((u): u is User => Boolean(u));
        return (
          <Card
            key={site.id}
            className={cn(
              "transition-shadow hover:shadow-sm",
              !site.active && "opacity-60",
            )}
          >
            <CardHeader className="flex-row items-start justify-between gap-3 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {site.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{site.city}</p>
                </div>
              </div>
              <Badge
                variant={site.active ? "secondary" : "outline"}
                className={cn(
                  site.active &&
                    "border-status-resolved-border bg-status-resolved-bg text-status-resolved-fg",
                )}
              >
                {site.active ? "Activa" : "Inactiva"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                {site.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                {site.phone || "Sin teléfono registrado"}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {site.areas.slice(0, 4).map((area) => (
                  <Badge key={area} variant="outline">
                    {area}
                  </Badge>
                ))}
                {site.areas.length > 4 ? (
                  <Badge variant="outline">+{site.areas.length - 4}</Badge>
                ) : null}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between gap-3 p-5 pt-3">
              <span className="text-sm text-muted-foreground">
                {managers.length > 0 ? "Responsables" : "Sin responsables"}
              </span>
              {managers.length > 0 ? (
                <AvatarStack
                  items={managers.map((u) => ({
                    name: u.name,
                    color: u.color,
                    presence: u.presence,
                  }))}
                  size="sm"
                />
              ) : (
                <span className="flex -space-x-1.5">
                  {managers.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : null}
                </span>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}