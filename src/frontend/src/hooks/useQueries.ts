import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Doctor,
  Product,
  Reminder,
  Visit,
  VisitOutcome,
} from "../backend.d.ts";
import { useActor } from "./useActor";
export type { Doctor, Product, Visit, Reminder, VisitOutcome };

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboardSummary() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTodaysVisits() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["todaysVisits"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodaysVisits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpcomingReminders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["upcomingReminders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Doctors ─────────────────────────────────────────────────────────────────

export function useAllDoctors() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDoctors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpsertDoctor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doctor: Doctor) => {
      if (!actor) throw new Error("No actor");
      return actor.upsertDoctor(doctor);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useDeleteDoctor() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteDoctor(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

export function useVisitsByDoctor(doctorId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["visitsByDoctor", doctorId?.toString()],
    queryFn: async () => {
      if (!actor || doctorId === null) return [];
      return actor.getVisitsByDoctor(doctorId);
    },
    enabled: !!actor && !isFetching && doctorId !== null,
  });
}

// ─── Products ────────────────────────────────────────────────────────────────

export function useAllProducts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpsertProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("No actor");
      return actor.upsertProduct(product);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

// ─── Visits ──────────────────────────────────────────────────────────────────

export function useAllVisits() {
  const { actor, isFetching } = useActor();
  const doctorsQuery = useAllDoctors();
  return useQuery({
    queryKey: ["visits"],
    queryFn: async () => {
      if (!actor || !doctorsQuery.data) return [];
      const doctors = doctorsQuery.data;
      const visitArrays = await Promise.all(
        doctors.map((d) => actor.getVisitsByDoctor(d.id)),
      );
      return visitArrays.flat();
    },
    enabled: !!actor && !isFetching && !!doctorsQuery.data,
  });
}

export function useCreateVisit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visit: Visit) => {
      if (!actor) throw new Error("No actor");
      return actor.createVisit(visit);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["todaysVisits"] });
      qc.invalidateQueries({ queryKey: ["visitsByDoctor"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useUpdateVisit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, visit }: { id: bigint; visit: Visit }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateVisit(id, visit);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["todaysVisits"] });
      qc.invalidateQueries({ queryKey: ["visitsByDoctor"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useDeleteVisit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteVisit(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["todaysVisits"] });
      qc.invalidateQueries({ queryKey: ["visitsByDoctor"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function useAllReminders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: Reminder) => {
      if (!actor) throw new Error("No actor");
      return actor.createReminder(reminder);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["upcomingReminders"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useUpdateReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reminder,
    }: { id: bigint; reminder: Reminder }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateReminder(id, reminder);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["upcomingReminders"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useDeleteReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteReminder(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["upcomingReminders"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}

export function useMarkReminderDone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markReminderDone(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["upcomingReminders"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
    },
  });
}
