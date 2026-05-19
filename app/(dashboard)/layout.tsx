"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MockModeProvider } from "@/lib/mock-mode";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Sparkles,
  Map,
  Wand2,
  Trophy,
  TrendingUp,
  Rocket,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Onboarding", href: "/onboarding", icon: Sparkles },
  { label: "Creative Map", href: "/map", icon: Map },
  { label: "Media Library", href: "/media", icon: Wand2 },
  { label: "Winners", href: "/winners", icon: Trophy },
  { label: "LTV Engine", href: "/ltv", icon: TrendingUp },
  { label: "Scale Readiness", href: "/scale", icon: Rocket },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

function SidebarNavItem({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group",
        isActive
          ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-light)] border border-[var(--color-accent)]/20"
          : "text-[var(--color-text-muted)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text)]",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-[var(--color-accent-light)]"
            : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {isActive && !collapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <MockModeProvider>
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
        {/* Sidebar */}
        <aside
          className={cn(
            "relative flex flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-all duration-300 ease-in-out",
            collapsed ? "w-[60px]" : "w-[220px]"
          )}
        >
          {/* Logo */}
          <div
            className={cn(
              "flex items-center border-b border-[var(--color-border)] px-4 py-4",
              collapsed ? "justify-center px-2" : "gap-2.5"
            )}
          >
            {/* Gradient dot logo mark */}
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-secondary)] shadow-lg shadow-[var(--color-accent)]/30">
              <span className="text-xs font-black text-white leading-none">C</span>
            </div>
            {!collapsed && (
              <span className="text-sm font-bold tracking-tight text-[var(--color-text)]">
                CLS{" "}
                <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-secondary)] bg-clip-text text-transparent">
                  Engine
                </span>
              </span>
            )}
          </div>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2 w-full text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-card-hover)] transition-colors",
                collapsed && "justify-center px-2"
              )}
              title={theme === "dark" ? "עבור למצב בהיר" : "עבור למצב כהה"}
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Moon className="h-3.5 w-3.5 shrink-0" />
              )}
              {!collapsed && (
                <span>{theme === "dark" ? "עיצוב בהיר" : "עיצוב כהה"}</span>
              )}
            </button>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                collapsed={collapsed}
              />
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-[var(--color-border)]">
            <div
              className={cn(
                "flex items-center px-3 py-3",
                collapsed ? "justify-center" : "gap-3"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-secondary)] text-white">
                  {userEmail ? userEmail[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[var(--color-text)]">
                    {userEmail || "Loading..."}
                  </p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {collapsed && (
              <button
                onClick={handleLogout}
                className="w-full flex justify-center px-2 pb-3 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              "absolute -right-3 top-[4.5rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-muted)] shadow-md transition-all duration-200 hover:text-[var(--color-text)] hover:border-[var(--color-accent)]"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </TooltipProvider>
    </MockModeProvider>
  );
}
