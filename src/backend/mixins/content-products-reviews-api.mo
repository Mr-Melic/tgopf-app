// Public API mixin for the content-products-reviews domain.
//
// State slices injected from main.mo:
//   - accessControlState           : the existing AccessControl state used by
//                                    every admin-only update in this canister.
//   - homepageTextBlocksEmilieBilingual : the new bilingual Emilie blocks.
//   - homepageTextBlocksAnnaBilingual   : the new bilingual Anna blocks.
//   - products                     : the new 6-slot product store.
//   - reviews                      : the existing reviews map (already has
//                                    bookTitle; no schema change).
//
// Real function signatures for the content-products-reviews domain, so the
// develop task can implement against exact shapes. All admin update functions
// are guarded by the existing
// `AccessControl.hasPermission(accessControlState, caller, #admin)` pattern
// used by `updateHomepageTextBlocksEmilie` etc.

import AccessControl "../authorization/access-control";
import Types "../types/content-products-reviews";
import Lib "../lib/content-products-reviews";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

mixin (
    accessControlState : AccessControl.AccessControlState,
    homepageTextBlocksEmilieBilingual : { var value : Lib.BilingualHomepageTextBlocks },
    homepageTextBlocksAnnaBilingual   : { var value : Lib.BilingualHomepageTextBlocks },
    products : Lib.ProductStore,
    reviews  : Map.Map<Text, Lib.Review>,
) {

    // ─── Bilingual Emilie text blocks ──────────────────────────────────────────

    /// Get the English Emilie "About these Books!" blocks.
    public query func getHomepageTextBlocksEmilieEn() : async Types.HomepageTextBlocks {
        homepageTextBlocksEmilieBilingual.value.en;
    };

    /// Get the Dutch Emilie "About these Books!" blocks.
    public query func getHomepageTextBlocksEmilieNl() : async Types.HomepageTextBlocks {
        homepageTextBlocksEmilieBilingual.value.nl;
    };

    /// Admin-only: update the English Emilie blocks.
    public shared ({ caller }) func updateHomepageTextBlocksEmilieEn(blocks : Types.HomepageTextBlocks) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update Emilie text blocks");
        };
        homepageTextBlocksEmilieBilingual.value := {
            homepageTextBlocksEmilieBilingual.value with en = blocks;
        };
    };

    /// Admin-only: update the Dutch Emilie blocks.
    public shared ({ caller }) func updateHomepageTextBlocksEmilieNl(blocks : Types.HomepageTextBlocks) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update Emilie text blocks");
        };
        homepageTextBlocksEmilieBilingual.value := {
            homepageTextBlocksEmilieBilingual.value with nl = blocks;
        };
    };

    // ─── Bilingual Anna text blocks ────────────────────────────────────────────

    /// Get the English Anna "About these Books!" blocks.
    public query func getHomepageTextBlocksAnnaEn() : async Types.HomepageTextBlocks {
        homepageTextBlocksAnnaBilingual.value.en;
    };

    /// Get the Dutch Anna "About these Books!" blocks.
    public query func getHomepageTextBlocksAnnaNl() : async Types.HomepageTextBlocks {
        homepageTextBlocksAnnaBilingual.value.nl;
    };

    /// Admin-only: update the English Anna blocks.
    public shared ({ caller }) func updateHomepageTextBlocksAnnaEn(blocks : Types.HomepageTextBlocks) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update Anna text blocks");
        };
        homepageTextBlocksAnnaBilingual.value := {
            homepageTextBlocksAnnaBilingual.value with en = blocks;
        };
    };

    /// Admin-only: update the Dutch Anna blocks.
    public shared ({ caller }) func updateHomepageTextBlocksAnnaNl(blocks : Types.HomepageTextBlocks) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update Anna text blocks");
        };
        homepageTextBlocksAnnaBilingual.value := {
            homepageTextBlocksAnnaBilingual.value with nl = blocks;
        };
    };

    // ─── 6-slot products ───────────────────────────────────────────────────────

    /// Get all 6 products in canonical display order. Missing slots are
    /// filled with defaults so the admin always sees 6 cards.
    public query func getProducts() : async [Types.Product] {
        Lib.allProducts(products);
    };

    /// Get a single product by its stable text key (e.g.
    /// "the-gospel-of-poetic-frolic"). Returns null for unknown keys.
    public query func getProductByKey(textKey : Text) : async ?Types.Product {
        Lib.getProductByText(products, textKey);
    };

    /// Admin-only: upsert a product by its stable text key. The product's
    /// `id` is overwritten with the canonical key so the store invariant
    /// (one slot per book title) is preserved. Returns false if the key is
    /// not one of the 6 canonical keys.
    public shared ({ caller }) func updateProductByKey(textKey : Text, product : Types.Product) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update products");
        };
        Lib.upsertProductByText(products, textKey, product);
    };

    // ─── Reviews (per-title filter) ───────────────────────────────────────────
    //
    // The Review type and its `bookTitle` field already exist in main.mo,
    // and main.mo keeps its own `getReviews` / `addReview` / `updateReview`
    // / `deleteReview` functions. To avoid a duplicate-public-func compile
    // error, this mixin does NOT re-declare `getReviews`; it only ADDS the
    // per-title filter helpers alongside the existing review functions.

    /// Get reviews filtered by book title (exact match). Used by the
    /// "What Readers Say" title-swap UI.
    public query func getReviewsByBookTitle(bookTitle : Text) : async [Types.Review] {
        Lib.reviewsByTitle(reviews, bookTitle);
    };

    /// Return the distinct book titles that currently have at least one
    /// review. Used by the frontend to render the title-swap buttons.
    public query func getReviewBookTitles() : async [Text] {
        Lib.reviewTitles(reviews);
    };
};
