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
import { formatDate, formatTicketCorrelative, getCicloLabel, getParticipantTypeLabel, getStatusLabel } from "@/lib/utils";
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
      const studentPlan =
        student.plan ?? (student.carnet ? getPlanFromCarnet(student.carnet) : null) ?? null;
      const matchesPlan =
        planFilter === "all" || studentPlan === planFilter;
      const matchesCiclo =
        cicloFilter === "all" || student.ciclo === Number(cicloFilter);
      const matchesStatus =
        statusFilter === "all" || student.status === statusFilter;
      const q = globalFilter.toLowerCase();
      const qDigits = stripCarnetDigits(globalFilter);
      const matchesSearch =
        !globalFilter ||
        student.full_name.toLowerCase().includes(q) ||
        student.email?.toLowerCase().includes(q) ||
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
          <span className="font-mono text-xs">
            {displayCarnet(row.original.carnet)}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Correo",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => (
          <span className="hidden lg:inline">{row.original.phone}</span>
        ),
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {getPlanLabel(
              row.original.plan ??
                (row.original.carnet
                  ? getPlanFromCarnet(row.original.carnet)
                  : null)
            )}
          </Badge>
        ),
      },
      {
        accessorKey: "ciclo",
        header: "Ciclo",
        cell: ({ row }) => (
          <Badge variant="outline">{getCicloLabel(row.original.ciclo)}</Badge>
        ),
      },
      {
        accessorKey: "registered_at",
        header: "Registro",
        cell: ({ row }) => (
          <span className="hidden text-muted-foreground md:inline text-xs">
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
        cell: ({ row }) =>
          compact ? (
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/tickets/${row.original.id}`}
                aria-label={`Ver ticket de ${row.original.full_name}`}
              >
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Acciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/tickets/${row.original.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver ticket
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(row.original)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onResend?.(row.original.id)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por correo
                </DropdownMenuItem>
                {row.original.status !== "cancelled" && onCancel && (
                  <DropdownMenuItem onClick={() => onCancel(row.original.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Cancelar registro
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete?.(row.original.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

  return (
    <div className="space-y-4">
      {!compact && (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre, correo, carnet o ticket..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm bg-muted/50"
        />
        {!hidePlanFilter && (
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
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
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {loading ? "Cargando estudiantes..." : "No se encontraron estudiantes"}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
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

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
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
