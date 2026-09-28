"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CICLO_OPTIONS, PLAN_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";
import { displayCarnet, stripCarnetDigits } from "@/lib/carnet";
import { getPlanFromCarnet, getPlanLabel, type Plan } from "@/lib/plans";
import {
  cn,
  formatDate,
  formatTicketCorrelative,
  getCicloLabel,
  getParticipantTypeLabel,
  getStatusLabel,
  hasRealEmail,
} from "@/lib/utils";
import type { StudentWithTicket } from "@/types";

interface StudentsTableProps {
  data: StudentWithTicket[];
  onDelete?: (id: string) => void;
  onResend?: (id: string) => void;
  onEdit?: (student: StudentWithTicket) => void;
  onCancel?: (id: string) => void;
  loading?: boolean;
  compact?: boolean;
  initialSearch?: string;
  initialPlan?: Plan | "all";
  hidePlanFilter?: boolean;
  onFilteredChange?: (students: StudentWithTicket[]) => void;
}

type RowActionHandlers = Pick<
  StudentsTableProps,
  "onDelete" | "onResend" | "onEdit" | "onCancel" | "compact"
>;

function getStatusVariant(
  status: string
): "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

function resolvePlan(student: StudentWithTicket): Plan | null {
  return (
    student.plan ??
    (student.carnet ? getPlanFromCarnet(student.carnet) : null) ??
    null
  );
}

function StudentRowActions({
  student,
  compact,
  onEdit,
  onResend,
  onCancel,
  onDelete,
}: RowActionHandlers & { student: StudentWithTicket }) {
  if (compact) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link
          href={`/tickets/${student.id}`}
          aria-label={`Ver ticket de ${student.full_name}`}
        >
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/tickets/${student.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver ticket
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(student)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {hasRealEmail(student.email) && (
          <DropdownMenuItem onClick={() => onResend?.(student.id)}>
            <Mail className="mr-2 h-4 w-4" />
            Enviar por correo
          </DropdownMenuItem>
        )}
        {student.status !== "cancelled" && onCancel && (
          <DropdownMenuItem onClick={() => onCancel(student.id)}>
            <UserX className="mr-2 h-4 w-4" />
            Cancelar registro
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete?.(student.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="truncate text-xs font-medium">{children}</dd>
    </div>
  );
}

function StudentMobileRow({
  student,
  ...handlers
}: RowActionHandlers & { student: StudentWithTicket }) {
  const isDocente = student.participant_type === "docente";

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold tabular-nums leading-none text-primary">
              {formatTicketCorrelative(student.ticket?.correlative)}
            </span>
            <Badge variant={getStatusVariant(student.status)}>
              {getStatusLabel(student.status)}
            </Badge>
          </div>
          <p className="mt-1.5 break-words font-medium leading-snug">
            {student.full_name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={isDocente ? "secondary" : "outline"} className="text-[10px]">
              {getParticipantTypeLabel(student.participant_type)}
            </Badge>
            <span className="font-mono text-[10px] text-muted-foreground">
              {student.ticket?.ticket_number ?? "—"}
            </span>
          </div>
        </div>
        <div className="-mr-2 -mt-1 shrink-0">
          <StudentRowActions student={student} {...handlers} />
        </div>
      </div>

      {!isDocente && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-muted/30 px-3 py-2.5">
          <MobileField label="Carnet">
            <span className="font-mono">{displayCarnet(student.carnet)}</span>
          </MobileField>
          <MobileField label="Ciclo">{getCicloLabel(student.ciclo)}</MobileField>
          <MobileField label="Plan">{getPlanLabel(resolvePlan(student))}</MobileField>
          <MobileField label="Teléfono">{student.phone ?? "—"}</MobileField>
          {hasRealEmail(student.email) && (
            <MobileField label="Correo" className="col-span-2">
              {student.email}
            </MobileField>
          )}
        </dl>
      )}

      <p className="text-[11px] text-muted-foreground">
        Registrado {formatDate(student.registered_at)}
      </p>
    </div>
  );
}

export function StudentsTable({
  data,
  onDelete,
  onResend,
  onEdit,
  onCancel,
  loading,
  compact,
  initialSearch = "",
  initialPlan = "all",
  hidePlanFilter,
  onFilteredChange,
}: StudentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [planFilter, setPlanFilter] = useState<string>(initialPlan);
  const [cicloFilter, setCicloFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    return data.filter((student) => {
      const matchesPlan =
        planFilter === "all" || resolvePlan(student) === planFilter;
      const matchesCiclo =
        cicloFilter === "all" || student.ciclo === Number(cicloFilter);
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const q = globalFilter.toLowerCase();
      const qDigits = stripCarnetDigits(globalFilter);
      const matchesSearch =
        !globalFilter ||
        student.full_name.toLowerCase().includes(q) ||
        (hasRealEmail(student.email) &&
          student.email!.toLowerCase().includes(q)) ||
        (student.carnet &&
          (displayCarnet(student.carnet).includes(q) ||
            stripCarnetDigits(student.carnet).includes(qDigits))) ||
        student.ticket?.ticket_number.toLowerCase().includes(q) ||
        String(student.ticket?.correlative ?? "").includes(q);
      return matchesPlan && matchesCiclo && matchesStatus && matchesSearch;
    });
  }, [data, planFilter, cicloFilter, statusFilter, globalFilter]);

  useEffect(() => {
    onFilteredChange?.(filteredData);
  }, [filteredData, onFilteredChange]);

  const columns = useMemo<ColumnDef<StudentWithTicket>[]>(() => {
    const cols: ColumnDef<StudentWithTicket>[] = [
      {
        accessorKey: "ticket.correlative",
        header: "Ticket",
        cell: ({ row }) => (
          <div className="leading-tight">
            <span className="font-semibold tabular-nums text-primary">
              {formatTicketCorrelative(row.original.ticket?.correlative)}
            </span>
            <p className="font-mono text-[10px] text-muted-foreground">
              {row.original.ticket?.ticket_number ?? "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nombre
            <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.original.full_name}</span>
            <Badge
              variant={
                row.original.participant_type === "docente"
                  ? "secondary"
                  : "outline"
              }
              className="text-[10px]"
            >
              {getParticipantTypeLabel(row.original.participant_type)}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "carnet",
        header: "Carnet",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-mono text-xs">
            {displayCarnet(row.original.carnet)}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Correo",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {hasRealEmail(row.original.email) ? row.original.email : "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => <span>{row.original.phone ?? "—"}</span>,
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => (
          <Badge variant="secondary" className="whitespace-nowrap font-normal">
            {getPlanLabel(resolvePlan(row.original))}
          </Badge>
        ),
      },
      {
        accessorKey: "ciclo",
        header: "Ciclo",
        cell: ({ row }) => (
          <Badge variant="outline" className="whitespace-nowrap">
            {getCicloLabel(row.original.ciclo)}
          </Badge>
        ),
      },
      {
        accessorKey: "registered_at",
        header: "Registro",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDate(row.original.registered_at)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.status)}>
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <StudentRowActions
            student={row.original}
            compact={compact}
            onEdit={onEdit}
            onResend={onResend}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ),
      },
    ];

    return cols;
  }, [onDelete, onResend, onEdit, onCancel, compact]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: compact ? 5 : 8 } },
  });

  const rows = table.getRowModel().rows;
  const emptyMessage = loading
    ? "Cargando estudiantes..."
    : "No se encontraron estudiantes";

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Buscar por nombre, correo, carnet o ticket..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="col-span-2 bg-muted/50 sm:max-w-sm"
          />
          {!hidePlanFilter && (
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="col-span-2 w-full sm:w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={cicloFilter} onValueChange={setCicloFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Ciclo" />
            </SelectTrigger>
            <SelectContent>
              {CICLO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="divide-y divide-border md:hidden">
          {rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            rows.map((row) => (
              <StudentMobileRow
                key={row.id}
                student={row.original}
                compact={compact}
                onEdit={onEdit}
                onResend={onResend}
                onCancel={onCancel}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-muted/20"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {filteredData.length} registro{filteredData.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
