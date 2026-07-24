// Domain logic for the content-products-reviews domain.
//
// Stateless helper module — all state is injected by the mixin layer and
// main.mo. Real function signatures for the content-products-reviews domain,
// so the develop task can implement against exact shapes.
//
// Scope:
//   - Bilingual text block helpers (Emilie/Anna only; TGOPF stays inline).
//   - 6-slot product store helpers (keyed by ProductKey).
//   - Review helpers are intentionally minimal — the Review type and its
//     `bookTitle` filter field already exist in main.mo. This module only
//     exposes the per-title filter helper the develop task will wire up.

import Types "../types/content-products-reviews";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";

module {
    public type TextBlock = Types.TextBlock;
    public type HomepageTextBlocks = Types.HomepageTextBlocks;
    public type BilingualHomepageTextBlocks = Types.BilingualHomepageTextBlocks;
    public type Product = Types.Product;
    public type ProductKey = Types.ProductKey;
    public type Review = Types.Review;

    // ─── Bilingual text blocks ────────────────────────────────────────────────

    /// Empty bilingual blocks — used as the Dutch-side default when migrating
    /// the existing single-language Emilie/Anna blocks into the English side.
    public func emptyBilingualBlocks() : BilingualHomepageTextBlocks {
        {
            en = emptyBlocks();
            nl = emptyBlocks();
        };
    };

    /// Empty three-block layout.
    public func emptyBlocks() : HomepageTextBlocks {
        {
            block1 = { title = ""; content = "" };
            block2 = { title = ""; content = "" };
            block3 = { title = ""; content = "" };
        };
    };

    /// Build a bilingual record from an existing single-language block set,
    /// placing the old blocks in the English side and leaving Dutch empty.
    /// Used by the migration to convert the legacy `homepageTextBlocksEmilie`
    /// / `homepageTextBlocksAnna` vars into the new bilingual shape.
    public func bilingualFromEnglish(en : HomepageTextBlocks) : BilingualHomepageTextBlocks {
        {
            en;
            nl = emptyBlocks();
        };
    };

    // ─── 6-slot product store ─────────────────────────────────────────────────

    /// The Map type for the 6-slot product store, keyed by stable text key.
    public type ProductStore = Map.Map<Text, Product>;

    /// Build a fresh 6-slot product store pre-seeded with all 6 book titles
    /// and sensible defaults (price 0, empty description, no cover). Called
    /// by main.mo on first launch AND by the migration to populate new slots.
    public func newProductStore() : ProductStore {
        let store = Map.empty<Text, Product>();
        for (key in Types.productKeyOrder.values()) {
            store.add(Types.productKeyToText(key), defaultProduct(key));
        };
        store;
    };

    /// Default product for a given key — title from the canonical list,
    /// everything else zero/empty. The `images` array is kept empty (the
    /// per-product gallery is retired but the field stays on the type).
    public func defaultProduct(key : ProductKey) : Product {
        {
            id = Types.productKeyToText(key);
            title = Types.productKeyTitle(key);
            editionType = "";
            price = 0;
            images = [];
            description = "";
            frontCoverImagePath = null;
            hasCustomImage = false;
        };
    };

    /// Return all 6 products in canonical display order. Missing slots are
    /// filled with the default product so the admin always sees 6 cards.
    public func allProducts(store : ProductStore) : [Product] {
        Types.productKeyOrder.map(func(key) {
            switch (store.get(Types.productKeyToText(key))) {
                case (?p) p;
                case null defaultProduct(key);
            };
        });
    };

    /// Get a single product by key. Returns the default product if the slot
    /// is missing (defensive — the store is always pre-seeded).
    public func getProduct(store : ProductStore, key : ProductKey) : Product {
        switch (store.get(Types.productKeyToText(key))) {
            case (?p) p;
            case null defaultProduct(key);
        };
    };

    /// Get a single product by its stable text key. Returns null for
    /// unknown keys so the caller can distinguish "no such slot" from
    /// "slot exists but is default".
    public func getProductByText(store : ProductStore, textKey : Text) : ?Product {
        switch (Types.productKeyFromText(textKey)) {
            case (?key) ?getProduct(store, key);
            case null null;
        };
    };

    /// Upsert a product into its slot. The product's `id` is ignored — the
    /// slot key is derived from the supplied `key` so the store invariant
    /// (one slot per book title) is preserved.
    public func upsertProduct(store : ProductStore, key : ProductKey, product : Product) : () {
        store.add(Types.productKeyToText(key), { product with id = Types.productKeyToText(key) });
    };

    /// Upsert by stable text key. Returns false if the text key is not one
    /// of the 6 canonical keys (admin input validation).
    public func upsertProductByText(store : ProductStore, textKey : Text, product : Product) : Bool {
        switch (Types.productKeyFromText(textKey)) {
            case (?key) {
                upsertProduct(store, key, product);
                true;
            };
            case null false;
        };
    };

    // ─── Reviews ──────────────────────────────────────────────────────────────

    /// Filter reviews by book title (case-sensitive exact match). The
    /// `bookTitle` field already exists on every Review, so this is a pure
    /// read-side helper the mixin will expose for the "What Readers Say"
    /// title-swap UI.
    public func reviewsByTitle(reviews : Map.Map<Text, Review>, bookTitle : Text) : [Review] {
        reviews.values().toArray().filter(func(r : Review) : Bool { r.bookTitle == bookTitle });
    };

    /// Return the distinct set of book titles that currently have at least
    /// one review, in insertion order. Used by the frontend to render the
    /// title-swap buttons dynamically.
    public func reviewTitles(reviews : Map.Map<Text, Review>) : [Text] {
        let seen = Map.empty<Text, Bool>();
        for (r in reviews.values()) {
            if (seen.get(r.bookTitle) == null) {
                seen.add(r.bookTitle, true);
            };
        };
        seen.keys().toArray();
    };
};
