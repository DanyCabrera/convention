"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Ticket,
  GraduationCap,
  BarChart3,
  Settings,
  ScanLine,
  X,
} from "lucide-react";
import { cn, formatShortDate } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/layout/app-logo";
import { useEvent } from "@/hooks/use-event";

const iconMap = {
  LayoutDashboard,
  UserPlus,
  Users,
  Ticket,
  GraduationCap,
  BarChart3,
  Settings,
  ScanLine,
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { event } = useEvent();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col border-r border-border bg-card transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-[var(--navbar-height)] items-center justify-between border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <AppLogo size={36} priority />
            <div>
              <p className="text-sm font-semibold leading-tight">{event.name}</p>
              <p className="text-[11px] text-muted-foreground">Gestión del evento</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menú principal">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="relative block"
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-accent/60 px-3 py-2">
            <p className="text-xs font-medium text-accent-foreground">{event.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {formatShortDate(event.date)}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              {event.location}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
