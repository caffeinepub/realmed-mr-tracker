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
import { Bell, CheckCircle2, Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type Reminder,
  useAllDoctors,
  useAllReminders,
  useCreateReminder,
  useDeleteReminder,
  useMarkReminderDone,
} from "../hooks/useQueries";
import {
  datetimeInputToNs,
  formatNsDate,
  msToNs,
  nsToDatetimeInput,
  relativeDate,
} from "../utils/dateUtils";
import { MOCK_DOCTORS, MOCK_REMINDERS } from "../utils/mockData";

interface ReminderForm {
  title: string;
  note: string;
  dueDate: string;
  linkedDoctorId: string;
}

const EMPTY_FORM: ReminderForm = {
  title: "",
  note: "",
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16),
  linkedDoctorId: "",
};

export default function RemindersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);
  const [form, setForm] = useState<ReminderForm>(EMPTY_FORM);

  const remindersQuery = useAllReminders();
  const doctorsQuery = useAllDoctors();
  const createMutation = useCreateReminder();
  const deleteMutation = useDeleteReminder();
  const markDoneMutation = useMarkReminderDone();

  const doctors = doctorsQuery.data ?? MOCK_DOCTORS;

  const reminders = useMemo(() => {
    const real = remindersQuery.data ?? [];
    return real.length > 0 ? real : MOCK_REMINDERS;
  }, [remindersQuery.data]);

  const { upcoming, done } = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => Number(a.dueDate - b.dueDate));
    return {
      upcoming: sorted.filter((r) => !r.isDone),
      done: sorted.filter((r) => r.isDone),
    };
  }, [reminders]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Reminder title is required");
      return;
    }
    if (!form.dueDate) {
      toast.error("Due date is required");
      return;
    }
    try {
      const reminder: Reminder = {
        id: 0n,
        title: form.title,
        note: form.note,
        dueDate: datetimeInputToNs(form.dueDate),
        isDone: false,
        linkedDoctorId:
          form.linkedDoctorId && form.linkedDoctorId !== "none"
            ? BigInt(form.linkedDoctorId)
            : undefined,
      };
      await createMutation.mutateAsync(reminder);
      toast.success("Reminder created");
      setIsFormOpen(false);
    } catch {
      toast.error("Failed to create reminder");
    }
  }

  async function handleMarkDone(reminder: Reminder) {
    try {
      await markDoneMutation.mutateAsync(reminder.id);
      toast.success("Marked as done");
    } catch {
      toast.error("Failed to update reminder");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Reminder deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete reminder");
    }
  }

  return (
    <div data-ocid="reminders.page" className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-foreground">
            Reminders
          </h1>
          <Button
            data-ocid="reminders.add_button"
            onClick={openAdd}
            size="sm"
            className="gap-2 rounded-xl text-white"
            style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {remindersQuery.isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : (
            <>
              {/* Upcoming */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    Upcoming ({upcoming.length})
                  </h2>
                </div>
                {upcoming.length === 0 ? (
                  <div
                    data-ocid="reminders.empty_state"
                    className="text-center py-10 bg-muted/30 rounded-xl border border-border"
                  >
                    <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">
                      No upcoming reminders
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {upcoming.map((reminder, i) => (
                        <ReminderCard
                          key={reminder.id.toString()}
                          reminder={reminder}
                          index={i}
                          doctors={doctors}
                          onMarkDone={() => handleMarkDone(reminder)}
                          onDelete={() => setDeleteTarget(reminder)}
                          isMarkingDone={markDoneMutation.isPending}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* Done */}
              {done.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h2 className="font-display text-sm font-semibold text-muted-foreground">
                      Completed ({done.length})
                    </h2>
                  </div>
                  <div className="space-y-2 opacity-60">
                    {done.map((reminder, i) => (
                      <ReminderCard
                        key={reminder.id.toString()}
                        reminder={reminder}
                        index={i}
                        doctors={doctors}
                        onMarkDone={() => {}}
                        onDelete={() => setDeleteTarget(reminder)}
                        isMarkingDone={false}
                        isDone
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(o) => !o && setIsFormOpen(false)}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-2xl px-0"
          data-ocid="reminders.dialog"
        >
          <SheetHeader className="px-5 pb-4 border-b border-border">
            <SheetTitle className="font-display">Add Reminder</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100%-130px)]">
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  data-ocid="reminders.title.input"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Follow up with Dr. Sharma"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date & Time *</Label>
                <Input
                  data-ocid="reminders.duedate.input"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea
                  data-ocid="reminders.note.textarea"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="Add any relevant notes or context…"
                  className="rounded-xl min-h-[80px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link to Doctor (optional)</Label>
                <Select
                  value={form.linkedDoctorId || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      linkedDoctorId: v === "none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger
                    data-ocid="reminders.doctor.select"
                    className="h-12 rounded-xl"
                  >
                    <SelectValue placeholder="Select doctor…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No doctor linked</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id.toString()} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="px-5 pt-3 border-t border-border gap-3">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 h-12 rounded-xl"
              data-ocid="reminders.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="reminders.save_button"
              onClick={handleSave}
              disabled={createMutation.isPending}
              className="flex-1 h-12 rounded-xl text-white"
              style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
            >
              {createMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Create Reminder
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="reminders.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              "<strong>{deleteTarget?.title}</strong>" will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="reminders.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="reminders.confirm_button"
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

function ReminderCard({
  reminder,
  index,
  doctors,
  onMarkDone,
  onDelete,
  isMarkingDone,
  isDone = false,
}: {
  reminder: Reminder;
  index: number;
  doctors: { id: bigint; name: string }[];
  onMarkDone: () => void;
  onDelete: () => void;
  isMarkingDone: boolean;
  isDone?: boolean;
}) {
  const linkedDoctor = doctors.find((d) => d.id === reminder.linkedDoctorId);
  const isOverdue =
    !isDone && Number(reminder.dueDate) < Date.now() * 1_000_000;

  return (
    <motion.div
      data-ocid={`reminders.item.${index + 1}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card
        className={`shadow-card border-0 ${isOverdue ? "ring-1 ring-destructive/20" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              data-ocid={`reminders.checkbox.${index + 1}`}
              checked={isDone}
              onCheckedChange={!isDone ? onMarkDone : undefined}
              disabled={isDone || isMarkingDone}
              className="mt-0.5 w-5 h-5 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {reminder.title}
              </p>
              {reminder.note && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {reminder.note}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`text-xs font-medium flex items-center gap-1 ${
                    isOverdue
                      ? "text-destructive"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-amber-600"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {isDone
                    ? formatNsDate(reminder.dueDate)
                    : relativeDate(reminder.dueDate)}
                </span>
                {linkedDoctor && (
                  <span className="text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                    {linkedDoctor.name}
                  </span>
                )}
              </div>
            </div>
            <Button
              data-ocid={`reminders.delete_button.${index + 1}`}
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 flex-shrink-0"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
