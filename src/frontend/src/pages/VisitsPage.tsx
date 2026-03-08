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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  CheckCircle2,
  ClipboardList,
  Edit,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import OutcomeBadge from "../components/OutcomeBadge";
import {
  type Doctor,
  type Product,
  type Visit,
  useAllDoctors,
  useAllProducts,
  useAllVisits,
  useCreateVisit,
  useDeleteVisit,
} from "../hooks/useQueries";
import { dateInputToNs, formatNsDate } from "../utils/dateUtils";
import { MOCK_DOCTORS, MOCK_PRODUCTS, MOCK_VISITS } from "../utils/mockData";

type OutcomeFilter = "all" | "positive" | "neutral" | "negative";

interface VisitForm {
  doctorId: string;
  date: string;
  outcome: "positive" | "neutral" | "negative";
  callNotes: string;
  productsDiscussed: string[];
  nextVisitDate: string;
}

const EMPTY_FORM: VisitForm = {
  doctorId: "",
  date: new Date().toISOString().slice(0, 10),
  outcome: "positive",
  callNotes: "",
  productsDiscussed: [],
  nextVisitDate: "",
};

export default function VisitsPage() {
  const [filter, setFilter] = useState<OutcomeFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewVisit, setViewVisit] = useState<Visit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Visit | null>(null);
  const [form, setForm] = useState<VisitForm>(EMPTY_FORM);

  const visitsQuery = useAllVisits();
  const doctorsQuery = useAllDoctors();
  const productsQuery = useAllProducts();
  const createMutation = useCreateVisit();
  const deleteMutation = useDeleteVisit();

  const doctors = doctorsQuery.data ?? MOCK_DOCTORS;
  const products = productsQuery.data ?? MOCK_PRODUCTS;

  const visits = useMemo(() => {
    const real = visitsQuery.data ?? [];
    return real.length > 0 ? real : MOCK_VISITS;
  }, [visitsQuery.data]);

  const filtered = useMemo(() => {
    const sorted = [...visits].sort((a, b) => Number(b.date - a.date));
    if (filter === "all") return sorted;
    return sorted.filter((v) => (v.outcome as string).toLowerCase() === filter);
  }, [visits, filter]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productsDiscussed: f.productsDiscussed.includes(id)
        ? f.productsDiscussed.filter((p) => p !== id)
        : [...f.productsDiscussed, id],
    }));
  }

  async function handleSave() {
    if (!form.doctorId) {
      toast.error("Please select a doctor");
      return;
    }
    if (!form.date) {
      toast.error("Please select a visit date");
      return;
    }
    try {
      const visit: Visit = {
        id: 0n,
        doctorId: BigInt(form.doctorId),
        date: dateInputToNs(form.date),
        outcome: form.outcome as never,
        callNotes: form.callNotes,
        productsDiscussed: form.productsDiscussed.map(BigInt),
        nextVisitDate: form.nextVisitDate
          ? dateInputToNs(form.nextVisitDate)
          : undefined,
      };
      await createMutation.mutateAsync(visit);
      toast.success("Visit logged successfully");
      setIsFormOpen(false);
    } catch {
      toast.error("Failed to log visit");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Visit removed");
      setDeleteTarget(null);
      setViewVisit(null);
    } catch {
      toast.error("Failed to delete visit");
    }
  }

  const filterTabs: { id: OutcomeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "positive", label: "Positive" },
    { id: "neutral", label: "Neutral" },
    { id: "negative", label: "Negative" },
  ];

  return (
    <div data-ocid="visits.page" className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl font-bold text-foreground">
            Doctor Calls
          </h1>
          <Button
            data-ocid="visits.add_button"
            onClick={openAdd}
            size="sm"
            className="gap-2 rounded-xl text-white"
            style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
          >
            <Plus className="w-4 h-4" />
            Log Call
          </Button>
        </div>
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid="visits.filter.tab"
              onClick={() => setFilter(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                filter === tab.id
                  ? "border-primary text-white"
                  : "border-border text-muted-foreground bg-background hover:bg-muted/40"
              }`}
              style={
                filter === tab.id
                  ? {
                      backgroundColor: "oklch(0.42 0.11 210)",
                      borderColor: "oklch(0.42 0.11 210)",
                    }
                  : {}
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {visitsQuery.isLoading || doctorsQuery.isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div data-ocid="visits.empty_state" className="text-center py-16">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">
                No visits found
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {filter !== "all"
                  ? "No visits with this outcome"
                  : "Log your first doctor call"}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((visit, i) => {
                const doctor = doctors.find((d) => d.id === visit.doctorId);
                const visitProducts = products.filter((p) =>
                  visit.productsDiscussed.includes(p.id),
                );
                return (
                  <motion.div
                    key={`${visit.id.toString()}-${visit.doctorId.toString()}-${visit.date.toString()}`}
                    data-ocid={`visits.item.${i + 1}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setViewVisit(visit)}
                    className="cursor-pointer"
                  >
                    <Card className="shadow-card border-0 hover:shadow-card-hover transition-shadow active:scale-[0.99]">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.42 0.11 210), oklch(0.62 0.13 195))",
                            }}
                          >
                            {doctor?.name
                              ?.split(" ")
                              .map((p: string) => p[0])
                              .slice(0, 2)
                              .join("") || "DR"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {doctor?.name || "Unknown Doctor"}
                                </p>
                                <p className="text-muted-foreground text-xs truncate">
                                  {doctor?.clinicName}
                                </p>
                              </div>
                              <OutcomeBadge outcome={visit.outcome as string} />
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatNsDate(visit.date)}
                              </span>
                              {visitProducts.length > 0 && (
                                <span className="truncate">
                                  {visitProducts.map((p) => p.name).join(", ")}
                                </span>
                              )}
                            </div>
                            {visit.callNotes && (
                              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                                {visit.callNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* View Visit Sheet */}
      <Sheet open={!!viewVisit} onOpenChange={(o) => !o && setViewVisit(null)}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-2xl px-0"
          data-ocid="visits.dialog"
        >
          {viewVisit && (
            <VisitDetailView
              visit={viewVisit}
              doctors={doctors}
              products={products}
              onDelete={() => {
                setDeleteTarget(viewVisit);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Log Visit Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(o) => !o && setIsFormOpen(false)}>
        <SheetContent
          side="bottom"
          className="h-[92vh] rounded-t-2xl px-0"
          data-ocid="visits.dialog"
        >
          <SheetHeader className="px-5 pb-4 border-b border-border">
            <SheetTitle className="font-display">Log Doctor Call</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100%-130px)]">
            <div className="px-5 py-4 space-y-5">
              {/* Doctor Select */}
              <div className="space-y-1.5">
                <Label>Doctor *</Label>
                <Select
                  value={form.doctorId}
                  onValueChange={(v) => setForm((f) => ({ ...f, doctorId: v }))}
                >
                  <SelectTrigger
                    data-ocid="visits.doctor.select"
                    className="h-12 rounded-xl"
                  >
                    <SelectValue placeholder="Select doctor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id.toString()} value={d.id.toString()}>
                        {d.name} · {d.clinicName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label>Visit Date *</Label>
                <Input
                  data-ocid="visits.date.input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Outcome */}
              <div className="space-y-2">
                <Label>Call Outcome</Label>
                <RadioGroup
                  value={form.outcome}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      outcome: v as "positive" | "neutral" | "negative",
                    }))
                  }
                  className="flex gap-3"
                >
                  {[
                    {
                      value: "positive",
                      label: "Positive",
                      color:
                        "text-emerald-700 border-emerald-200 bg-emerald-50",
                    },
                    {
                      value: "neutral",
                      label: "Neutral",
                      color: "text-amber-700 border-amber-200 bg-amber-50",
                    },
                    {
                      value: "negative",
                      label: "Negative",
                      color: "text-red-700 border-red-200 bg-red-50",
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      htmlFor={`outcome-${opt.value}`}
                      className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border cursor-pointer font-medium text-sm transition-all ${
                        form.outcome === opt.value
                          ? opt.color
                          : "border-border bg-background text-foreground"
                      }`}
                    >
                      <RadioGroupItem
                        id={`outcome-${opt.value}`}
                        value={opt.value}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Products Discussed */}
              <div className="space-y-2">
                <Label>Products Discussed</Label>
                <div className="space-y-2">
                  {products
                    .filter((p) => p.isActive)
                    .map((product, idx) => (
                      <div
                        key={product.id.toString()}
                        className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5"
                      >
                        <Checkbox
                          data-ocid={`visits.product.checkbox.${idx + 1}`}
                          id={`product-${product.id}`}
                          checked={form.productsDiscussed.includes(
                            product.id.toString(),
                          )}
                          onCheckedChange={() =>
                            toggleProduct(product.id.toString())
                          }
                        />
                        <label
                          htmlFor={`product-${product.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category}
                          </p>
                        </label>
                      </div>
                    ))}
                  {products.filter((p) => p.isActive).length === 0 && (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl px-3 py-3">
                      No active products. Add products in the Products tab.
                    </p>
                  )}
                </div>
              </div>

              {/* Call Notes */}
              <div className="space-y-1.5">
                <Label>Call Notes</Label>
                <Textarea
                  data-ocid="visits.notes.textarea"
                  value={form.callNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, callNotes: e.target.value }))
                  }
                  placeholder="Summarize the conversation, doctor's response, next steps…"
                  className="rounded-xl min-h-[100px]"
                />
              </div>

              {/* Next Visit Date */}
              <div className="space-y-1.5">
                <Label>Next Visit Date (optional)</Label>
                <Input
                  data-ocid="visits.nextdate.input"
                  type="date"
                  value={form.nextVisitDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nextVisitDate: e.target.value }))
                  }
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="px-5 pt-3 border-t border-border gap-3">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 h-12 rounded-xl"
              data-ocid="visits.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="visits.save_button"
              onClick={handleSave}
              disabled={createMutation.isPending}
              className="flex-1 h-12 rounded-xl text-white"
              style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Log Call
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="visits.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This visit record will be permanently deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="visits.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="visits.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VisitDetailView({
  visit,
  doctors,
  products,
  onDelete,
}: {
  visit: Visit;
  doctors: Doctor[];
  products: Product[];
  onDelete: () => void;
}) {
  const doctor = doctors.find((d) => d.id === visit.doctorId);
  const visitProducts = products.filter((p) =>
    visit.productsDiscussed.includes(p.id),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Visit Details
            </h2>
            <p className="text-muted-foreground text-sm">
              {formatNsDate(visit.date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <OutcomeBadge outcome={visit.outcome as string} size="md" />
            <Button
              data-ocid="visits.delete_button"
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
          <InfoRow label="Doctor">
            <p className="font-medium">{doctor?.name || "Unknown Doctor"}</p>
            <p className="text-sm text-muted-foreground">
              {doctor?.clinicName}
            </p>
          </InfoRow>
          {visitProducts.length > 0 && (
            <InfoRow label="Products Discussed">
              <div className="flex flex-wrap gap-2">
                {visitProducts.map((p) => (
                  <span
                    key={p.id.toString()}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}
          {visit.callNotes && (
            <InfoRow label="Call Notes">
              <p className="text-sm bg-muted/40 rounded-xl p-3">
                {visit.callNotes}
              </p>
            </InfoRow>
          )}
          {visit.nextVisitDate && (
            <InfoRow label="Next Visit Planned">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{formatNsDate(visit.nextVisitDate)}</span>
              </div>
            </InfoRow>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}
