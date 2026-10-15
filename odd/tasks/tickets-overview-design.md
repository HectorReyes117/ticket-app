# Feature: Tickets overview redesign ("Todas las Solicitudes")

Objective: Reshape the `Todas las Solicitudes` page to match the Stitch design (screen
`8cd3f875cb494c22839f235b09794c33`, DESKTOP 2560×3184) — KPI cards, date-range filter, create
button, richer filters, table counters / refresh / rows-per-page / pagination, and a distribution
chart — while keeping today's status pills and the existing kanban/table toggle.

- Branch: `feat/tickets-overview-design`
- Delivery strategy: `feature-branch-chain` — decided by the user as "Una rama, 4 commits". All work
  lands on `feat/tickets-overview-design`, one work-unit commit per task, in task order; the merge to
  `main` stays a human decision. Authored-changed-lines forecast: ~850 (exceeds ~400).
- Test runner: **none configured** (no `test` script, no Vitest). Applicable checks are
  `npm run build` (`tsc -b && vite build`) and `npm run lint`. `npm run lint` exits 1 on 19
  **pre-existing** errors in `src/components/ui/*` and `src/hooks/use-mobile.ts`.
- Design source: Stitch project `15872789062723212315`. Screenshot + OCR artifacts live in
  `%TEMP%\opencode\stitch-tickets\` (`big.png`, `ocr-big.txt`).

## Design reference (OCR of the render)

Header: `Todas las Solicitudes` / `Supervisión y control global de tickets de servicio en tiempo real`.
Actions: date range `30 Sep 2025 – 04 Oct 2025`, `Exportar`, `Nuevo Ticket`.

KPI cards: `Tickets Abiertos 52` `+15% vs hora anterior` · `Nuevos Tickets 36` `+8% vs hora
anterior` · `En Proceso 41` `+12% vs hora anterior` · `Resueltas 45` `+15% vs hora anterior`.

Pills: `Todos (42)` `Sin Asignar (19)` `Urgentes (8)` `En Proceso (64)` `Cerradas (51)`.
Selects row: `Area: Todas` `Prioridad: Todas` `Técnico: Cualquiera` `Limpiar filtros`,
search `Filtrar por asunto, solicitante o ID.`, `Ordenar por: Más recientes`.

Table card: `Registro de Tickets`, `Mostrando 7 de 142`; columns `ID Ticket | Solicitante | Correo |
Asunto | Creado | Prioridad | Responsable`.
Table footer: `Mostrando 1 a 7 de 142 resultados`, `Filas por página: 20`, page numbers `2 3`.

Chart card: `Distribución de Solicitudes`, period select `Este Mes`, donut center `2,548 /
TICKETS TOTALES`, legend `Resumen global` (`Abiertos 1,656 tickets`, `En Proceso 866 tickets`,
`Críticos 1,146 tickets`, `Resueltos 305 tickets`), footer `Resolución conforme dentro de meta
(98.4%)`, `Ver detalles`.

**The design's numbers and rows are template placeholders** (English sample tickets, e.g. `PC not
turning on after update`). This app has 14 Spanish mock tickets, so every count is derived from real
local data and no placeholder delta is invented.

## Specs

S1 — KPI cards above the table.
Request: "las cards que estan arriba de la tabla".
Acceptance: four cards render above the filters — `Tickets Abiertos`, `Nuevos Tickets`, `En Proceso`,
`Resueltas` — reusing `KpiCard`/`KpiSection`. Values are computed from the in-store tickets
(abiertos = pending + in_progress + on_hold; nuevos = created in the last 24 h; en proceso =
in_progress; resueltas = resolved). The design's `+N% vs hora anterior` is a placeholder and is
**not** fabricated; each card carries a true supporting line.

S2 — Date-range filter.
Request: "el filtro por rango de fecha".
Acceptance: a range picker in the page header (Popover + `Calendar` in `range` mode) filters the
table by `createdAt`. Label shows both bounds (design: `30 Sep 2025 – 04 Oct 2025`). Clearing
restores all tickets. The unfiltered default keeps the table non-empty.

S3 — Create-request button.
Request: "el boton de crear nueva solicitud".
Acceptance: a primary `+ Nueva Solicitud` action in the page header navigates to `/tickets/new`
(existing `CreateTicketPage` route). The dead `Crear solicitud` button inside the empty state is
wired to the same route.

S4 — Improved filters, existing ones preserved.
Request: "que mejores los filtros como estan en el diseño (Sin asignar, Urgentes, Prioridad, tecnico,
Area) quiero que mantengas los que tenemos de todas, pendientes, en proceso, etc".
Acceptance: the pill group keeps `Todas` plus every existing status (`Pendiente`, `En Proceso`,
`En Espera`, `Resuelto`, `Cancelado`) and **adds** `Sin Asignar`, `Urgentes` and `Cerradas`; each
pill shows its count (design: `Todos (42)`). Selects gain `Área` and `Técnico` next to the existing
`Prioridad` and `Sede`. A `Limpiar filtros` action resets the whole filter set.
Definitions (assumptions, flagged in Log L4): `Sin Asignar` = no `assigneeId`; `Urgentes` = priority
`high` or `critical`; `Cerradas` = status `resolved` or `cancelled`; `Área` = `Ticket.area`; `Técnico`
= users with role `technician`.

S5 — Kanban/table toggle preserved.
Request: "lo de cambiar entre la vista kanban y tabla".
Acceptance: the existing `ViewToggle` stays and keeps switching `TicketTable` ⇄ `TicketKanban`.

S6 — "Showing" counters.
Request: "cuantos se estan mostrando" and "la cantidad de resultados de cuantos".
Acceptance: the table card header shows `Registro de Tickets` + `Mostrando X de Y`, and the card
footer shows `Mostrando A a B de Z resultados` (design wording).

S7 — Refresh button.
Request: "el boton de refrescar".
Acceptance: a refresh control sits with the table chrome and re-reads the store, resets to page 1 and
shows a brief busy state. It must be **non-destructive**: it never calls `seedTickets()` and never
discards tickets created or edited in the session.

S8 — Rows per page.
Request: "filas por pagina".
Acceptance: a `Filas por página` select with 10 / 20 / 50; changing it resets to page 1.
**Amended (see L6):** the default is `10`, not the design's `20`, because the seeded data set holds only
14 tickets and a 20-row page always renders a single page — which would hide the new pagination
entirely. One-line revert at `DEFAULT_PAGE_SIZE` in `ticketQuery.ts`.

S9 — Pagination.
Request: "la paginacion".
Acceptance: page controls with numbered pages and prev/next, driven by the filtered + sorted result
set. Page count follows rows-per-page; the table renders only the current page slice.

S10 — Request distribution chart below.
Request: "el grafico de distribucion de solicitudes que aparece debajo".
Acceptance: a `Distribución de Solicitudes` card renders below the table with a period select
(design: `Este Mes`), a donut whose centre shows the total tickets, a per-status legend and a real
footer stat (share of tickets inside SLA). Reuses the existing recharts pattern from
`TicketsByStatusChart`.

S11 — Sort selector (design affordance, kept minimal).
Request: covered by "que mejores los filtros como estan en el diseño".
Acceptance: `Ordenar por` select with `Más recientes` (default), `Más antiguas`,
`Prioridad (mayor)`, `SLA por vencer`.

S12 — No regression on "Mis Solicitudes Asignadas".
`TicketsBrowser` is shared by `TicketsPage` and `MyAssignedTicketsPage`. The design-specific quick
pills (`Sin Asignar` / `Urgentes` / `Cerradas`) are opt-in via a prop enabled only by
`TicketsPage`, because `Sin Asignar` is meaningless on a page that only lists your own assignments.
The generic improvements (counters, rows-per-page, pagination, extra selects, sort) apply to both.

## Tasks

| ID | Task | Specs | Route | Status | Evidence |
|----|------|-------|-------|--------|----------|
| T1 | Enrich the filter toolbar: pills with counts + quick filters, Área/Técnico selects, Limpiar filtros, Ordenar por | S4, S5, S11, S12 | inline | done | `ticketQuery` probe 34/34 pass; `npm run build` ok; eslint clean on touched files |
| T2 | Table chrome + pagination: card header `Registro de Tickets`/`Mostrando X de Y`, refresh, results row, rows-per-page, page controls | S6, S7, S8, S9, S12 | inline | done | `ticketQuery` probe 57/57 pass (incl. a paging mirror); `npm run build` ok; eslint clean on `src/features/tickets` |
| T3 | Page chrome: KPI cards, date-range filter, `+ Nueva Solicitud` button | S1, S2, S3 | inline | done | `ticketQuery` probe 84/84 pass; `npm run build` ok; eslint clean on touched files |
| T4 | Distribution chart card below the table | S10 | inline | pending | — |

## Log

L1 — Original request (verbatim):
> De esa solo quiero las cards que estan arriba de la tabla, el filtro por rango de fecha, el boton
> de crear nueva solicitud, tambien que mejores los filtros como estan en el diseño (Sin asignar,
> Urgentes, Prioridad, tecnico, Area) quiero que mantengas los que tenemos de todas, pendientes, en
> proceso, etc y tambien lo de cambiar entre la vista kanban y tabla. Agrega lo de cuantos se estan
> mostrando, el boton de refrescar, la cantidad de resultados de cuantos, filas por pagina y la
> paginacion. Tambien el grafico  de distribucion de solicitudes que aparece debajo.

L2 — Stitch screen fetched: `Todas las Solicitudes`, DESKTOP 2560×3184. Screenshot downloaded from the
public FIFE URL; `htmlCode.downloadUrl` is Google-auth gated (`302 → accounts.google.com/ServiceLogin`),
so the design was read from the render via Windows OCR. The design is a template with English sample
rows and placeholder figures; only layout, labels and affordances were taken from it.

L3 — Codebase survey:
- `TicketsPage` renders `<PageHeader>` + `<TicketsBrowser tickets={store.items} />`.
- `TicketsBrowser` is **shared** with `MyAssignedTicketsPage` — hence S12.
- `TicketTable` renders its own bordered container and all rows (no pagination); `TicketKanban`,
  `ViewToggle`, `FilterPills`, `KpiCard`/`KpiSection`, `SearchInput`, `EmptyState`, `PageHeader` exist.
- `Ticket` has `area: string`, `assigneeId?: string`, `createdAt`; 14 mock tickets spanning 35 min to
  3 days ago, 4 sites, 6 areas, 4 technicians. No ticket API — the store is local mock data.
- Primitives available and reused: `Card*`, `Select*`, `Popover*`, `Calendar` (react-day-picker),
  `Pagination*`, `chart.tsx` (`ChartContainer`/`ChartConfig`), recharts, `Skeleton`, `Spinner`.

L4 — Assumptions taken without blocking the user (all reversible, each named in the closing report):
1. The design's KPI deltas (`+15% vs hora anterior`) and figures (`142`, `2,548`) are placeholders and
   are not reproduced; real counts are computed from local data (S1).
2. `Urgentes` = `high` + `critical`; `Cerradas` = `resolved` + `cancelled` (S4).
3. `Exportar` (present in the design) was **not** requested and is not implemented.
4. The refresh control re-reads local state only, because no ticket backend exists (S7).
5. Authored-line forecast (~850) exceeds the ~400 heuristic, so the chain-strategy question is raised
   once before the first commit, per the delivery-strategy rule. Resolved: the user chose
   "Una rama, 4 commits" (`feature-branch-chain`).

L5 — T1 delivered. New `src/features/tickets/services/ticketQuery.ts` (pure query model: pill /
select / search matching, faceted pill counts, four sort keys, `hasActiveFilters`) and
`src/features/tickets/components/TicketsToolbar.tsx` (pills row above a card with search, Área,
Prioridad, Técnico, Sede, Ordenar por, Limpiar filtros and the existing `ViewToggle`).
`TicketsBrowser` now holds one `TicketQueryState` instead of four scattered `useState` calls and
gains the `showQuickFilters` prop (S12). Filter semantics confirmed against the real mock data with
a one-off Vite-SSR probe (34/34 checks): pill counts are `Todas 14 · Sin asignar 4 · Urgentes 5 ·
Cerradas 3 · Pendiente 3 · En Proceso 6 · En Espera 2 · Resuelto 2 · Cancelado 1`; faceted counts
narrow correctly (`user-javier` → `Todas (4)` / `Cerradas (1)`); sorting does not mutate the input
array. Checks: `npm run build` ok, eslint clean on the touched files. The probe is scratch-only
(no test runner exists in this project), so it is not committed.
Note: the empty-state `Crear solicitud` button, previously a no-op, now navigates to `/tickets/new`
(S3, completed by T3).

L6 — T2 delivered. `TicketsTableFooter.tsx` (results summary, `Filas por página` select, numbered
pagination with ellipsis gaps + prev/next, all ours on top of the repo's `Pagination*` structure) and
a `plain` prop on `TicketTable` so it can sit flush inside a parent surface instead of drawing its own
bordered container. `TicketsBrowser` now slices the filtered set, wraps the table in a card with the
design's `Registro de Tickets` header + `Mostrando X de Y` + a refresh control, and renders the footer.
Filter / clear / page-size changes all reset to page 1; an out-of-range page clamps to the last page.
**Deliberate deviation:** `DEFAULT_PAGE_SIZE` is `10`, not the design's `20`. The seeded data set holds
only 14 tickets, so a 20-row page would always render a single page and make the new pagination
invisible; the deviation is documented at the constant in `ticketQuery.ts` and is a one-line revert.
Paging was verified against the real data with the same one-off Vite-SSR probe (57/57 checks): page 1
= 10 rows `1–10`, page 2 = 4 rows `11–14`, the two pages do not overlap and their union is the full
filtered set, page 99 clamps to page 2, the empty set reports `0 a 0` on one page, and narrowing the
filter while on page 2 clamps back to page 1. Checks: `npm run build` ok, `eslint src/features/tickets`
clean (fixing a real `react-refresh/only-export-components` error by moving the page-size constants
into `ticketQuery.ts`).

L7 — T3 delivered. New `DateRangeFilter.tsx` (`components/common`) — a Base UI `Popover` +
`Calendar` in `range` mode, two months, `formatDate` label (`30 sep 2025 – 04 oct 2025`) and a clear
control — plus a rebuilt `TicketsPage`: KPI cards, that date filter and a primary `+ Nueva Solicitud`
button in the header.
- KPIs (S1) reuse `KpiSection`/`KpiCard` and are computed by a new pure, testable
  `summarizeTickets(tickets, now?)` in `ticketQuery.ts`: `Tickets Abiertos` = pending + in_progress +
  on_hold (new `OPEN_STATUSES`), `Nuevos Tickets` = created in the last 24 h, `En Proceso`, `Resueltas`.
  The design's `+15% vs hora anterior` deltas are placeholders and are replaced by true supporting
  lines ("Pendientes, en proceso o en espera", …); no delta is fabricated (L4.1).
- The date range (S2) travels as `createdRange` on `TicketQueryContext`, not as a toolbar control, so
  it filters `createdAt` **and** shapes the faceted pill counts. Day bounds are inclusive
  (`00:00:00.000` … `23:59:59.999`) via a new exported `isWithinRange`. `TicketsBrowser` gained a
  `createdRange` prop and resets to page 1 when it changes.
- Button wording (S3): `Nueva Solicitud`, matching the user's own words and the existing
  `Crear Solicitud` sidebar entry rather than the design's `Nuevo Ticket`.
- Extending the probe to 84/84 checks surfaced two real defects that were fixed before committing:
  (a) `eslint react-refresh/only-export-components` on the new page-size constants (already fixed in
  L6, re-confirmed here); (b) `react-hooks/set-state-in-effect` — my first cut reset the page from a
  `useEffect`, which causes a cascading render, so it became React's documented render-time
  adjustment (`if (lastRange !== createdRange) { setLastRange(...); setPage(1); }`).
- Date-range coverage added to the probe: full span / open-ended bounds keep all 14 tickets,
  a single-day window equals the manual same-day count and really narrows (`< 14`), windows entirely
  before or after the data are empty, an inverted window is empty, and bounds are inclusive at both
  ends. `summarizeTickets` verified with a pinned clock (`total 14`, `open 11`, `inProgress 6`,
  `resolved 2`) and for the empty input.
Checks: `npm run build` ok; `eslint` clean on `src/features/tickets`,
`src/components/common/DateRangeFilter` and `src/pages/TicketsPage.tsx`.
