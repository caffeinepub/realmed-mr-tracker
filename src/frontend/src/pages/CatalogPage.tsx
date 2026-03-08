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
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  ImagePlus,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  type Product,
  useAllProducts,
  useDeleteProduct,
  useUpsertProduct,
} from "../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATALOG_CATEGORIES = ["Glaucoma", "Lubricants", "Anti-fungal"] as const;
type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

const CATEGORY_META: Record<
  CatalogCategory,
  { color: string; bg: string; gradFrom: string; gradTo: string; ocid: string }
> = {
  Glaucoma: {
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    gradFrom: "from-indigo-900",
    gradTo: "to-indigo-700",
    ocid: "catalog.glaucoma.tab",
  },
  Lubricants: {
    color: "text-teal-700",
    bg: "bg-teal-50",
    gradFrom: "from-teal-900",
    gradTo: "to-teal-600",
    ocid: "catalog.lubricants.tab",
  },
  "Anti-fungal": {
    color: "text-amber-700",
    bg: "bg-amber-50",
    gradFrom: "from-amber-900",
    gradTo: "to-amber-700",
    ocid: "catalog.antifungal.tab",
  },
};

// ─── Mock catalog products (sample data) ─────────────────────────────────────

const MOCK_CATALOG: Product[] = [
  {
    id: 10n,
    name: "GlaucoGuard Drops",
    category: "Glaucoma",
    description:
      "Prostaglandin analog for once-daily intraocular pressure reduction in open-angle glaucoma and ocular hypertension.",
    keyBenefits:
      "24-hour IOP control · Once-daily dosing · Minimal systemic side effects",
    isActive: true,
  },
  {
    id: 11n,
    name: "PressureEase 0.5%",
    category: "Glaucoma",
    description:
      "Beta-blocker ophthalmic solution that reduces aqueous humor production, lowering elevated intraocular pressure.",
    keyBenefits:
      "Proven efficacy · Twice-daily dosing · Compatible with other glaucoma agents",
    isActive: true,
  },
  {
    id: 12n,
    name: "ClearView Drops",
    category: "Lubricants",
    description:
      "Advanced lubricating eye drops with hyaluronic acid for long-lasting relief from dry eye symptoms.",
    keyBenefits:
      "12-hour relief · Preservative-free · Suitable for contact lens wearers",
    isActive: true,
  },
  {
    id: 13n,
    name: "TearBalance Gel",
    category: "Lubricants",
    description:
      "Viscous carbomer-based ophthalmic gel for severe dry eye and overnight lubrication therapy.",
    keyBenefits:
      "Long-lasting overnight protection · Soothes irritation · pH balanced",
    isActive: true,
  },
  {
    id: 14n,
    name: "FungiClear Eye Drops",
    category: "Anti-fungal",
    description:
      "Natamycin 5% ophthalmic suspension for fungal keratitis caused by filamentous fungi including Fusarium.",
    keyBenefits:
      "Broad-spectrum antifungal · First-line therapy · Well-tolerated formulation",
    isActive: true,
  },
  {
    id: 15n,
    name: "VoriEye 1%",
    category: "Anti-fungal",
    description:
      "Voriconazole ophthalmic solution for resistant or severe fungal corneal infections.",
    keyBenefits:
      "Effective against resistant strains · Penetrates corneal tissue · 2nd-line therapy",
    isActive: true,
  },
];

// ─── Empty form ───────────────────────────────────────────────────────────────

type ProductForm = {
  name: string;
  category: string;
  description: string;
  keyBenefits: string;
  isActive: boolean;
  image?: ExternalBlob;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  category: "Glaucoma",
  description: "",
  keyBenefits: "",
  isActive: true,
};

// ─── Slide direction type ─────────────────────────────────────────────────────
type SlideDir = "left" | "right" | null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const [activeCategory, setActiveCategory] =
    useState<CatalogCategory>("Glaucoma");
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<SlideDir>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const productsQuery = useAllProducts();
  const upsertMutation = useUpsertProduct();
  const deleteMutation = useDeleteProduct();

  // Merge real products with mock catalog products
  const allProducts = useMemo(() => {
    const real = productsQuery.data ?? [];
    if (real.length === 0) return MOCK_CATALOG;
    // Combine real products (which may include catalog categories) with mock for display
    const realIds = new Set(real.map((p) => p.id));
    const mockFill = MOCK_CATALOG.filter((m) => !realIds.has(m.id));
    return [...real, ...mockFill];
  }, [productsQuery.data]);

  // Filter to current category (only Glaucoma, Lubricants, Anti-fungal)
  const categoryProducts = useMemo(
    () => allProducts.filter((p) => p.category === activeCategory),
    [allProducts, activeCategory],
  );

  // Reset slide index when category changes (React derived-state reset pattern)
  const prevCategoryRef = useRef(activeCategory);
  if (prevCategoryRef.current !== activeCategory) {
    prevCategoryRef.current = activeCategory;
    setSlideIndex(0);
  }

  const safeIndex = Math.min(
    slideIndex,
    Math.max(0, categoryProducts.length - 1),
  );
  const currentProduct = categoryProducts[safeIndex] ?? null;

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goTo = useCallback(
    (dir: "prev" | "next") => {
      if (isAnimating || categoryProducts.length <= 1) return;
      const newDir = dir === "next" ? "left" : "right";
      setSlideDir(newDir);
      setIsAnimating(true);
      setSlideIndex((prev) => {
        if (dir === "next") return (prev + 1) % categoryProducts.length;
        return (prev - 1 + categoryProducts.length) % categoryProducts.length;
      });
    },
    [isAnimating, categoryProducts.length],
  );

  // ── Touch swipe handlers ────────────────────────────────────────────────────

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    goTo(dx < 0 ? "next" : "prev");
  }

  // ── Form helpers ────────────────────────────────────────────────────────────

  function openAdd() {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM, category: activeCategory });
    setImagePreview(null);
    setUploadProgress(0);
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
      image: product.image,
    });
    setImagePreview(product.image?.getDirectURL() ?? null);
    setUploadProgress(0);
    setIsFormOpen(true);
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    // Convert to ExternalBlob
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      setForm((f) => ({ ...f, image: blob }));
    } catch {
      toast.error("Failed to process image");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        id: editProduct?.id ?? 0n,
        name: form.name,
        category: form.category,
        description: form.description,
        keyBenefits: form.keyBenefits,
        isActive: form.isActive,
        image: form.image,
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
      setSlideIndex(0);
    } catch {
      toast.error("Failed to delete product");
    }
  }

  const meta = CATEGORY_META[activeCategory];

  // ─── Slide animation variants ──────────────────────────────────────────────

  const slideVariants = {
    enterFromRight: { x: "100%", opacity: 0 },
    enterFromLeft: { x: "-100%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: "-100%", opacity: 0 },
    exitToRight: { x: "100%", opacity: 0 },
  };

  return (
    <div
      data-ocid="catalog.page"
      className="flex flex-col h-full bg-background"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 bg-card border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
          >
            <Layers className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Product Catalog
          </h1>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2">
          {CATALOG_CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                data-ocid={CATEGORY_META[cat].ocid}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 text-xs font-semibold py-2.5 rounded-xl border transition-all ${
                  isActive
                    ? "border-transparent text-white shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
                style={
                  isActive ? { backgroundColor: "oklch(0.42 0.11 210)" } : {}
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Slideshow Area ─────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden px-4 py-4">
        {productsQuery.isLoading ? (
          <div className="h-full flex flex-col gap-4">
            <Skeleton className="flex-1 rounded-2xl" />
            <Skeleton className="h-6 w-32 rounded-full mx-auto" />
          </div>
        ) : categoryProducts.length === 0 ? (
          <div
            data-ocid="catalog.empty_state"
            className="h-full flex flex-col items-center justify-center text-center px-8 gap-4"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
              style={{ backgroundColor: "oklch(0.42 0.11 210 / 0.08)" }}
            >
              <Layers
                className="w-10 h-10"
                style={{ color: "oklch(0.42 0.11 210)" }}
              />
            </div>
            <p className="font-display text-lg font-semibold text-foreground">
              No products yet
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No products in the{" "}
              <span className="font-medium text-foreground">
                {activeCategory}
              </span>{" "}
              category yet. Tap <span className="font-bold">+</span> to add one.
            </p>
          </div>
        ) : (
          <div className="h-full flex flex-col gap-4">
            {/* Slide container */}
            <div
              className="flex-1 relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ minHeight: 0 }}
            >
              <AnimatePresence
                initial={false}
                custom={slideDir}
                onExitComplete={() => setIsAnimating(false)}
              >
                {currentProduct && (
                  <motion.div
                    key={`${currentProduct.id.toString()}-${safeIndex}`}
                    data-ocid={`catalog.item.${safeIndex + 1}`}
                    custom={slideDir}
                    variants={slideVariants}
                    initial={
                      slideDir === "left" ? "enterFromRight" : "enterFromLeft"
                    }
                    animate="center"
                    exit={slideDir === "left" ? "exitToLeft" : "exitToRight"}
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                    className="absolute inset-0 rounded-2xl overflow-hidden shadow-card-hover flex flex-col"
                    style={{ background: "oklch(1 0 0)" }}
                  >
                    {/* Image area (60% height) */}
                    <div
                      className="relative flex-shrink-0"
                      style={{ height: "58%" }}
                    >
                      {currentProduct.image ? (
                        <img
                          src={currentProduct.image.getDirectURL()}
                          alt={currentProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${meta.gradFrom} ${meta.gradTo}`}
                        >
                          <Layers className="w-16 h-16 text-white/30 mb-3" />
                          <span className="text-white/50 text-sm font-medium">
                            No image
                          </span>
                        </div>
                      )}
                      {/* Category badge overlay */}
                      <div className="absolute top-3 left-3">
                        <span
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
                          style={{
                            backgroundColor: "oklch(0.42 0.11 210 / 0.85)",
                          }}
                        >
                          {currentProduct.category}
                        </span>
                      </div>
                      {/* Active badge */}
                      {!currentProduct.isActive && (
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-black/50 text-white/70">
                            Inactive
                          </span>
                        </div>
                      )}
                      {/* Edit icon */}
                      <button
                        type="button"
                        onClick={() => openEdit(currentProduct)}
                        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        aria-label="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {/* Delete icon */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(currentProduct)}
                        className="absolute bottom-3 right-14 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-red-300 hover:bg-black/60 transition-colors"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Info area */}
                    <div className="flex-1 flex flex-col p-5 overflow-hidden">
                      <h2 className="font-display text-xl font-bold text-foreground mb-1 leading-tight">
                        {currentProduct.name}
                      </h2>
                      {currentProduct.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                          {currentProduct.description}
                        </p>
                      )}
                      {currentProduct.keyBenefits && (
                        <div className="mt-auto">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                            Key Benefits
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {currentProduct.keyBenefits
                              .split(/[·•,]/)
                              .map((b) => b.trim())
                              .filter(Boolean)
                              .slice(0, 4)
                              .map((benefit) => (
                                <Badge
                                  key={benefit}
                                  variant="secondary"
                                  className="text-[10px] py-0.5 rounded-full"
                                >
                                  {benefit}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation arrows */}
              {categoryProducts.length > 1 && (
                <>
                  <button
                    type="button"
                    data-ocid="catalog.prev_button"
                    onClick={() => goTo("prev")}
                    disabled={isAnimating}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-white transition-colors disabled:opacity-40"
                    aria-label="Previous product"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    data-ocid="catalog.next_button"
                    onClick={() => goTo("next")}
                    disabled={isAnimating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-foreground hover:bg-white transition-colors disabled:opacity-40"
                    aria-label="Next product"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Slide indicator */}
            <div className="flex items-center justify-center gap-3">
              {/* Dots */}
              <div className="flex gap-1.5">
                {categoryProducts.map((product, i) => (
                  <button
                    key={product.id.toString()}
                    type="button"
                    onClick={() => {
                      if (i === safeIndex || isAnimating) return;
                      setSlideDir(i > safeIndex ? "left" : "right");
                      setIsAnimating(true);
                      setSlideIndex(i);
                    }}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === safeIndex ? "20px" : "6px",
                      backgroundColor:
                        i === safeIndex
                          ? "oklch(0.42 0.11 210)"
                          : "oklch(0.42 0.11 210 / 0.25)",
                    }}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {safeIndex + 1} / {categoryProducts.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <button
        type="button"
        data-ocid="catalog.add_button"
        onClick={openAdd}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
        aria-label="Add product"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Add / Edit Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={isFormOpen} onOpenChange={(o) => !o && setIsFormOpen(false)}>
        <SheetContent
          side="bottom"
          className="h-[92vh] rounded-t-2xl px-0"
          data-ocid="catalog.dialog"
        >
          <SheetHeader className="px-5 pb-4 border-b border-border">
            <SheetTitle className="font-display text-lg">
              {editProduct ? "Edit Product" : "Add Product"}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 h-[calc(100%-130px)]">
            <div className="px-5 py-4 space-y-5">
              {/* Product name */}
              <div className="space-y-1.5">
                <Label htmlFor="catalog-name">Product Name *</Label>
                <Input
                  id="catalog-name"
                  data-ocid="catalog.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. FungiClear Eye Drops"
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label>Category</Label>
                <div data-ocid="catalog.category.select" className="flex gap-2">
                  {CATALOG_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`flex-1 text-xs font-semibold py-3 rounded-xl border transition-all ${
                        form.category === cat
                          ? "border-transparent text-white"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                      }`}
                      style={
                        form.category === cat
                          ? { backgroundColor: "oklch(0.42 0.11 210)" }
                          : {}
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="catalog-description">Description</Label>
                <Textarea
                  id="catalog-description"
                  data-ocid="catalog.description.textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe the product and its clinical use…"
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              {/* Key Benefits */}
              <div className="space-y-1.5">
                <Label htmlFor="catalog-benefits">
                  Key Benefits
                  <span className="text-muted-foreground font-normal ml-1 text-xs">
                    (separate with · or comma)
                  </span>
                </Label>
                <Textarea
                  id="catalog-benefits"
                  data-ocid="catalog.benefits.textarea"
                  value={form.keyBenefits}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, keyBenefits: e.target.value }))
                  }
                  placeholder="e.g. Once-daily dosing · Preservative-free · Rapid onset"
                  className="rounded-xl min-h-[70px]"
                />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label>Product Photo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-1" />
                          <span className="text-sm font-medium">
                            {uploadProgress}%
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      data-ocid="catalog.upload_button"
                      className="absolute bottom-3 right-3 bg-white/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors flex items-center gap-1.5"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    data-ocid="catalog.upload_button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:bg-muted/30 transition-colors"
                    style={{
                      borderColor: "oklch(0.42 0.11 210 / 0.3)",
                    }}
                  >
                    <ImagePlus
                      className="w-8 h-8"
                      style={{ color: "oklch(0.42 0.11 210 / 0.5)" }}
                    />
                    <span className="text-sm font-medium">
                      Tap to upload photo
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      JPG, PNG, WEBP supported
                    </span>
                  </button>
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                <Switch
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
              data-ocid="catalog.cancel_button"
              className="flex-1 h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              data-ocid="catalog.save_button"
              onClick={handleSave}
              disabled={upsertMutation.isPending || isUploading}
              className="flex-1 h-12 rounded-xl text-white"
              style={{ backgroundColor: "oklch(0.42 0.11 210)" }}
            >
              {upsertMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editProduct ? "Save Changes" : "Add Product"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="catalog.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
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
