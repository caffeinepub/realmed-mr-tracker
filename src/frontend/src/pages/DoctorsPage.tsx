import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import OutcomeBadge from "../components/OutcomeBadge";
import {
  type Doctor,
  useAllDoctors,
  useDeleteDoctor,
  useUpsertDoctor,
  useVisitsByDoctor,
} from "../hooks/useQueries";
import { formatNsDate } from "../utils/dateUtils";
import { MOCK_DOCTORS } from "../utils/mockData";

const EMPTY_DOCTOR: Omit<Doctor, "id"> = {
  name: "",
  specialty: "",
  clinicName: "",
  address: "",
  areaTerritory: "",
  phone: "",
  email: "",
  notes: "",
};

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);
  const [form, setForm] = useState<Omit<Doctor, "id">>(EMPTY_DOCTOR);

  const doctorsQuery = useAllDoctors();
  const upsertMutation = useUpsertDoctor();
  const deleteMutation = useDeleteDoctor();

  const doctors = useMemo(() => {
    const real = doctorsQuery.data ?? [];
    return real.length > 0 ? real : MOCK_DOCTORS;
  }, [doctorsQuery.data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.areaTerritory.toLowerCase().includes(q) ||
        d.clinicName.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q),
    );
  }, [doctors, search]);

  function openAdd() {
    setEditDoctor(null);
    setForm(EMPTY_DOCTOR);
    setIsFormOpen(true);
  }

  function openEdit(doctor: Doctor) {
    setEditDoctor(doctor);
    setForm({
      name: doctor.name,
      specialty: doctor.specialty,
      clinicName: doctor.clinicName,
      address: doctor.address,
      areaTerritory: doctor.areaTerritory,
      phone: doctor.phone,
      email: doctor.email,
      notes: doctor.notes,
    });
    setViewDoctor(null);
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Doctor name is required");
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        id: editDoctor?.id ?? 0n,
        ...form,
      });
      toast.success(editDoctor ? "Doctor updated" : "Doctor added");
      setIsFormOpen(false);
    } catch {
      toast.error("Failed to save doctor");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Doctor removed");
      setDeleteTarget(null);
      setViewDoctor(null);
    } catch {
      toast.error("Failed to delete doctor");
    }
  }

  function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  const avatarColors = [
    "from-blue-500 to-blue-700",
    "from-teal-500 to-teal-700",
    "from-indigo-500 to-indigo-700",
    "from-violet-500 to-violet-700",
    "from-emerald-500 to-emerald-700",
  ];

  return (
    <div data-ocid="doctors.page" className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl font-bold text-foreground">
            Doctors
          </h1>
          <Button
            data-ocid="doctors.add_button"
            onClick={openAdd}
            size="sm"
            className="gap-2 rounded-xl"
            style={{ backgroundColor: "oklch(0.42 0.11 210)", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="doctors.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, area, specialty…"
            className="pl-9 h-11 rounded-xl border-border bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {doctorsQuery.isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div data-ocid="doctors.empty_state" className="text-center py-16">
              <Stethoscope className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">
                No doctors found
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search ? "Try a different search" : "Add your first doctor"}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((doctor, i) => (
                <motion.div
                  key={doctor.id.toString()}
                  data-ocid={`doctors.item.${i + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setViewDoctor(doctor)}
                  className="cursor-pointer"
                >
                  <Card className="shadow-card border-0 hover:shadow-card-hover transition-shadow active:scale-[0.99]">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                        >
                          {getInitials(doctor.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {doctor.name}
                              </p>
                              <p className="text-muted-foreground text-xs truncate">
                                {doctor.clinicName}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] flex-shrink-0 px-2 py-0.5"
                            >
                              {doctor.specialty}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <MapPin className="w-3 h-3" />
                              {doctor.areaTerritory}
                            </span>
                            {doctor.phone && (
                              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                                <Phone className="w-3 h-3" />
                                {doctor.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* View Doctor Sheet */}
      <Sheet
        open={!!viewDoctor}
        onOpenChange={(o) => !o && setViewDoctor(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-2xl px-0"
          data-ocid="doctors.dialog"
        >
          {viewDoctor && (
            <DoctorDetailView
              doctor={viewDoctor}
              onEdit={() => openEdit(viewDoctor)}
              onDelete={() => setDeleteTarget(viewDoctor)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(o) => !o && setIsFormOpen(false)}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-2xl px-0"
          data-ocid="doctors.dialog"
        >
          <SheetHeader className="px-5 pb-4 border-b border-border">
            <SheetTitle className="font-display">
              {editDoctor ? "Edit Doctor" : "Add New Doctor"}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100%-130px)]">
            <div className="px-5 py-4 space-y-4">
              <FormField label="Full Name *">
                <Input
                  data-ocid="doctors.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Dr. Name Surname"
                  className="h-12 rounded-xl"
                />
              </FormField>
              <FormField label="Specialty">
                <Input
                  value={form.specialty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, specialty: e.target.value }))
                  }
                  placeholder="e.g. Ophthalmologist, Retina Specialist"
                  className="h-12 rounded-xl"
                />
              </FormField>
              <FormField label="Clinic / Hospital">
                <Input
                  value={form.clinicName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clinicName: e.target.value }))
                  }
                  placeholder="Clinic or hospital name"
                  className="h-12 rounded-xl"
                />
              </FormField>
              <FormField label="Address">
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Full address"
                  className="h-12 rounded-xl"
                />
              </FormField>
              <FormField label="Area / Territory">
                <Input
                  value={form.areaTerritory}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, areaTerritory: e.target.value }))
                  }
                  placeholder="e.g. South Mumbai, Bengaluru North"
                  className="h-12 rounded-xl"
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+91 98XXX XXXXX"
                  type="tel"
                  className="h-12 rounded-xl"
                />
              </FormField>
              <FormField label="Email">
                <Input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="doctor@clinic.com"
                  type="email"
                  className="h-12 rounded-xl"
                />
              </FormField>
              <FormField label="Notes">
                <Textarea
                  data-ocid="doctors.notes.textarea"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Preferred call time, interests, important notes…"
                  className="rounded-xl min-h-[80px]"
                />
              </FormField>
            </div>
          </ScrollArea>
          <SheetFooter className="px-5 pt-3 border-t border-border gap-3">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 h-12 rounded-xl"
              data-ocid="doctors.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="doctors.save_button"
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="flex-1 h-12 rounded-xl text-white"
              style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
            >
              {upsertMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editDoctor ? "Save Changes" : "Add Doctor"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="doctors.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>{" "}
              and their visit history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="doctors.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="doctors.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DoctorDetailView({
  doctor,
  onEdit,
  onDelete,
}: {
  doctor: Doctor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const visitsQuery = useVisitsByDoctor(doctor.id);
  const visits = visitsQuery.data ?? [];

  function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.42 0.11 210), oklch(0.62 0.13 195))",
            }}
          >
            {getInitials(doctor.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground truncate">
              {doctor.name}
            </h2>
            <p className="text-muted-foreground text-sm">
              {doctor.specialty} · {doctor.clinicName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              data-ocid="doctors.edit_button"
              variant="outline"
              size="icon"
              onClick={onEdit}
              className="w-10 h-10 rounded-xl"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              data-ocid="doctors.delete_button"
              variant="outline"
              size="icon"
              onClick={onDelete}
              className="w-10 h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">
          {/* Contact Info */}
          <section>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
              Contact
            </h3>
            <div className="space-y-2">
              {doctor.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{doctor.phone}</span>
                </div>
              )}
              {doctor.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{doctor.email}</span>
                </div>
              )}
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p>{doctor.address}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {doctor.areaTerritory}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {doctor.notes && (
            <section>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Notes
              </h3>
              <p className="text-sm text-foreground bg-muted/40 rounded-xl p-3">
                {doctor.notes}
              </p>
            </section>
          )}

          {/* Visit History */}
          <section>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
              Visit History ({visits.length})
            </h3>
            {visitsQuery.isLoading ? (
              [1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl mb-2" />
              ))
            ) : visits.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-xl">
                No visits recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {[...visits]
                  .sort((a, b) => Number(b.date - a.date))
                  .map((visit) => (
                    <div
                      key={visit.id.toString()}
                      className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5"
                    >
                      <OutcomeBadge outcome={visit.outcome as string} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {visit.callNotes?.slice(0, 60) || "Visit logged"}
                          {visit.callNotes?.length > 60 ? "…" : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatNsDate(visit.date)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

function FormField({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}
