import {
  Bell,
  ClipboardList,
  Layers,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";
import type { AppTab } from "../App";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: {
  id: AppTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ({ className }) => <LayoutDashboard className={className} />,
  },
  {
    id: "doctors",
    label: "Doctors",
    icon: ({ className }) => <Users className={className} />,
  },
  {
    id: "products",
    label: "Products",
    icon: ({ className }) => <Package className={className} />,
  },
  {
    id: "catalog",
    label: "Catalog",
    icon: ({ className }) => <Layers className={className} />,
  },
  {
    id: "visits",
    label: "Visits",
    icon: ({ className }) => <ClipboardList className={className} />,
  },
  {
    id: "reminders",
    label: "Reminders",
    icon: ({ className }) => <Bell className={className} />,
  },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-white/10"
      style={{ height: "68px", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors touch-target ${
                isActive
                  ? "text-teal"
                  : "text-white/40 hover:text-white/70 active:text-white/90"
              }`}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${isActive ? "opacity-100" : "opacity-60"}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
