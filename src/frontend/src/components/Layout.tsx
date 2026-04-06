import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChefHat,
  ClipboardList,
  LayoutGrid,
  Settings,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { path: "/", icon: UtensilsCrossed, label: "POS Billing" },
  { path: "/orders", icon: ClipboardList, label: "Orders" },
  { path: "/menu", icon: BookOpen, label: "Menu" },
  { path: "/tables", icon: LayoutGrid, label: "Tables" },
  { path: "/kitchen", icon: ChefHat, label: "Kitchen (KDS)" },
  { path: "/customers", icon: Users, label: "Customers" },
  { path: "/reports", icon: BarChart3, label: "Reports" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <div
      className="flex min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #0F1420 0%, #111827 50%, #0B1220 100%)",
      }}
    >
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-20"
        style={{
          background: "rgba(11,18,32,0.95)",
          borderRight: "1px solid #263244",
        }}
      >
        {/* Brand */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "#263244" }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-white">RestoPOS</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            Restaurant POS System
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive =
              path === "/" ? currentPath === "/" : currentPath.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? "#3B82F6" : "transparent",
                  color: isActive ? "#fff" : "#9CA3AF",
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "#263244" }}>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            RestoPOS v1.0
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
