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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, Package, Plus, Search, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type Product,
  useAllProducts,
  useDeleteProduct,
  useUpsertProduct,
} from "../hooks/useQueries";
import { MOCK_PRODUCTS } from "../utils/mockData";

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "",
  category: "",
  description: "",
  keyBenefits: "",
  isActive: true,
};

const CATEGORIES = ["Glaucoma", "Lubricants", "Anti-fungal"];

const categoryColors: Record<string, string> = {
  Glaucoma: "bg-indigo-50 text-indigo-700",
  Lubricants: "bg-teal-50 text-teal-700",
  "Anti-fungal": "bg-amber-50 text-amber-700",
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(EMPTY_PRODUCT);

  const productsQuery = useAllProducts();
  const upsertMutation = useUpsertProduct();
  const deleteMutation = useDeleteProduct();

  const products = useMemo(() => {
    const real = productsQuery.data ?? [];
    return real.length > 0 ? real : MOCK_PRODUCTS;
  }, [productsQuery.data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [products, search]);

  function openAdd() {
    setEditProduct(null);
    setForm(EMPTY_PRODUCT);
    setIsFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      keyBenefits: product.keyBenefits,
      isActive: product.isActive,
    });
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        id: editProduct?.id ?? 0n,
        ...form,
      });
      toast.success(editProduct ? "Product updated" : "Product added");
      setIsFormOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Product removed");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete product");
    }
  }

  return (
    <div data-ocid="products.page" className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-xl font-bold text-foreground">
            Products
          </h1>
          <Button
            data-ocid="products.add_button"
            onClick={openAdd}
            size="sm"
            className="gap-2 rounded-xl text-white"
            style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="pl-9 h-11 rounded-xl"
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
          {productsQuery.isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div data-ocid="products.empty_state" className="text-center py-16">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-muted-foreground">
                No products found
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {search ? "Try a different search" : "Add your first product"}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id.toString()}
                  data-ocid={`products.item.${i + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="shadow-card border-0 hover:shadow-card-hover transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-foreground">
                              {product.name}
                            </p>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                product.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <span
                            className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${
                              categoryColors[product.category] ||
                              "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {product.category || "Uncategorized"}
                          </span>
                          <p className="text-muted-foreground text-xs line-clamp-2">
                            {product.description}
                          </p>
                          {product.keyBenefits && (
                            <p className="text-xs mt-2 text-foreground/70">
                              <span className="font-medium">
                                Key benefits:{" "}
                              </span>
                              {product.keyBenefits}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            data-ocid={`products.edit_button.${i + 1}`}
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-xl"
                            onClick={() => openEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            data-ocid={`products.delete_button.${i + 1}`}
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-xl text-destructive hover:bg-destructive/5"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={(o) => !o && setIsFormOpen(false)}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-2xl px-0"
          data-ocid="products.dialog"
        >
          <SheetHeader className="px-5 pb-4 border-b border-border">
            <SheetTitle className="font-display">
              {editProduct ? "Edit Product" : "Add New Product"}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 h-[calc(100%-130px)]">
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Product Name *</Label>
                <Input
                  data-ocid="products.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. ClearView Drops"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`text-xs font-medium px-3 py-2.5 rounded-xl border transition-all text-left ${
                        form.category === cat
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                      }`}
                      style={
                        form.category === cat
                          ? {
                              borderColor: "oklch(0.42 0.11 210)",
                              color: "oklch(0.42 0.11 210)",
                              backgroundColor: "oklch(0.42 0.11 210 / 0.08)",
                            }
                          : {}
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe the product and its clinical use…"
                  className="rounded-xl min-h-[80px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Key Benefits</Label>
                <Textarea
                  data-ocid="products.benefits.textarea"
                  value={form.keyBenefits}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, keyBenefits: e.target.value }))
                  }
                  placeholder="e.g. Once-daily dosing, preservative-free, rapid onset"
                  className="rounded-xl min-h-[70px]"
                />
              </div>
              <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                <Switch
                  data-ocid="products.active.switch"
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isActive: v }))
                  }
                />
                <div>
                  <p className="text-sm font-medium">Active Product</p>
                  <p className="text-xs text-muted-foreground">
                    Show in visit product selection
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="px-5 pt-3 border-t border-border gap-3">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 h-12 rounded-xl"
              data-ocid="products.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="products.save_button"
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="flex-1 h-12 rounded-xl text-white"
              style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
            >
              {upsertMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {editProduct ? "Save Changes" : "Add Product"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="products.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="products.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="products.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
