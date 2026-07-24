// Domain types for the content-products-reviews domain.
//
// This domain owns three concerns requested by the user:
//   1. Bilingual (English + Dutch) homepage text blocks for the Emilie and
//      Anna books. TGOPF text blocks remain single-language and are NOT
//      redefined here (they stay inline in main.mo for backward compat).
//   2. A 6-slot product store keyed by book title, replacing the old
//      firstProduct/secondProduct pair.
//   3. Review storage — the Review type already exists in main.mo and the
//      `bookTitle` field already supports per-title filtering, so this
//      module only re-exports the shared Review shape for the lib/mixin
//      layers and defines the book-title key set.
//
// Real type definitions for the content-products-reviews domain, so the
// develop task can implement against exact signatures.

module {
    // ─── Text blocks ──────────────────────────────────────────────────────────

    /// A single titled content block. Mirrors the inline `TextBlock` already
    /// declared in main.mo so the bilingual wrappers below can reuse it.
    public type TextBlock = {
        title : Text;
        content : Text;
    };

    /// The three-block homepage layout used for every book's "About these
    /// Books!" section.
    public type HomepageTextBlocks = {
        block1 : TextBlock;
        block2 : TextBlock;
        block3 : TextBlock;
    };

    /// Bilingual homepage text blocks — separate English (En) and Dutch (Nl)
    /// versions of the title+content for each of the three blocks.
    /// Used for the Emilie and Anna books only. TGOPF keeps its existing
    /// single-language `HomepageTextBlocks` shape.
    public type BilingualHomepageTextBlocks = {
        en : HomepageTextBlocks;
        nl : HomepageTextBlocks;
    };

    // ─── Products ─────────────────────────────────────────────────────────────

    /// A product slot. Mirrors the inline `Product` type in main.mo. The
    /// `images` gallery array is retained on the type for stable-state
    /// compatibility but is no longer populated by new admin flows (the
    /// per-product gallery is being retired per the user request).
    public type Product = {
        id : Text;
        title : Text;
        editionType : Text;
        price : Nat;
        images : [Text];
        description : Text;
        frontCoverImagePath : ?Text;
        hasCustomImage : Bool;
    };

    /// The 6 canonical book-title keys. Each key maps to one product slot.
    /// Order is significant — `getProducts` returns slots in this order so
    /// the admin sees all 6 cards immediately after migration.
    ///
    ///   1. "the-gospel-of-poetic-frolic"   — The Gospel of Poetic Frolic
    ///   2. "amazon-tgopf-editions"         — Amazon TGOPF Editions
    ///   3. "emilie-and-the-ruins-of-azoth" — Emilie and the Ruins of Azoth
    ///   4. "emilie-en-de-ruine-van-azoth"  — Emilie en de Ruïne van Azoth
    ///   5. "het-lied-van-zeemeermin-anna"  — Het Lied van Zeemeermin Anna
    ///   6. "the-song-of-anna-the-mermaid"  — The Song of Anna the Mermaid
    public type ProductKey = {
        #theGospelOfPoeticFrolic;
        #amazonTgopfEditions;
        #emilieAndTheRuinsOfAzoth;
        #emilieEnDeRuineVanAzoth;
        #hetLiedVanZeemeerminAnna;
        #theSongOfAnnaTheMermaid;
    };

    /// The full ordered list of product keys, in display order.
    public let productKeyOrder : [ProductKey] = [
        #theGospelOfPoeticFrolic,
        #amazonTgopfEditions,
        #emilieAndTheRuinsOfAzoth,
        #emilieEnDeRuineVanAzoth,
        #hetLiedVanZeemeerminAnna,
        #theSongOfAnnaTheMermaid,
    ];

    /// Human-readable title for each product key. Used by the migration to
    /// seed the 6 slots with sensible defaults.
    public func productKeyTitle(key : ProductKey) : Text {
        switch (key) {
            case (#theGospelOfPoeticFrolic)   "The Gospel of Poetic Frolic";
            case (#amazonTgopfEditions)       "Amazon TGOPF Editions";
            case (#emilieAndTheRuinsOfAzoth)  "Emilie and the Ruins of Azoth";
            case (#emilieEnDeRuineVanAzoth)   "Emilie en de Ruïne van Azoth";
            case (#hetLiedVanZeemeerminAnna)  "Het Lied van Zeemeermin Anna";
            case (#theSongOfAnnaTheMermaid)   "The Song of Anna the Mermaid";
        };
    };

    /// Stable text key for a product slot — used as the Map key in the
    /// 6-slot product store.
    public func productKeyToText(key : ProductKey) : Text {
        switch (key) {
            case (#theGospelOfPoeticFrolic)   "the-gospel-of-poetic-frolic";
            case (#amazonTgopfEditions)       "amazon-tgopf-editions";
            case (#emilieAndTheRuinsOfAzoth)  "emilie-and-the-ruins-of-azoth";
            case (#emilieEnDeRuineVanAzoth)   "emilie-en-de-ruine-van-azoth";
            case (#hetLiedVanZeemeerminAnna)  "het-lied-van-zeemeermin-anna";
            case (#theSongOfAnnaTheMermaid)   "the-song-of-anna-the-mermaid";
        };
    };

    /// Parse a stable text key back into a `ProductKey`. Returns `null` for
    /// unknown keys so callers can validate admin input.
    public func productKeyFromText(text : Text) : ?ProductKey {
        switch (text) {
            case ("the-gospel-of-poetic-frolic")   ?#theGospelOfPoeticFrolic;
            case ("amazon-tgopf-editions")         ?#amazonTgopfEditions;
            case ("emilie-and-the-ruins-of-azoth") ?#emilieAndTheRuinsOfAzoth;
            case ("emilie-en-de-ruine-van-azoth")  ?#emilieEnDeRuineVanAzoth;
            case ("het-lied-van-zeemeermin-anna")  ?#hetLiedVanZeemeerminAnna;
            case ("the-song-of-anna-the-mermaid")  ?#theSongOfAnnaTheMermaid;
            case (_) null;
        };
    };

    // ─── Reviews ──────────────────────────────────────────────────────────────
    //
    // The Review type already lives in main.mo and already carries a
    // `bookTitle : Text` field, so per-title filtering needs no schema
    // change. This module re-exports the Review shape as a shared type so
    // the lib/mixin layers can reference it without importing main.mo
    // (which is not importable from a sibling module).

    public type ReviewReaction = { #love; #like; #dislike; #laugh };

    public type Review = {
        id : Text;
        reviewerName : Text;
        companyBlogSite : ?Text;
        bookTitle : Text;
        poemTitle : Text;
        poemSubTitle : Text;
        pageNumbers : Text;
        photoPath : ?Text;
        snippet : Text;
        fullText : Text;
        sourceLink : ?Text;
        videoUrl : ?Text;
        starRating : ?Nat;
        reactions : ?{
            love : Nat;
            like : Nat;
            dislike : Nat;
            laugh : Nat;
        };
    };
};
