import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Calendar,
  ChevronRight,
  ClipboardList,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import type { AppTab } from "../App";
import OutcomeBadge from "../components/OutcomeBadge";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllDoctors,
  useAllProducts,
  useDashboardSummary,
  useTodaysVisits,
  useUpcomingReminders,
} from "../hooks/useQueries";
import { formatNsDate, relativeDate } from "../utils/dateUtils";
import { MOCK_DOCTORS, MOCK_REMINDERS, MOCK_VISITS } from "../utils/mockData";

interface DashboardPageProps {
  onNavigate: (tab: AppTab) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString();
  const shortId = principalStr ? `${principalStr.slice(0, 8)}…` : "MR";

  const summaryQuery = useDashboardSummary();
  const todaysQuery = useTodaysVisits();
  const upcomingQuery = useUpcomingReminders();
  const doctorsQuery = useAllDoctors();
  const productsQuery = useAllProducts();

  const summary = summaryQuery.data;
  const isLoading = summaryQuery.isLoading;

  const todaysVisits = useMemo(() => {
    const real = todaysQuery.data ?? [];
    return real.length > 0 ? real : MOCK_VISITS.slice(0, 2);
  }, [todaysQuery.data]);

  const upcomingReminders = useMemo(() => {
    const real = upcomingQuery.data ?? [];
    return real.length > 0
      ? real
      : MOCK_REMINDERS.filter((r) => !r.isDone).slice(0, 3);
  }, [upcomingQuery.data]);

  const doctors = doctorsQuery.data ?? MOCK_DOCTORS;
  const products = productsQuery.data ?? [];

  const statsData = [
    {
      label: "Total Doctors",
      value: summary ? Number(summary.totalDoctors) : doctors.length,
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      iconBg: "bg-blue-100",
    },
    {
      label: "Products",
      value: summary ? Number(summary.totalProducts) : products.length,
      icon: <Package className="w-5 h-5" />,
      color: "bg-teal/5 text-teal-dark border-teal/10",
      iconBg: "bg-teal/10",
    },
    {
      label: "Visits This Month",
      value: summary ? Number(summary.visitsThisMonth) : 4,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      iconBg: "bg-emerald-100",
    },
    {
      label: "Pending Reminders",
      value: summary
        ? Number(summary.pendingReminders)
        : upcomingReminders.length,
      icon: <Bell className="w-5 h-5" />,
      color: "bg-amber-50 text-amber-700 border-amber-100",
      iconBg: "bg-amber-100",
    },
  ];

  return (
    <div
      data-ocid="dashboard.page"
      className="flex flex-col h-full overflow-y-auto"
    >
      {/* Header */}
      <div
        className="px-5 pt-6 pb-8"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.18 0.04 230) 0%, oklch(0.24 0.05 215) 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="bg-white rounded-xl px-4 py-2 inline-block shadow-md">
            <img
              src="/assets/uploads/REALMED-PHARMA-1.png"
              alt="Realmed Pharma"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
            <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
            <span className="text-white/60 text-xs font-mono">{shortId}</span>
          </div>
        </div>
        <p className="text-white/50 text-sm font-sans mb-0.5">
          Good {getGreeting()},
        </p>
        <p className="text-white/40 text-xs mt-1">
          Ophthalmology Division ·{" "}
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="flex flex-col gap-5 px-4 py-5 pb-6">
        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {statsData.map((stat, i) => (
              <motion.div
                key={stat.label}
                data-ocid={"dashboard.stats.card"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
              >
                <Card className="shadow-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}
                        style={{ color: "oklch(0.42 0.11 210)" }}
                      >
                        {stat.icon}
                      </div>
                      <div className="min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-10 mb-1" />
                        ) : (
                          <p className="font-display text-2xl font-bold text-foreground">
                            {stat.value}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs leading-tight">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Today's Visits */}
        <section data-ocid="dashboard.visits.list">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <Calendar
                className="w-4 h-4"
                style={{ color: "oklch(0.42 0.11 210)" }}
              />
              Today's Calls
            </h2>
            <button
              type="button"
              data-ocid="dashboard.visits.link"
              onClick={() => onNavigate("visits")}
              className="text-xs flex items-center gap-1 font-medium"
              style={{ color: "oklch(0.42 0.11 210)" }}
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {todaysQuery.isLoading ? (
              [1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            ) : todaysVisits.length === 0 ? (
              <div
                data-ocid="dashboard.visits.empty_state"
                className="text-center py-8 bg-muted/40 rounded-xl border border-border"
              >
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  No calls scheduled today
                </p>
              </div>
            ) : (
              todaysVisits.map((visit, i) => {
                const doctor = doctors.find((d) => d.id === visit.doctorId);
                return (
                  <motion.div
                    key={visit.id.toString()}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-card border-0"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.42 0.11 210), oklch(0.62 0.13 195))",
                      }}
                    >
                      {doctor?.name?.slice(3, 5) || "DR"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {doctor?.name || "Unknown Doctor"}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {doctor?.clinicName || ""}
                      </p>
                    </div>
                    <OutcomeBadge outcome={visit.outcome as string} />
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* Upcoming Reminders */}
        <section data-ocid="dashboard.reminders.list">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Upcoming Reminders
            </h2>
            <button
              type="button"
              data-ocid="dashboard.reminders.link"
              onClick={() => onNavigate("reminders")}
              className="text-xs flex items-center gap-1 font-medium"
              style={{ color: "oklch(0.42 0.11 210)" }}
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingQuery.isLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))
            ) : upcomingReminders.length === 0 ? (
              <div
                data-ocid="dashboard.reminders.empty_state"
                className="text-center py-8 bg-muted/40 rounded-xl border border-border"
              >
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  No upcoming reminders
                </p>
              </div>
            ) : (
              upcomingReminders.slice(0, 5).map((reminder, i) => {
                const linkedDoctor = doctors.find(
                  (d) => d.id === reminder.linkedDoctorId,
                );
                return (
                  <motion.div
                    key={reminder.id.toString()}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-card border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {reminder.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {relativeDate(reminder.dueDate)}
                        {linkedDoctor && ` · ${linkedDoctor.name}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatNsDate(reminder.dueDate)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 text-center mt-auto">
        <p className="text-muted-foreground/40 text-xs">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline hover:text-muted-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
