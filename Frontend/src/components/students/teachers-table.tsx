"use client";

import { useEffect, useMemo, useState } from "react";
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
import Link from "next/link";
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
import { STATUS_OPTIONS } from "@/lib/constants";
import { formatDate, formatTicketCorrelative, getStatusLabel, hasRealEmail } from "@/lib/utils";
import type { StudentWithTicket } from "@/types";

interface TeachersTableProps {
  data: StudentWithTicket[];
  onDelete?: (id: string) => void;
  onEdit?: (teacher: StudentWithTicket) => void;
  onCancel?: (id: string) => void;
  onResend?: (id: string) => void;
  loading?: boolean;
  initialSearch?: string;
  onFilteredChange?: (teachers: StudentWithTicket[]) => void;
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

type TeacherActionHandlers = Pick<
  TeachersTableProps,
  "onDelete" | "onEdit" | "onCancel" | "onResend"
>;

function TeacherRowActions({
  teacher,
  onDelete,
  onEdit,
  onCancel,
  onResend,
}: TeacherActionHandlers & { teacher: StudentWithTicket }) {
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
          <Link href={`/tickets/${teacher.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver ticket
          </Link>
        </DropdownMenuItem>
        {onResend && hasRealEmail(teacher.email) && (
          <DropdownMenuItem onClick={() => onResend(teacher.id)}>
            <Mail className="mr-2 h-4 w-4" />
            Enviar por correo
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onEdit?.(teacher)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {teacher.status !== "cancelled" && onCancel && (
          <DropdownMenuItem onClick={() => onCancel(teacher.id)}>
            <UserX className="mr-2 h-4 w-4" />
            Cancelar registro
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete?.(teacher.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TeacherMobileRow({
  teacher,
  ...handlers
}: TeacherActionHandlers & { teacher: StudentWithTicket }) {
  return (
    <div className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold tabular-nums leading-none text-primary">
            {formatTicketCorrelative(teacher.ticket?.correlative)}
          </span>
          <Badge variant={getStatusVariant(teacher.status)}>
            {getStatusLabel(teacher.status)}
          </Badge>
        </div>
        <p className="mt-1.5 break-words font-medium leading-snug">
          {teacher.full_name}
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {teacher.ticket?.ticket_number ?? "—"}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Registrado {formatDate(teacher.registered_at)}
        </p>
      </div>
      <div className="-mr-2 -mt-1 shrink-0">
        <TeacherRowActions teacher={teacher} {...handlers} />
      </div>
    </div>
  );
}

export function TeachersTable({
  data,
  onDelete,
  onEdit,
  onCancel,
  onResend,
  loading,
  initialSearch = "",
  onFilteredChange,
}: TeachersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    return data.filter((teacher) => {
      const matchesStatus =
        statusFilter === "all" || teacher.status === statusFilter;
      const q = globalFilter.toLowerCase();
      const matchesSearch =
        !globalFilter ||
        teacher.full_name.toLowerCase().includes(q) ||
        (teacher.email?.toLowerCase().includes(q) ?? false) ||
        teacher.ticket?.ticket_number.toLowerCase().includes(q) ||
        String(teacher.ticket?.correlative ?? "").includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [data, statusFilter, globalFilter]);

  useEffect(() => {
    onFilteredChange?.(filteredData);
  }, [filteredData, onFilteredChange]);

  const columns = useMemo<ColumnDef<StudentWithTicket>[]>(
    () => [
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
          <span className="font-medium">{row.original.full_name}</span>
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
          <TeacherRowActions
            teacher={row.original}
            onDelete={onDelete}
            onEdit={onEdit}
            onCancel={onCancel}
            onResend={onResend}
          />
        ),
      },
    ],
    [onDelete, onEdit, onCancel, onResend]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  const rows = table.getRowModel().rows;
  const emptyMessage = loading ? "Cargando docentes..." : "No se encontraron docentes";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre o ticket..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="bg-muted/50 sm:max-w-sm"
        />
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="divide-y divide-border md:hidden">
          {rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            rows.map((row) => (
              <TeacherMobileRow
                key={row.id}
                teacher={row.original}
                onDelete={onDelete}
                onEdit={onEdit}
                onCancel={onCancel}
                onResend={onResend}
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
