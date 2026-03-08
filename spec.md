# Realmed MR Tracker

## Current State
The app has 5 pages: Dashboard, Doctors, Products, Visits, Reminders. The Products page is a scrollable list with cards. Products have: id, name, category, description, keyBenefits, isActive. Categories are generic ophthalmology types. No image support exists.

## Requested Changes (Diff)

### Add
- New "Catalog" page (or replace/enhance Products with a Catalog view) with a slideshow/carousel presentation style
- Three specific product categories: Glaucoma, Lubricants, Anti-fungal
- Ability to upload a product photo (image) one by one for each product
- Backend: add `imageUrl` field to the Product type to store a product image URL/data URI
- Category tab bar to filter slideshow by Glaucoma / Lubricants / Anti-fungal
- Full-screen-style swipeable slideshow per category showing one product at a time with its photo prominently
- "Add Product" form with image upload (from photo/PDF page screenshots) and category selection restricted to the three new categories
- Navigation tab for the new Catalog view

### Modify
- Product type in backend: add optional `imageUrl: Text` field
- Categories list: replace generic categories with Glaucoma, Lubricants, Anti-fungal
- Products page or a new Catalog page shows the slideshow view
- The existing Products list view can remain for admin management; the new Catalog is the presentation-focused view

### Remove
- Old generic categories (Dry Eye Treatment, Nutritional Supplement, etc.) -- replaced by the three pharma-specific ones

## Implementation Plan
1. Update backend `Product` type to add `imageUrl: Text` field; update `upsertProduct` and related functions
2. Regenerate `backend.d.ts` bindings to reflect the new field
3. Create a new `CatalogPage.tsx` with:
   - Category tab bar (Glaucoma / Lubricants / Anti-fungal)
   - Fullscreen swipeable card carousel (one product at a time)
   - Each slide shows: product image (large), product name, key benefits, description
   - "Add Product" FAB/button opens a sheet with: name, category selector (3 options), description, key benefits, image upload (file input accepting images)
   - Left/right navigation arrows and swipe support
   - Slide counter (e.g. "2 / 5")
4. Update `App.tsx` to add a "Catalog" tab in the bottom nav
5. Update `BottomNav.tsx` to include the Catalog tab icon
6. Keep existing `ProductsPage.tsx` for list management (admin), but update its category options to the 3 new ones
