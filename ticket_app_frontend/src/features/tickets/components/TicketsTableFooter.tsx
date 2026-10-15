import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../services/ticketQuery";

interface TicketsTableFooterProps {
  /** 1-based index of the first row on the page, 0 when there are no rows. */
  from: number;
  to: number;
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/** Numbered pages with ellipsis gaps: always the first, last and a window around the current page. */
function getPageNumbers(page: number, pageCount: number): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const wanted = new Set([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...wanted]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous !== 0 && value - previous > 1) result.push("ellipsis");
    result.push(value);
    previous = value;
  }
  return result;
}

export function TicketsTableFooter({
  from,
  to,
  total,
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TicketsTableFooterProps) {
  const pages = getPageNumbers(page, pageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando{" "}
        <span className="font-medium tabular-nums text-foreground">{from}</span> a{" "}
        <span className="font-medium tabular-nums text-foreground">{to}</span> de{" "}
        <span className="font-medium tabular-nums text-foreground">{total}</span>{" "}
        resultados
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filas por página:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value ?? DEFAULT_PAGE_SIZE))
            }
          >
            <SelectTrigger className="w-[72px]" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </PaginationItem>

            {pages.map((value, index) =>
              value === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={value}>
                  <Button
                    type="button"
                    variant={value === page ? "outline" : "ghost"}
                    size="icon-sm"
                    onClick={() => onPageChange(value)}
                    aria-label={`Ir a la página ${value}`}
                    aria-current={value === page ? "page" : undefined}
                    className={
                      value === page
                        ? "border-brand/40 bg-brand-soft text-brand-soft-fg"
                        : undefined
                    }
                  >
                    {value}
                  </Button>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pageCount}
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
