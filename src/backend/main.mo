import Registry "blob-storage/registry";
import BlobStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import GamesTypes "types/games";
import GamesLib "lib/games";
import GamesAPI "mixins/games-api";
import _FavouritesTypes "types/favourites";
import FavouritesAPI "mixins/favourites-api";
import ShortMessagesTypes "types/short-messages";
import ShortMessagesAPI "mixins/short-messages-api";
import AmazonRegionTypes "types/amazon-regions";
import AmazonRegionLib "lib/amazon-regions";
import AmazonRegionsAPI "mixins/amazon-regions-api";
import PaymentCountryTypes "types/payment-countries";
import PaymentCountriesLib "lib/payment-countries";
import PaymentOptionsAPI "mixins/payment-options-api";
import DonationTypes "types/donations";
import DonationsAPI "mixins/donations-api";
import EmojiInflation "lib/EmojiInflation";








import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Random "mo:core/Random";
import Nat8 "mo:core/Nat8";
import Blob "mo:core/Blob";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Time "mo:core/Time";
import _Result "mo:core/Result";
import Order "mo:core/Order";
import AmazonRegionsMultiLib "lib/amazon-regions-multi";
import AmazonRegionsMultiAPI "mixins/amazon-regions-multi-api";

import AnnouncementsAPI "mixins/announcements-api";
import AnnouncementsTypes "types/announcements";

import ContentProductsReviewsTypes "types/content-products-reviews";
import ContentProductsReviewsLib "lib/content-products-reviews";
import ContentProductsReviewsAPI "mixins/content-products-reviews-api";

import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";

// Identity implicit instance for `OQL.Value -> OQL.Value`. Several OQL
// entity declarations below extract fields already shaped as `OQL.Value`
// (e.g. `#text r.id`, or via `_optTextToValue`/`_optNatToValue`), so the
// `.payload` builder needs an identity `V -> Value` implicit. Importing
// the module makes the compiler walk its `_toRow` field during implicit
// resolution. See `lib/OqlValueId.mo`.
import OqlValueId "lib/OqlValueId";
























 actor {
    // ─── Migration: registry -> blobRegistry rename ────────────────────────────
    // The previous deployed version had a stable `registry` (blob-storage).
    // It was renamed to `blobRegistry` to avoid colliding with the OQL Expose
    // mixin's `transient let registry`. Renaming is not stable-compatible, so
    // an explicit migration function (Migration.run) consumes and discards the
    // old `registry`. This is a draft deployment, so discarding is acceptable;
    // `blobRegistry` is re-initialized fresh by its declaration below.
    // See migration.mo for the OldActor/NewActor definitions.

    // ─── Dead vars: kept ONLY for stable-variable migration compatibility (M0169) ───
    // These were removed when features were retired. DO NOT USE or re-activate them.
    // Removing them would cause a M0169 error against the deployed canister state.
    let visitorCount : Nat = 0;
    ignore visitorCount; // Inflation removed — kept only for stable variable migration compatibility

    // SC price inflation — feature removed entirely. DO NOT re-enable.
    // Kept only for stable variable migration compatibility (M0169).
    type InflationHistoryEntry = { year : Int; oldPrice : Float; newPrice : Float; ratePercent : Float; appliedAt : Int };
    let bookInflation : { id : Text; basePrice : Float; currentPrice : Float; inflationRatePercent : Float; lastAppliedYear : Int; history : [InflationHistoryEntry] } = {
        id = "book"; basePrice = 39.39; currentPrice = 39.39; inflationRatePercent = 10.0; lastAppliedYear = 0; history = [];
    };
    let shippingInflation : { id : Text; basePrice : Float; currentPrice : Float; inflationRatePercent : Float; lastAppliedYear : Int; history : [InflationHistoryEntry] } = {
        id = "shipping"; basePrice = 0.0; currentPrice = 0.0; inflationRatePercent = 6.0; lastAppliedYear = 0; history = [];
    };
    var _dailyCheckNs : Int = 0;
    ignore bookInflation;    // Inflation removed — kept only for stable variable migration compatibility
    ignore shippingInflation; // Inflation removed — kept only for stable variable migration compatibility
    ignore _dailyCheckNs;    // Inflation removed — kept only for stable variable migration compatibility

    // ─── Upgrade tombstones — never used, kept for stable memory compatibility ────
    // These stable vars existed in a previously deployed version of this canister.
    // They MUST stay declared here (as stable vars with matching names/types) so
    // the M0169 upgrade checker does not reject the deployment.
    type _AdImageTombstone = { id : Nat; sectionId : Text; fileKey : Text; sortOrder : Nat };
    var adImages : [_AdImageTombstone] = [];
    var nextAdImageId : Nat = 0;
    type _ModelPhotoPanelTombstone = { panelId : Nat; images : [Text] };
    var modelPhotoPanels : [_ModelPhotoPanelTombstone] = [
        { panelId = 1; images = [] },
        { panelId = 2; images = [] },
        { panelId = 3; images = [] },
        { panelId = 4; images = [] }
    ];

    // ─── Emoji Manual Distribution ────────────────────────────────────────────
    // Manual distribution counts: admin distributes emoji amounts manually.
    // Keyed by entity key: "{entityType}:{entityId}:{reactionType}"
    // No automatic computation ever runs. Counts only grow when the admin
    // explicitly calls distributeEmojiManually().
    var manualDistributionCounts = Map.empty<Text, Nat>();

    // Admin-configurable emoji inflation ratio ranges.
    // Scaled by 1_000_000_000 (e.g. 1_000_000_000 = ratio 1.0).
    // Laugh: 0.006–0.012  |  Dislike: 0.001–0.003  (as requested)
    var emojiRatioConfig : EmojiInflation.EmojiRatioConfig = {
        loveMin    = 1_000_000_000;  // 1.0
        loveMax    = 2_000_000_000;  // 2.0
        likeMin    = 450_000_000;    // 0.45
        likeMax    = 900_000_000;    // 0.9
        laughMin   = 6_000_000;      // 0.006
        laughMax   = 12_000_000;     // 0.012
        dislikeMin = 1_000_000;      // 0.001
        dislikeMax = 3_000_000;      // 0.003
    };

    // Tracks cumulative real-user engagement per entity key (never decrements).
    // entity_key = "{type}:{id}:{reaction}"  e.g. "review:abc123:love"
    let userReactionCounts = Map.empty<Text, Nat>();

    // ─── Feature toggle state ─────────────────────────────────────────────────
    // All toggles use mutable record fields. Enhanced orthogonal persistence
    // keeps them alive across upgrades without the stable keyword.

    /// When false: triggerInflation() returns immediately — zero computation, zero cycle cost.
    let emojiSystemState = { var enabled : Bool = true };

    /// When false: getCryptoRates() returns cached/fallback values — no HTTP outcall.
    let cryptoSystemState = { var enabled : Bool = true };

    /// Controls whether the Amazon region payment section is shown for Emilie.
    /// Default false — the book is not yet live on Amazon.
    let emilieAmazonState = { var enabled : Bool = false };

    /// Controls whether the Amazon region payment section is shown for Anna.
    /// Default false — the book is not yet live on Amazon.
    let annaAmazonState = { var enabled : Bool = false };

    /// Controls whether the Amazon region payment section is shown for
    /// "The Song of Anna the Mermaid" 1st edition (book key "anna-song").
    /// Default false — the book is not yet live on Amazon.
    let annaSongAmazonState = { var enabled : Bool = false };

    /// Controls whether the Amazon region payment section is shown for
    /// "Emilie en de Ruïne van Azoth" 1st edition (book key "emilie-nl").
    /// Default false — the book is not yet live on Amazon.
    let emilieNlAmazonState = { var enabled : Bool = false };

    /// Controls whether the site-wide maintenance notice popup is shown to
    /// visitors. Default true — the notice is ON after deploy. The frontend
    /// renders a large modal overlay on every page when enabled; dismissal is
    /// remembered per-session via sessionStorage, so the popup reappears in
    /// new sessions while this stays ON. Admins toggle it from the System
    /// section. Additive state only — no other stable declarations touched.
    let maintenanceNotice = { var enabled : Bool = true };

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// Add n to userReactionCounts[key].
    func _incUserCount(key : Text) {
        let prev = switch (userReactionCounts.get(key)) { case (?v) v; case null 0 };
        userReactionCounts.add(key, prev + 1);
    };

    /// Get the manual distribution count for an entity key (0 if not present).
    func _autoCount(key : Text) : Nat {
        switch (manualDistributionCounts.get(key)) { case (?v) v; case null 0 };
    };

    /// Build combined display counts for a review using the v2 namespace.
    func _reviewV2DisplayReactions(reviewId : Text, base : { love : Nat; like : Nat; dislike : Nat; laugh : Nat }) : { love : Nat; like : Nat; dislike : Nat; laugh : Nat } {
        {
            love    = base.love    + _autoCount("review_v2:" # reviewId # ":love");
            like    = base.like    + _autoCount("review_v2:" # reviewId # ":like");
            dislike = base.dislike + _autoCount("review_v2:" # reviewId # ":dislike");
            laugh   = base.laugh   + _autoCount("review_v2:" # reviewId # ":laugh");
        };
    };

    /// Build combined display counts for a reflection block.
    func _reflectionDisplayReactions(blockId : Text, base : { love : Nat; like : Nat; dislike : Nat; laugh : Nat }) : { love : Nat; like : Nat; dislike : Nat; laugh : Nat } {
        {
            love    = base.love    + _autoCount("reflection:" # blockId # ":love");
            like    = base.like    + _autoCount("reflection:" # blockId # ":like");
            dislike = base.dislike + _autoCount("reflection:" # blockId # ":dislike");
            laugh   = base.laugh   + _autoCount("reflection:" # blockId # ":laugh");
        };
    };

    /// Build combined display counts for an author note.
    func _authorNoteDisplayReactions(noteId : Text, base : { love : Nat; like : Nat; dislike : Nat; laugh : Nat }) : { love : Nat; like : Nat; dislike : Nat; laugh : Nat } {
        {
            love    = base.love    + _autoCount("author_note:" # noteId # ":love");
            like    = base.like    + _autoCount("author_note:" # noteId # ":like");
            dislike = base.dislike + _autoCount("author_note:" # noteId # ":dislike");
            laugh   = base.laugh   + _autoCount("author_note:" # noteId # ":laugh");
        };
    };

    /// Build combined display counts for a game.
    func _gameDisplayReactionCounts(gameId : Text, userCounts : GamesTypes.GameReactionCounts) : GamesTypes.GameReactionCounts {
        {
            love    = userCounts.love    + _autoCount("game:" # gameId # ":love");
            like    = userCounts.like    + _autoCount("game:" # gameId # ":like");
            dislike = userCounts.dislike + _autoCount("game:" # gameId # ":dislike");
            laugh   = userCounts.laugh   + _autoCount("game:" # gameId # ":laugh");
        };
    };

    // ── Public trigger function ───────────────────────────────────────────────

    /// No-op: kept for frontend binding compatibility.
    /// Automatic inflation has been removed. All emoji distribution is manual via distributeEmojiManually().
    public shared func triggerInflation() : async () {
        return;
    };

    /// Public query: returns the current emoji inflation ratio config.
    public query func getInflationRatios() : async EmojiInflation.EmojiRatioConfig {
        emojiRatioConfig;
    };

    /// Admin-only: update the emoji inflation ratio config.
    public shared ({ caller }) func setInflationRatios(config : EmojiInflation.EmojiRatioConfig) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        emojiRatioConfig := config;
    };

    /// Admin-only: manually distribute totalAmount emoji reactions across all items
    /// in the given section, randomly within the configured ratio ranges.
    /// Adds to existing counts — never replaces or removes existing data.
    /// section: "reviews" | "challenges" | "authorNotes" | "games"
    public shared(msg) func distributeEmojiManually(section : Text, totalAmount : Nat) : async () {
        assert(AccessControl.isAdmin(accessControlState, msg.caller));
        if (totalAmount == 0) { return; };

        // Validate and use section value directly as the entity key prefix.
        // The frontend sends the prefix directly: "review_v2", "reflection", "author_note", "game".
        if (section != "review_v2" and section != "reflection" and section != "author_note" and section != "game") {
            Runtime.trap("Unknown section: " # section);
        };
        let prefix = section;

        // Collect all entity IDs in this section
        let entityIds = Map.empty<Text, Bool>();
        for ((k, _) in manualDistributionCounts.entries()) {
            if (k.startsWith(#text (prefix # ":"))) {
                // Extract entity ID from key format "{prefix}:{id}:{reaction}"
                let stripped = switch (k.stripStart(#text (prefix # ":"))) {
                    case (?s) s;
                    case null k;
                };
                // Find second colon to extract just the id part
                var colonPos = 0;
                var foundColon = false;
                var idText = "";
                label findColon for (c in stripped.chars()) {
                    if (c == ':' and not foundColon) {
                        foundColon := true;
                        break findColon;
                    };
                    if (not foundColon) {
                        idText #= Text.fromChar(c);
                        colonPos += 1;
                    };
                };
                if (idText != "") { entityIds.add(idText, true) };
            };
        };

        // Also collect IDs from the actual data maps (items with no distribution yet)
        switch prefix {
            case "review_v2" {
                for ((id, _) in reviews.entries()) { entityIds.add(id, true) };
            };
            case "reflection" {
                for ((id, _) in reflectionBlocks.entries()) { entityIds.add(id, true) };
            };
            case "author_note" {
                for ((id, _) in authorNotes.entries()) { entityIds.add(id, true) };
            };
            case "game" {
                for ((id, _) in games.entries()) { entityIds.add(id, true) };
            };
            case _ {};
        };

        let ids = entityIds.keys().toArray();
        let numItems = ids.size();
        if (numItems == 0) { return; };

        // Get a random seed for distribution
        let seed : Blob = await Random.blob();
        let seedBytes = seed.toArray();
        let seedLen = seedBytes.size();

        // Simple pseudo-random helper using seed bytes
        func randByte(idx : Nat) : Nat {
            if (seedLen == 0) return 0;
            seedBytes[idx % seedLen].toNat();
        };

        // Distribute totalAmount across items randomly within ratio ranges
        let reactions = ["love", "like", "laugh", "dislike"];

        // Compute total ratio weight (use midpoints of configured ranges)
        let loveWeight  = (emojiRatioConfig.loveMin  + emojiRatioConfig.loveMax)  / 2;
        let likeWeight  = (emojiRatioConfig.likeMin  + emojiRatioConfig.likeMax)  / 2;
        let laughWeight = (emojiRatioConfig.laughMin + emojiRatioConfig.laughMax) / 2;
        let dislikeWeight = (emojiRatioConfig.dislikeMin + emojiRatioConfig.dislikeMax) / 2;
        let totalWeight = loveWeight + likeWeight + laughWeight + dislikeWeight;

        if (totalWeight == 0) { return; };

        // Split totalAmount by ratio
        let loveAmt    = (totalAmount * loveWeight)    / totalWeight;
        let likeAmt    = (totalAmount * likeWeight)    / totalWeight;
        let laughAmt   = (totalAmount * laughWeight)   / totalWeight;
        let dislikeAmt = totalAmount - loveAmt - likeAmt - laughAmt; // remainder to dislike

        // Distribute each reaction's total across items randomly
        var seedOffset = 0;
        func distributeAcrossItems(rxType : Text, amount : Nat) {
            if (amount == 0 or numItems == 0) return;
            // Assign random amounts summing to `amount`
            // Strategy: for each item assign a random share, then normalize
            var remaining = amount;
            var i = 0;
            while (i < numItems) {
                let key = prefix # ":" # ids[i] # ":" # rxType;
                let share = if (i == numItems - 1) {
                    // Last item gets the remainder
                    remaining;
                } else {
                    // Random share: between 0 and remaining/remaining-items
                    let maxShare = remaining / (numItems - i);
                    let r = randByte(seedOffset);
                    seedOffset += 1;
                    if (maxShare == 0) 0
                    else (r % (maxShare + 1));
                };
                if (share > 0) {
                    let prev = switch (manualDistributionCounts.get(key)) { case (?v) v; case null 0 };
                    manualDistributionCounts.add(key, prev + share);
                    remaining -= share;
                };
                i += 1;
            };
        };

        distributeAcrossItems("love",    loveAmt);
        distributeAcrossItems("like",    likeAmt);
        distributeAcrossItems("laugh",   laughAmt);
        distributeAcrossItems("dislike", dislikeAmt);
    };

    /// Read-only preview: returns what WOULD be distributed if distributeEmojiManually
    /// were called with the given section and totalAmount.
    /// Returns [(itemId, love, like, laugh, dislike)] — does NOT apply anything.
    public shared query func getDistributionPreview(section : Text, totalAmount : Nat) : async [(Text, Nat, Nat, Nat, Nat)] {
        if (totalAmount == 0) { return [] };

        // Validate and use section value directly as the entity key prefix.
        // The frontend sends the prefix directly: "review_v2", "reflection", "author_note", "game".
        if (section != "review_v2" and section != "reflection" and section != "author_note" and section != "game") {
            return [];
        };
        let prefix = section;

        // Collect entity IDs from live data
        let entityIds = Map.empty<Text, Bool>();
        switch prefix {
            case "review_v2" {
                for ((id, _) in reviews.entries()) { entityIds.add(id, true) };
            };
            case "reflection" {
                for ((id, _) in reflectionBlocks.entries()) { entityIds.add(id, true) };
            };
            case "author_note" {
                for ((id, _) in authorNotes.entries()) { entityIds.add(id, true) };
            };
            case "game" {
                for ((id, _) in games.entries()) { entityIds.add(id, true) };
            };
            case _ {};
        };

        let ids = entityIds.keys().toArray();
        let numItems = ids.size();
        if (numItems == 0) { return [] };

        // Compute split amounts using ratio midpoints
        let loveWeight    = (emojiRatioConfig.loveMin    + emojiRatioConfig.loveMax)    / 2;
        let likeWeight    = (emojiRatioConfig.likeMin    + emojiRatioConfig.likeMax)    / 2;
        let laughWeight   = (emojiRatioConfig.laughMin   + emojiRatioConfig.laughMax)   / 2;
        let dislikeWeight = (emojiRatioConfig.dislikeMin + emojiRatioConfig.dislikeMax) / 2;
        let totalWeight   = loveWeight + likeWeight + laughWeight + dislikeWeight;

        if (totalWeight == 0) { return [] };

        let loveAmt    = (totalAmount * loveWeight)    / totalWeight;
        let likeAmt    = (totalAmount * likeWeight)    / totalWeight;
        let laughAmt   = (totalAmount * laughWeight)   / totalWeight;
        let dislikeAmt = totalAmount - loveAmt - likeAmt - laughAmt;

        // Evenly split across items for the preview (no randomness needed for preview)
        let perItemLove    = loveAmt    / numItems;
        let perItemLike    = likeAmt    / numItems;
        let perItemLaugh   = laughAmt   / numItems;
        let perItemDislike = dislikeAmt / numItems;

        ids.map(func id { (id, perItemLove, perItemLike, perItemLaugh, perItemDislike) });
    };

    /// Admin-only: reset the manual distribution counts (e.g. for a clean slate).
    /// Does NOT touch per-item user reaction data.
    public shared ({ caller }) func resetInflationCounts() : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        for ((k, _) in manualDistributionCounts.entries()) {
            manualDistributionCounts.remove(k);
        };
    };

    // ── Admin monitor queries ─────────────────────────────────────────────────

    /// Admin-only: full raw distribution stats for the monitor panel.
    public query ({ caller }) func getInflationStats() : async {
        automatedCounts : [(Text, Nat)];
        userCounts      : [(Text, Nat)];
        totalEntities   : Nat;
        lastRunTime     : Int;
        launchTime      : Int;
    } {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            return {
                automatedCounts = [];
                userCounts      = [];
                totalEntities   = 0;
                lastRunTime     = 0;
                launchTime      = 0;
            };
        };
        {
            automatedCounts = manualDistributionCounts.toArray();
            userCounts      = userReactionCounts.toArray();
            totalEntities   = manualDistributionCounts.size() + userReactionCounts.size();
            lastRunTime     = 0;
            launchTime      = 0;
        };
    };

    // Per-section, per-emoji breakdown record
    public type EmojiBreakdown = {
        autoLove    : Nat;
        autoLike    : Nat;
        autoLaugh   : Nat;
        autoDislike : Nat;
        userLove    : Nat;
        userLike    : Nat;
        userLaugh   : Nat;
        userDislike : Nat;
    };

    /// Admin-only: summary grouped by section (review / reflection / author_note / game).
    /// Returns per-section, per-emoji breakdown: automated counts vs user-clicked counts.
    public query ({ caller }) func getInflationSummary() : async {
        totalAutomated : Nat;
        totalUser      : Nat;
        bySection      : [(Text, EmojiBreakdown)];
    } {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            return { totalAutomated = 0; totalUser = 0; bySection = [] };
        };

        // Mutable breakdown per section
        var reviewV2Auto  : EmojiBreakdown = { autoLove=0; autoLike=0; autoLaugh=0; autoDislike=0; userLove=0; userLike=0; userLaugh=0; userDislike=0 };
        var reflectionAuto : EmojiBreakdown = { autoLove=0; autoLike=0; autoLaugh=0; autoDislike=0; userLove=0; userLike=0; userLaugh=0; userDislike=0 };
        var authorNoteAuto : EmojiBreakdown = { autoLove=0; autoLike=0; autoLaugh=0; autoDislike=0; userLove=0; userLike=0; userLaugh=0; userDislike=0 };
        var gameAuto       : EmojiBreakdown = { autoLove=0; autoLike=0; autoLaugh=0; autoDislike=0; userLove=0; userLike=0; userLaugh=0; userDislike=0 };

        var totalAuto  : Nat = 0;
        var totalUser2 : Nat = 0;

        // Helper: derive reaction type from key suffix
        func _rxType(k : Text) : Text {
            if      (k.endsWith(#text ":love"))    "love"
            else if (k.endsWith(#text ":like"))    "like"
            else if (k.endsWith(#text ":laugh"))   "laugh"
            else if (k.endsWith(#text ":dislike")) "dislike"
            else                                   ""
        };

        // Helper: apply automated count to a section breakdown
        func _addAuto(bd : EmojiBreakdown, rx : Text, v : Nat) : EmojiBreakdown {
            switch rx {
                case "love"    { { bd with autoLove    = bd.autoLove    + v } };
                case "like"    { { bd with autoLike    = bd.autoLike    + v } };
                case "laugh"   { { bd with autoLaugh   = bd.autoLaugh   + v } };
                case "dislike" { { bd with autoDislike = bd.autoDislike + v } };
                case _         { bd };
            }
        };

        // Helper: apply user count to a section breakdown
        func _addUser(bd : EmojiBreakdown, rx : Text, v : Nat) : EmojiBreakdown {
            switch rx {
                case "love"    { { bd with userLove    = bd.userLove    + v } };
                case "like"    { { bd with userLike    = bd.userLike    + v } };
                case "laugh"   { { bd with userLaugh   = bd.userLaugh   + v } };
                case "dislike" { { bd with userDislike = bd.userDislike + v } };
                case _         { bd };
            }
        };

        // Determine section from key prefix
        func _section(k : Text) : Text {
            // Key format: "{entityType}:{entityId}:{reaction}"
            // entityType can be "review_v2", "reflection", "author_note", "game"
            // We match by prefix before first colon
            if      (k.startsWith(#text "review_v2:"))    "review_v2"
            else if (k.startsWith(#text "reflection:"))  "reflection"
            else if (k.startsWith(#text "author_note:")) "author_note"
            else if (k.startsWith(#text "game:"))        "game"
            else                                         ""
        };

        for ((k, v) in manualDistributionCounts.entries()) {
            totalAuto += v;
            let rx  = _rxType(k);
            let sec = _section(k);
            if (rx != "" and sec != "") {
                switch sec {
                    case "review_v2"   { reviewV2Auto    := _addAuto(reviewV2Auto,    rx, v) };
                    case "reflection"  { reflectionAuto := _addAuto(reflectionAuto, rx, v) };
                    case "author_note" { authorNoteAuto := _addAuto(authorNoteAuto, rx, v) };
                    case "game"        { gameAuto       := _addAuto(gameAuto,       rx, v) };
                    case _             {};
                };
            };
        };

        for ((k, v) in userReactionCounts.entries()) {
            totalUser2 += v;
            let rx  = _rxType(k);
            let sec = _section(k);
            if (rx != "" and sec != "") {
                switch sec {
                    case "review_v2"   { reviewV2Auto    := _addUser(reviewV2Auto,    rx, v) };
                    case "reflection"  { reflectionAuto := _addUser(reflectionAuto, rx, v) };
                    case "author_note" { authorNoteAuto := _addUser(authorNoteAuto, rx, v) };
                    case "game"        { gameAuto       := _addUser(gameAuto,       rx, v) };
                    case _             {};
                };
            };
        };

        {
            totalAutomated = totalAuto;
            totalUser = totalUser2;
            bySection = [
                ("review_v2",   reviewV2Auto),
                ("reflection",  reflectionAuto),
                ("author_note", authorNoteAuto),
                ("game",        gameAuto),
            ];
        };
    };

    public type PolicyType = {
        #intellectualProperty;
        #termsAndConditions;
        #privacyPolicy;
        #refundAndReturn;
        #shippingAndDelivery;
        #cookiePolicy;
        #disclaimerLiability;
        #promotionalTerms;
    };

    public type PolicyContent = {
        policyType : PolicyType;
        title : Text;
        content : Text;
    };

    func comparePolicyType(a : PolicyType, b : PolicyType) : { #less; #equal; #greater } {
        switch (a, b) {
            case (#intellectualProperty, #intellectualProperty) { #equal };
            case (#intellectualProperty, _) { #less };
            case (#termsAndConditions, #intellectualProperty) { #greater };
            case (#termsAndConditions, #termsAndConditions) { #equal };
            case (#termsAndConditions, _) { #less };
            case (#privacyPolicy, #intellectualProperty) { #greater };
            case (#privacyPolicy, #termsAndConditions) { #greater };
            case (#privacyPolicy, #privacyPolicy) { #equal };
            case (#privacyPolicy, _) { #less };
            case (#refundAndReturn, #shippingAndDelivery) { #less };
            case (#refundAndReturn, #cookiePolicy) { #less };
            case (#refundAndReturn, #disclaimerLiability) { #less };
            case (#refundAndReturn, #promotionalTerms) { #less };
            case (#refundAndReturn, #refundAndReturn) { #equal };
            case (#refundAndReturn, _) { #greater };
            case (#shippingAndDelivery, #cookiePolicy) { #less };
            case (#shippingAndDelivery, #disclaimerLiability) { #less };
            case (#shippingAndDelivery, #promotionalTerms) { #less };
            case (#shippingAndDelivery, #shippingAndDelivery) { #equal };
            case (#shippingAndDelivery, _) { #greater };
            case (#cookiePolicy, #disclaimerLiability) { #less };
            case (#cookiePolicy, #promotionalTerms) { #less };
            case (#cookiePolicy, #cookiePolicy) { #equal };
            case (#cookiePolicy, _) { #greater };
            case (#disclaimerLiability, #promotionalTerms) { #less };
            case (#disclaimerLiability, #disclaimerLiability) { #equal };
            case (#disclaimerLiability, _) { #greater };
            case (#promotionalTerms, #promotionalTerms) { #equal };
            case _ { #less };
        };
    };

    let policies = Map.empty<PolicyType, PolicyContent>();

    public type TextBlock = {
        title : Text;
        content : Text;
    };

    var homepageTextBlocks : {
        block1 : TextBlock;
        block2 : TextBlock;
        block3 : TextBlock;
    } = {
        block1 = {
            title = "";
            content = "This book is not a monument of perfection but a vessel of becoming. Every poem within it was written as part of my own pilgrimage through language—an act of learning, of reaching, of trying to find truth. English is both my craft and my classroom. I am still a student of its vastness—its shifting grammar, its hidden roots, its capacity to wound and to heal. Each line you will read is born from that ongoing study: a bridge between the words I already knew and those I met along the way.";
        };
        block2 = {
            title = "A Journey Through Language";
            content = "To write these poems was to wander through libraries of light and shadow. I found myself standing before the old echoes of both the Elizabethan and Old English (Anglo-Saxon) tongues—two streams of the same ancient river. Their words—thou, thy, ūre, nāwiht—felt carved in the bone of the language, carrying a gravity that bends even modern breath towards reverence. I let that weight draw through my voice until it forged its own fusion: a cadence where Germanic root meets Elizabethan grace. From there I turned to the clarity of modern lyric, sharp as breath of confession, and to the stillness of Japanese forms, where silence itself becomes a stanza, and absence a kind of ink.";
        };
        block3 = {
            title = "United by Trial";
            content = "What unites these voices is not their time or style, but their trial—the journey through the dark corridors of grief, rage, and memory towards the fragile light of love, redemption, and purpose. Some poems speak of the world's cruelty; others speak of tenderness as its quiet revolt. Together, they form an atlas of both the human wound and the will to heal it.";
        };
    };

    var currentReviewNumber : Nat = 0;

    // ─── Bilingual Emilie / Anna homepage text blocks ──────────────────────────
    // Replaces the old single-language `homepageTextBlocksEmilie` /
    // `homepageTextBlocksAnna` vars. The migration converts the old
    // single-language content into the `.en` side and leaves `.nl` empty.
    // Wrapped in a `{ var value = ... }` record so the mixin's mutations
    // propagate back to this shared binding (records are passed by reference).
    let homepageTextBlocksEmilieBilingual : { var value : ContentProductsReviewsTypes.BilingualHomepageTextBlocks } = {
        var value = ContentProductsReviewsLib.emptyBilingualBlocks();
    };
    let homepageTextBlocksAnnaBilingual : { var value : ContentProductsReviewsTypes.BilingualHomepageTextBlocks } = {
        var value = ContentProductsReviewsLib.emptyBilingualBlocks();
    };

    let accessControlState : AccessControl.AccessControlState = AccessControl.initState();

    // Guard: only allow initialization if no admin has been assigned yet.
    // This prevents a frontend call on every session/deploy from accidentally
    // assigning the caller as #user (when adminAssigned=true but caller has no role).
    public shared ({ caller }) func initializeAccessControl() : async () {
        if (not accessControlState.adminAssigned) {
            AccessControl.initialize(accessControlState, caller);
        };
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public type UserProfile = {
        name                   : Text;
        favouriteReflections   : [Text];
        favouriteAuthorNotes   : [Text];
        favouriteGames         : [Text];
        favouriteVocabulary    : [Text];
        favouriteShortMessages : [Text];
    };

    let userProfiles = Map.empty<Principal, UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (caller.isAnonymous()) { return null };
        userProfiles.get(caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller.isAnonymous()) { return null };
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            return null;
        };
        userProfiles.get(user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only users can save profiles");
        };
        userProfiles.add(caller, profile);
    };

    public type DictionaryEntry = {
        word : Text;
        meaning : Text;
        etymology : Text;
        examples : Text;
    };

    let dictionaryEntries = Map.empty<Text, DictionaryEntry>();

    public shared ({ caller }) func addDictionaryEntry(entry : DictionaryEntry) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add dictionary entries");
        };
        dictionaryEntries.add(entry.word, entry);
    };

    public shared ({ caller }) func updateDictionaryEntry(entry : DictionaryEntry) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update dictionary entries");
        };
        dictionaryEntries.add(entry.word, entry);
    };

    public shared ({ caller }) func deleteDictionaryEntry(word : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete dictionary entries");
        };
        dictionaryEntries.remove(word);
    };

    public query func listDictionaryEntries() : async [DictionaryEntry] {
        dictionaryEntries.values().toArray();
    };

    public query func getDictionaryEntry(word : Text) : async ?DictionaryEntry {
        dictionaryEntries.get(word);
    };

    public type Product = ContentProductsReviewsTypes.Product;

    // ─── 6-slot product store ─────────────────────────────────────────────────
    // Replaces the old `firstProduct` / `secondProduct` ?Product pair. The
    // migration seeds the 6 slots from the legacy vars (firstProduct ->
    // "the-gospel-of-poetic-frolic", secondProduct -> "amazon-tgopf-editions")
    // and fills the remaining 4 with defaults. On fresh install
    // `newProductStore()` pre-seeds all 6 with sensible defaults so the
    // admin sees all 6 cards immediately.
    let products : ContentProductsReviewsLib.ProductStore = ContentProductsReviewsLib.newProductStore();

    // ─── HTTP transform function (must be declared before any include that needs it) ───
    public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
        OutCall.transform(input);
    };

    // ─── Amazon Regions state (five independent per-book Maps) ─────────────
    // Each Map is a separate binding — enhanced orthogonal persistence keeps
    // all of them alive across upgrades without stable keyword.
    let amazonRegionsTopf      = Map.empty<Text, AmazonRegionTypes.AmazonRegion>();
    let amazonRegionsEmilie    = Map.empty<Text, AmazonRegionTypes.AmazonRegion>();
    let amazonRegionsAnna      = Map.empty<Text, AmazonRegionTypes.AmazonRegion>();
    let amazonRegionsAnnaSong  = Map.empty<Text, AmazonRegionTypes.AmazonRegion>();
    let amazonRegionsEmilieNl  = Map.empty<Text, AmazonRegionTypes.AmazonRegion>();
    // Seed all five on first launch only (empty-map guard inside seedAllBooks).
    AmazonRegionsMultiLib.seedAllBooks(AmazonRegionLib.seedDefaults, amazonRegionsTopf, amazonRegionsEmilie, amazonRegionsAnna, amazonRegionsAnnaSong, amazonRegionsEmilieNl);
    // Backward-compat alias: existing API mixin continues to operate on topf map.
    let amazonRegions = amazonRegionsTopf;
    include AmazonRegionsAPI(accessControlState, amazonRegions);
    // New per-book API.
    include AmazonRegionsMultiAPI(accessControlState, amazonRegionsTopf, amazonRegionsEmilie, amazonRegionsAnna, amazonRegionsAnnaSong, amazonRegionsEmilieNl);



    // ─── Payment Countries & Options state ────────────────────────────────────
    let paymentCountries = Map.empty<Text, PaymentCountryTypes.PaymentCountry>();
    let paymentOptions   = Map.empty<Text, PaymentCountryTypes.PaymentOption>();
    let sharedPaymentLogos = Map.empty<Text, PaymentCountryTypes.SharedPaymentLogo>();
    PaymentCountriesLib.seedDefaults(paymentCountries, paymentOptions);
    // Ensure ETH, ICP, and Creditcard are also seeded for all countries (idempotent).
    PaymentCountriesLib.ensureEthereumForAllCountries(paymentCountries, paymentOptions);
    PaymentCountriesLib.ensureIcpForAllCountries(paymentCountries, paymentOptions);
    PaymentCountriesLib.ensureCreditcardForAllCountries(paymentCountries, paymentOptions);
    PaymentCountriesLib.seedSharedLogos(sharedPaymentLogos);
    // Crypto rate caches: rate=0.0 means "never fetched".
   let btcRateCache = { var rate : Float = 0.0; var fetchedAt : Int = 0 };
   let btcConfig = { var walletAddress : Text = "bc1qksdafkkasm96075gp7yys78h7eq97selp97lh0"; var contactEmail : Text = "tgopf@pm.me" };
   let ethRateCache = { var rate : Float = 0.0; var fetchedAt : Int = 0 };
   let ethConfig = { var walletAddress : Text = "0x29420495cF2FFBa1EeD56319F5c6EDf620C44858" };
   let icpRateCache = { var rate : Float = 0.0; var fetchedAt : Int = 0 };
   let icpConfig = { var walletAddress : Text = "20519ec2411bdf08e185b57d4ac10a717b30add1f7165e258198f21855e21b27" };
   // Unified crypto rate cache — a single backend-cached record shared across all 3 coins.
   // fetchedAt = 0 means "never fetched"; rate fields are 0.0 until first fetch.
   let _unifiedCryptoCache = { var btcRate : Float = 0.0; var ethRate : Float = 0.0; var icpRate : Float = 0.0; var fetchedAt : Int = 0 };
   include PaymentOptionsAPI(accessControlState, paymentCountries, paymentOptions, sharedPaymentLogos, btcRateCache, transform, btcConfig, ethRateCache, ethConfig, icpRateCache, icpConfig, _unifiedCryptoCache, cryptoSystemState);

    // ─── Short Messages state ─────────────────────────────────────────────────
    let shortMessages = Map.empty<Text, ShortMessagesTypes.ShortMessage>();
    include ShortMessagesAPI(accessControlState, shortMessages);

    // ─── Games state ─────────────────────────────────────────────────────────
    let games = Map.empty<Text, GamesTypes.Game>();
    let gameReactions = Map.empty<Text, Map.Map<Text, GamesTypes.GameReaction>>();
    let gameComments = Map.empty<Text, GamesTypes.GameComment>();
    include GamesAPI(accessControlState, games, gameReactions, gameComments);

    /// Return game reaction counts including automated inflation.
    public query func getGameReactionCountsInflated(gameId : Text) : async GamesTypes.GameReactionCounts {
        let userCounts = GamesLib.getReactionCounts(gameReactions, gameId);
        {
            love    = userCounts.love    + _autoCount("game:" # gameId # ":love");
            like    = userCounts.like    + _autoCount("game:" # gameId # ":like");
            dislike = userCounts.dislike + _autoCount("game:" # gameId # ":dislike");
            laugh   = userCounts.laugh   + _autoCount("game:" # gameId # ":laugh");
        };
    };

    /// React to a game and track user engagement for inflation weighting.
    public shared ({ caller }) func reactToGameAndTrack(gameId : Text, reaction : GamesTypes.GameReaction) : async Bool {
        if (caller.isAnonymous()) {
            Runtime.trap("Unauthorized: Must be logged in to react");
        };
        let result = GamesLib.reactToGame(games, gameReactions, gameId, caller.toText(), reaction);
        if (result) {
            let rxLabel = switch reaction { case (#love) "love"; case (#like) "like"; case (#dislike) "dislike"; case (#laugh) "laugh" };
            _incUserCount("game:" # gameId # ":" # rxLabel);
        };
        result;
    };

    // ─── Favourites ───────────────────────────────────────────────────────────
    // userProfiles is declared above and shared with FavouritesAPI
    include FavouritesAPI(accessControlState, userProfiles);

    let blobRegistry = Registry.new();
    include BlobStorage(blobRegistry);

    public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can register file references");
        };
        Registry.add(blobRegistry, path, hash);
    };

    public query func getFileReference(path : Text) : async ?Registry.FileReference {
        Registry.tryGet(blobRegistry, path);
    };

    public query func listFileReferences() : async [Registry.FileReference] {
        Registry.list(blobRegistry);
    };

    public query func getAllFileReferences() : async [Registry.FileReference] {
        Registry.list(blobRegistry);
    };

    public shared ({ caller }) func dropFileReference(path : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can drop file references");
        };
        Registry.remove(blobRegistry, path);
    };

    // Reports whether the backend's default image paths ("image.png" for the
    // Bitcoin QR code and "bol-1.jpg" for the bol banner) have a registered
    // file reference in the blob registry. Lets the frontend render a graceful
    // neutral placeholder instead of a perpetual loader when a default image
    // has not been uploaded by an admin. Purely additive — does not change any
    // existing getter return values or stored data.
    public query func getDefaultImageStatus() : async {
        qrCodePath : Text;
        qrCodeRegistered : Bool;
        bolBannerPath : Text;
        bolBannerRegistered : Bool;
    } {
        let qrCodePath = "image.png";
        let bolBannerPath = "bol-1.jpg";
        {
            qrCodePath;
            qrCodeRegistered = Registry.tryGet(blobRegistry, qrCodePath) != null;
            bolBannerPath;
            bolBannerRegistered = Registry.tryGet(blobRegistry, bolBannerPath) != null;
        };
    };

    public shared ({ caller }) func updatePolicyContent(policyType : PolicyType, content : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update policy content");
        };

        let title = switch (policyType) {
            case (#intellectualProperty) "Intellectual Property Policy";
            case (#termsAndConditions) "Terms & Conditions";
            case (#privacyPolicy) "Privacy Policy";
            case (#refundAndReturn) "Refund & Return Policy";
            case (#shippingAndDelivery) "Shipping & Delivery Policy";
            case (#cookiePolicy) "Cookie Policy";
            case (#disclaimerLiability) "Disclaimer Liability";
            case (#promotionalTerms) "Promotional Terms and Conditions";
        };

        let policyContent : PolicyContent = {
            policyType;
            title;
            content;
        };

        policies.add(comparePolicyType, policyType, policyContent);
    };

    public query func getPolicyContent(policyType : PolicyType) : async PolicyContent {
        switch (policies.get(comparePolicyType, policyType)) {
            case (?policy) policy;
            case null {
                let defaultContent = "0101010001001";
                let title = switch (policyType) {
                    case (#intellectualProperty) "Intellectual Property Policy";
                    case (#termsAndConditions) "Terms & Conditions";
                    case (#privacyPolicy) "Privacy Policy";
                    case (#refundAndReturn) "Refund & Return Policy";
                    case (#shippingAndDelivery) "Shipping & Delivery Policy";
                    case (#cookiePolicy) "Cookie Policy";
                    case (#disclaimerLiability) "Disclaimer Liability";
                    case (#promotionalTerms) "Promotional Terms and Conditions";
                };
                {
                    policyType;
                    title;
                    content = defaultContent;
                };
            };
        };
    };
    public query func getHomepageTextBlocks() : async {
        block1 : TextBlock;
        block2 : TextBlock;
        block3 : TextBlock;
    } {
        homepageTextBlocks;
    };

    public shared ({ caller }) func updateHomepageTextBlocks(blocks : {
        block1 : TextBlock;
        block2 : TextBlock;
        block3 : TextBlock;
    }) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update homepage text blocks");
        };
        homepageTextBlocks := blocks;
    };

    // ── Review storage (declared before the content-products-reviews mixin
    // include below, which receives `reviews` as a parameter) ──────────────────
    let reviews = Map.empty<Text, Review>();

    // ── Review Emoji V2 storage (clean, isolated namespace "review_v2:") ──────
    // outer key = reviewId, inner key = principal as Text, value = reaction label
    let reviewEmojiV2UserVotes = Map.empty<Text, Map.Map<Text, Text>>();
    // key = reviewId, value = aggregate counts
    let reviewEmojiV2Counts = Map.empty<Text, { love : Nat; like : Nat; dislike : Nat; laugh : Nat }>();

    // ─── content-products-reviews mixin ───────────────────────────────────────
    // Wires the bilingual Emilie/Anna text blocks, the 6-slot product store,
    // and the per-title review filter helpers. The mixin exposes:
    //   - getHomepageTextBlocksEmilieEn/Nl + update* (admin)
    //   - getHomepageTextBlocksAnnaEn/Nl   + update* (admin)
    //   - getProducts (6 in order), getProductByKey, updateProductByKey (admin)
    //   - getReviews (unchanged), getReviewsByBookTitle, getReviewBookTitles
    // The existing TGOPF getHomepageTextBlocks/updateHomepageTextBlocks above
    // and the existing addReview/updateReview/deleteReview/getReviews below
    // are intentionally kept — the mixin ADDS the per-title helpers alongside.
    include ContentProductsReviewsAPI(
        accessControlState,
        homepageTextBlocksEmilieBilingual,
        homepageTextBlocksAnnaBilingual,
        products,
        reviews,
    );


    public query func getFirstProductPrice() : async Text {
        "€39,39";
    };

    public query func getSecondProductPrice() : async Text {
        "€23,39";
    };

    public query func getShippingNote() : async Text {
        "excl. shipping costs.";
    };

    public query func getInternationalCustomerCheckoutUrl() : async Text {
        "https://www.paypal.com/ncp/payment/K9YW45XWPWQVY";
    };

    public query func getSecondProductPayPalUrl() : async Text {
        "https://www.paypal.com/ncp/payment/43C8AG3RCYEUC";
    };

    public query func getViaMarktplaatsButtonUrl() : async Text {
        "https://www.marktplaats.nl/v/boeken/gedichten-en-poezie/m2344244588-engelstalig-boek-the-gospel-of-poetic-frolic";
    };

    public query func getViaVintedButtonUrl() : async Text {
        "https://www.vinted.nl/session-refresh?ref_url=%2Fitems%2F7695780909-book-the-gospel-of-poetic-frolic";
    };

    public query func getRevolutPayButtonUrl() : async Text {
        "https://revolut.me/meliciosergio";
    };

    public query func getRevolutPayButtonTextFirstProduct() : async Text {
        "Transfer €55,39 & include e-mail or phone number to contact you for your shipping details.";
    };

    public query func getRevolutPayButtonTextSecondProduct() : async Text {
        "Include e‑mail in the payment note so I can thank you.";
    };

    public query func getBoldedDeliveryInfoText() : async Text {
        "If available in your country, take advantage of the reduced-rate, and in some cases free, delivery options offered through Marktplaats or Vinted!";
    };

    public query func getDisclaimerText() : async Text {
        "By making a purchase, you indicate to have read and agree with the corresponding Disclaimer, Terms & Conditions, and policies: Intellectual Property Policy, Terms & Conditions, Privacy Policy, Refund & Return Policy, Shipping & Delivery Policy, Cookie Policy, Disclaimer Liability.";
    };

    public query func getBitcoinPaymentDetails() : async {
        btcAddress : Text;
        btcEurAmount : Text;
        qrCodeImagePath : Text;
    } {
        {
            btcAddress = "bc1qksdafkkasm96075gp7yys78h7eq97selp97lh0";
            btcEurAmount = "€55,39";
            qrCodeImagePath = "image.png";
        };
    };

    public query func getBitcoinPaymentAmount() : async {
        amount : Text;
        currency : Text;
    } {
        {
            amount = "55,39";
            currency = "EUR";
        };
    };

    public query func getBtcAddress() : async Text {
        btcConfig.walletAddress;
    };

    public query func getQrCodeImagePath() : async Text {
        "image.png";
    };

    public query func getBitcoinInstructionText() : async Text {
        "Transfer the following amount of BTC to the address below. Upon successful transfer e-mail tgopf@pm.me with your BTC address, shipping address (street, postal code, country), name, e-mail, and phone number.";
    };

    public query func getBitcoinPaymentModalState() : async {
        isOpen : Bool;
        lastUpdateTimestamp : Int;
    } {
        {
            isOpen = false;
            lastUpdateTimestamp = 0;
        };
    };

    public query func getPromotionalTermsContent() : async Text {
        switch (policies.get(comparePolicyType, #promotionalTerms)) {
            case (?policy) policy.content;
            case null {
                "<section class=\"policy-content\">\n" #
                "  <h2>Algemene Spelvoorwaarden (General terms)</h2>\n" #
                "\n" #
                "  <h3>NL</h3>\n" #
                "\n" #
                "  <strong>1.</strong> Promotionele deelname geeft geen recht op gegarandeerd resultaat of beloning.<br><br>\n" #
                "  <strong>2.</strong> Deelname aan promotionele acties is alleen geldig binnen de omschreven periode en onder de aangegeven voorwaarden.<br><br>\n" #
                "  <strong>3.</strong> Geplaatste reviews geven geen automatische recht op punten of kortingen. De publicatie wordt beoordeeld op eerlijkheid en originaliteit.<br><br>\n" #
                "  <strong>4.</strong> Reviews met identiek gekopieerde tekst worden niet meegenomen in het aanbod en tellen niet mee voor promotionele doelen.<br><br>\n" #
                "  <strong>5.</strong> Deelname aan de promotie is alleen geldig binnen Nederland, tenzij anders vermeld in de specifieke actievoorwaarden.<br><br>\n" #
                "  <strong>6.</strong> Kortingen en promoties kunnen niet worden gecombineerd met andere aanbiedingen of reeds gemaakte aankopen.<br><br>\n" #
                "  <strong>7.</strong> Recht op promotionele beloningen vervalt bij misbruik, fraude of onjuiste voorstelling van zaken.<br><br>\n" #
                "  <strong>8.</strong> Geplaatste reviews blijven eigendom van de originele auteur, maar kunnen door ons worden gebruikt voor promotionele doeleinden.<br><br>\n" #
                "  <strong>9.</strong> Promotionele acties kunnen op elk moment worden beëindigd of aangepast zonder voorafgaande kennisgeving. Rechten kunnen hieraan niet worden ontleend.<br><br>\n" #
                "  <strong>10.</strong> De winnaar van een promotie of actie wordt rechtstreeks benaderd. Indien geen reactie wordt ontvangen binnen 7 dagen na bekendmaking, vervalt het recht op de prijs en wordt een nieuwe winnaar geselecteerd.<br><br>\n" #
                "  <strong>11.</strong> De prijs wordt binnen 4 weken na bevestiging van de winnaar verzonden of verstrekt.<br><br>\n" #
                "  <strong>12.</strong> Deelnemers kunnen slechts eenmaal meedoen aan dezelfde promotionele actie, tenzij anders vermeld.<br><br>\n" #
                "  <strong>13.</strong> Proefexemplaren en kortingsvouchers zijn niet overdraagbaar en niet inwisselbaar tegen geld. Ze zijn alleen geldig tot de aangegeven uiterste datum.<br><br>\n" #
                "  <strong>14.</strong> Reviews moeten authentiek, zelf geschreven en gebaseerd op werkelijke ervaring zijn. Namaakreviews of inhoud die in strijd is met de richtlijnen worden verwijderd.<br><br>\n" #
                "  <strong>15.</strong> Gebruikte foto's bij reviews moeten ter verificatie worden gebruikt en kunnen openbaar worden geplaatst ten behoeve van de promotie.<br><br>\n" #
                "  <strong>16.</strong> Deelnemers gaan akkoord met de algemene voorwaarden, het privacybeleid en het cookiebeleid van de actie-organisator.<br><br>\n" #
                "  <strong>17.</strong> Geplaatste reviews worden enkel beoordeeld op originaliteit, eerlijkheid en relevantie. Kwaliteit en lengte van de review kunnen invloed hebben op promotionele aanbiedingen.<br><br>\n" #
                "  <strong>18.</strong> Bij deelname aan de promotie stemt de deelnemer in met het ontvangen van promotionele e-mails en updates. Afmelden is mogelijk via het opgegeven e-mailadres.<br><br>\n" #
                "  <strong>19.</strong> Bij overschrijding van de promotionele voorraad wordt een vergelijkbaar alternatief geboden of volgt restitutie van het aankoopbedrag.<br><br>\n" #
                "  <strong>20.</strong> Alle klachten of vragen met betrekking tot promotionele acties kunnen worden ingediend via het contactformulier of het opgegeven e-mailadres.<br><br>\n" #
                "  <strong>21.</strong> In gevallen waarin deze voorwaarden niet voorzien, beslist de organisator.<br><br>\n" #
                "\n\n" #
                "  <h3>EN</h3>\n" #
                "\n" #
                "  <strong>1.</strong> Promotional participation does not guarantee a result or reward.<br><br>\n" #
                "  <strong>2.</strong> Participation in promotions is only valid within the specified period and under the stated conditions.<br><br>\n" #
                "  <strong>3.</strong> Submitted reviews do not automatically grant points or discounts. The publication will be assessed for honesty and originality.<br><br>\n" #
                "  <strong>4.</strong> Reviews with identical copied text will not be included in the offer and do not count towards promotional goals.<br><br>\n" #
                "  <strong>5.</strong> Participation in the promotion is only valid within the Netherlands unless otherwise stated in the specific terms and conditions of the action.<br><br>\n" #
                "  <strong>6.</strong> Discounts and promotions cannot be combined with other offers or previously made purchases.<br><br>\n" #
                "  <strong>7.</strong> Eligibility for promotional rewards expires in the event of abuse, fraud or misrepresentation.<br><br>\n" #
                "  <strong>8.</strong> Posted reviews remain the property of the original author, but may be used by us for promotional purposes.<br><br>\n" #
                "  <strong>9.</strong> Promotional offers may be terminated or changed at any time without prior notice. No rights can be derived from this.<br><br>\n" #
                "  <strong>10.</strong> The winner of a promotion or contest will be contacted directly. If the winner does not respond within 7 days of notification, the right to the prize will expire and a new winner will be selected.<br><br>\n" #
                "  <strong>11.</strong> The prize will be sent or provided within 4 weeks of confirmation of the winner.<br><br>\n" #
                "  <strong>12.</strong> Participants may only participate once in the same promotional action, unless otherwise stated.<br><br>\n" #
                "  <strong>13.</strong> Sample copies and discount vouchers are not transferable and cannot be exchanged for cash. They are only valid until the indicated expiry date.<br><br>\n" #
                "  <strong>14.</strong> Reviews must be authentic, self-written and based on actual experience. Fake reviews or content that violates guidelines will be removed.<br><br>\n" #
                "  <strong>15.</strong> Used photos for reviews must be used for verification and may be made public for promotional purposes.<br><br>\n" #
                "  <strong>16.</strong> Participants agree to the general terms and conditions, privacy policy and cookie policy of the organizer.<br><br>\n" #
                "  <strong>17.</strong> Posted reviews will only be assessed for originality, honesty and relevance. The quality and length of the review may influence promotional offers.<br><br>\n" #
                "  <strong>18.</strong> By participating in the promotion, the participant agrees to receive promotional emails and updates. Opt-out is possible via the provided email address.<br><br>\n" #
                "  <strong>19.</strong> In the event of a promotional stock being oversubscribed, a similar alternative will be offered or a refund will be provided.<br><br>\n" #
                "  <strong>20.</strong> Any complaints or questions relating to promotional offers may be submitted via the contact form or the provided email address.<br><br>\n" #
                "  <strong>21.</strong> In cases not covered by these terms and conditions, the organizer decides.<br><br>\n" #
                "\n\n" #
                "  <h2>FAQ</h2>\n" #
                "  <h3>NL</h3>\n" #
                "  <strong>Worden gepubliceerde reviews altijd beloond?</strong><br>\n" #
                "  Nee, alleen reviews die relevant zijn voor de promotie kunnen recht geven op een promotionele aanbieding. Niet elke publicatie wordt beloond. Reviews die voldoen aan de richtlijnen, authentiek zijn en voldoen aan de promotionele voorwaarden, maken kans op een beloning of korting.<br><br>\n" #
                "  <strong>Kan ik een review koppelen aan een kortingsactie?</strong><br>\n" #
                "  Ja, je kunt bij het plaatsen van een review aangeven dat je wilt deelnemen aan een beschikbare promotie of korting. Vermeld dit duidelijk in je review of neem na publicatie contact op via het opgegeven e-mailadres om je deelname te bevestigen.<br><br>\n" #
                "  <strong>Wanneer ontvang ik punten of kortingen voor mijn review?</strong><br>\n" #
                "  Zodra je review is goedgekeurd en gekoppeld aan een promotie, ontvang je binnen 2 weken na bekendmaking bericht. Eventuele kortingen of punten worden direct verrekend.<br><br>\n" #
                "  <h3>EN</h3>\n" #
                "  <strong>Are published reviews always rewarded?</strong><br>\n" #
                "  No, only reviews that are relevant to the promotion may qualify for a promotional offer. Not every post is rewarded. Reviews that meet the guidelines, are authentic, and meet the promotional conditions have a chance of being rewarded or discounted.<br><br>\n" #
                "  <strong>Can I link a review to a discount offer?</strong><br>\n" #
                "  Yes, when submitting a review you can indicate that you wish to participate in a promotion or discount offer. Please state this clearly in your review or contact us at the provided email address after publication to confirm your participation.<br><br>\n" #
                "  <strong>When will I receive points or discounts for my review?</strong><br>\n" #
                "  Once your review has been approved and linked to a promotion, you will be notified within 2 weeks of confirmation. Any discounts or points are applied immediately.<br><br>\n" #
                "</section>\n";
            };
        };
    };

    public shared ({ caller }) func updatePromotionalTermsContent(content : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update promotional terms content");
        };

        let promotionalTermsContent : PolicyContent = {
            policyType = #promotionalTerms;
            title = "Promotional Terms and Conditions";
            content;
        };

        policies.add(comparePolicyType, #promotionalTerms, promotionalTermsContent);
    };

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
        // Optional admin star rating (1-5). null means no rating. Backward
        // compatible — existing stored reviews without this field deserialize
        // as null.
        starRating : ?Nat;
        // Kept for stable state compatibility — no longer used for display.
        // New emoji system uses reviewEmojiV2Counts instead.
        reactions : ?{
            love : Nat;
            like : Nat;
            dislike : Nat;
            laugh : Nat;
        };
    };

    // Helper: recalculate aggregate counts from the per-user vote map for one review
    func _recalcReviewV2Counts(reviewId : Text) {
        let voteMap = switch (reviewEmojiV2UserVotes.get(reviewId)) { case (?m) m; case null Map.empty<Text, Text>() };
        var love : Nat = 0; var like : Nat = 0; var dislike : Nat = 0; var laugh : Nat = 0;
        for ((_, rx) in voteMap.entries()) {
            switch rx {
                case "love"    { love    += 1 };
                case "like"    { like    += 1 };
                case "dislike" { dislike += 1 };
                case "laugh"   { laugh   += 1 };
                case _         {};
            };
        };
        reviewEmojiV2Counts.add(reviewId, { love; like; dislike; laugh });
    };

    public shared ({ caller }) func reactToReviewV2(reviewId : Text, reaction : Text) : async () {
        if (caller.isAnonymous()) { Runtime.trap("Not authenticated") };
        // Validate reaction label
        let validReactions = ["love", "like", "dislike", "laugh"];
        var valid = false;
        for (r in validReactions.values()) { if (r == reaction) { valid := true } };
        if (not valid) { Runtime.trap("Invalid reaction type") };

        let callerText = caller.toText();
        let voteMap : Map.Map<Text, Text> = switch (reviewEmojiV2UserVotes.get(reviewId)) {
            case null {
                let m = Map.empty<Text, Text>();
                reviewEmojiV2UserVotes.add(reviewId, m);
                m;
            };
            case (?m) { m };
        };

        switch (voteMap.get(callerText)) {
            case (?prev) {
                if (prev == reaction) {
                    // Toggle off — same reaction clicked again
                    voteMap.remove(callerText);
                } else {
                    // Change reaction
                    voteMap.add(callerText, reaction);
                    _incUserCount("review_v2:" # reviewId # ":" # reaction);
                };
            };
            case null {
                voteMap.add(callerText, reaction);
                _incUserCount("review_v2:" # reviewId # ":" # reaction);
            };
        };
        _recalcReviewV2Counts(reviewId);
    };

    public query func getReviewEmojiCountsV2(reviewId : Text) : async { love : Nat; like : Nat; dislike : Nat; laugh : Nat } {
        let base = switch (reviewEmojiV2Counts.get(reviewId)) {
            case (?c) c;
            case null ({ love = 0; like = 0; dislike = 0; laugh = 0 });
        };
        _reviewV2DisplayReactions(reviewId, base);
    };

    public query ({ caller }) func getUserReviewReactionV2(reviewId : Text) : async ?Text {
        if (caller.isAnonymous()) { return null };
        let voteMap = switch (reviewEmojiV2UserVotes.get(reviewId)) { case (?m) m; case null return null };
        voteMap.get(caller.toText());
    };

    // Keep old reviewReactions map declared so schema continuity is preserved (M0169)
    let reviewReactions = Map.empty<Text, Map.Map<Text, ReviewReaction>>();

    public shared ({ caller }) func addReview(review : Review) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add reviews");
        };
        switch (review.starRating) {
            case (?n) {
                if (n < 1 or n > 5) {
                    Runtime.trap("Invalid starRating: must be between 1 and 5 (or null)");
                };
            };
            case null {};
        };
        reviews.add(review.id, review);
    };

    public shared ({ caller }) func updateReview(review : Review) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update reviews");
        };
        switch (review.starRating) {
            case (?n) {
                if (n < 1 or n > 5) {
                    Runtime.trap("Invalid starRating: must be between 1 and 5 (or null)");
                };
            };
            case null {};
        };
        reviews.add(review.id, review);
    };

    public shared ({ caller }) func deleteReview(reviewId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete reviews");
        };
        reviews.remove(reviewId);
        reviewReactions.remove(reviewId);
        reviewEmojiV2UserVotes.remove(reviewId);
        reviewEmojiV2Counts.remove(reviewId);
    };

    public query func getReviews() : async [Review] {
        reviews.values().toArray();
    };

    public query func getReview(reviewId : Text) : async ?Review {
        reviews.get(reviewId);
    };

    public query func getDefaultReviews() : async [Review] {
        let defaultReviews : [Review] = [
            {
                id = "1";
                reviewerName = "Anonymous";
                companyBlogSite = null;
                bookTitle = "Default Book Title";
                poemTitle = "Default Poem Title";
                poemSubTitle = "Default Subtitle";
                pageNumbers = "1-10";
                photoPath = null;
                snippet = "This is a placeholder review. The full review will be available soon.";
                fullText = "This is a placeholder review. The full review will be available soon.";
                sourceLink = null;
                videoUrl = null;
                starRating = null;
                reactions = null;
            },
            {
                id = "2";
                reviewerName = "Anonymous";
                companyBlogSite = null;
                bookTitle = "Default Book Title";
                poemTitle = "Default Poem Title";
                poemSubTitle = "Default Subtitle";
                pageNumbers = "1-10";
                photoPath = null;
                snippet = "This is a placeholder review. The full review will be available soon.";
                fullText = "This is a placeholder review. The full review will be available soon.";
                sourceLink = null;
                videoUrl = null;
                starRating = null;
                reactions = null;
            },
        ];
        defaultReviews;
    };

    public type ReviewMilestone = {
        milestone : Nat;
        prizeImagePath : ?Text;
    };

    let reviewMilestones = Map.empty<Nat, ReviewMilestone>();

    public shared ({ caller }) func addReviewMilestone(milestone : ReviewMilestone) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add review milestones");
        };
        reviewMilestones.add(milestone.milestone, milestone);
    };

    public shared ({ caller }) func updateReviewMilestone(milestone : ReviewMilestone) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update review milestones");
        };
        reviewMilestones.add(milestone.milestone, milestone);
    };

    public shared ({ caller }) func deleteReviewMilestone(milestone : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete review milestones");
        };
        reviewMilestones.remove(milestone);
    };

    public query func getReviewMilestones() : async [ReviewMilestone] {
        reviewMilestones.values().toArray();
    };

    public query func getRoadmapSectionData() : async {
        title : Text;
        description : Text;
        currentReviews : Nat;
        progressPercentage : Nat;
    } {
        {
            title = "Roadmap to 250 Reviews";
            description = "To participate in this promotion, read the following instructions and promotional terms and conditions, by making a submission you agree to have read these promotional terms and conditions.";
            currentReviews = currentReviewNumber;
            progressPercentage = if (currentReviewNumber >= 250) {
                100;
            } else {
                currentReviewNumber * 100 / 250;
            };
        };
    };

    public shared ({ caller }) func updateCurrentReviewNumber(reviewNumber : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update current review number");
        };
        currentReviewNumber := reviewNumber;
    };

    public query func getCurrentReviewNumber() : async Nat {
        currentReviewNumber;
    };

    public type LeaderboardEntry = {
        id : Text;
        name : Text;
        photoPath : ?Text;
        score : Nat;
    };

    public type Reward = {
        id : Text;
        rewardType : {
            #points;
            #referral;
            #other;
        };
        amount : Nat;
        description : Text;
        pageType : {
            #retail;
            #social;
        };
        photoPath : ?Text;
    };

    /// Extended reward type returned by public queries — includes the two new
    /// optional fields stored in parallel maps for backward compatibility.
    public type RewardFull = {
        id : Text;
        rewardType : {
            #points;
            #referral;
            #other;
        };
        amount : Nat;
        description : Text;
        pageType : {
            #retail;
            #social;
        };
        photoPath : ?Text;
        availableCount : ?Nat;
        claimEmail : ?Text;
    };

    /// Input type accepted by addReward / updateReward — includes the two new
    /// optional fields so the frontend can set them without breaking old callers.
    public type RewardInput = {
        id : Text;
        rewardType : {
            #points;
            #referral;
            #other;
        };
        amount : Nat;
        description : Text;
        pageType : {
            #retail;
            #social;
        };
        photoPath : ?Text;
        availableCount : ?Nat;
        claimEmail : ?Text;
    };

    let retailLeaderboard = Map.empty<Text, LeaderboardEntry>();
    let socialLeaderboard = Map.empty<Text, LeaderboardEntry>();
    let rewards = Map.empty<Text, Reward>();
    // Parallel maps for the two new reward fields — keyed by reward id.
    // Using separate maps preserves backward compatibility with stored Reward records.
    let rewardAvailableCount = Map.empty<Text, Nat>();
    let rewardClaimEmail     = Map.empty<Text, Text>();

    public shared ({ caller }) func addRetailLeaderboardEntry(entry : LeaderboardEntry) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add retail leaderboard entries");
        };
        retailLeaderboard.add(entry.id, entry);
    };

    public shared ({ caller }) func updateRetailLeaderboardEntry(entry : LeaderboardEntry) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update retail leaderboard entries");
        };
        retailLeaderboard.add(entry.id, entry);
    };

    public shared ({ caller }) func deleteRetailLeaderboardEntry(entryId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete retail leaderboard entries");
        };
        retailLeaderboard.remove(entryId);
    };

    public shared ({ caller }) func addSocialLeaderboardEntry(entry : LeaderboardEntry) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add social leaderboard entries");
        };
        socialLeaderboard.add(entry.id, entry);
    };

    public shared ({ caller }) func updateSocialLeaderboardEntry(entry : LeaderboardEntry) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update social leaderboard entries");
        };
        socialLeaderboard.add(entry.id, entry);
    };

    public shared ({ caller }) func deleteSocialLeaderboardEntry(entryId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete social leaderboard entries");
        };
        socialLeaderboard.remove(entryId);
    };

    public query func getRetailLeaderboard() : async [LeaderboardEntry] {
        retailLeaderboard.values().toArray();
    };

    public query func getSocialLeaderboard() : async [LeaderboardEntry] {
        socialLeaderboard.values().toArray();
    };

    public shared ({ caller }) func addReward(reward : RewardInput) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add rewards");
        };
        let stored : Reward = {
            id          = reward.id;
            rewardType  = reward.rewardType;
            amount      = reward.amount;
            description = reward.description;
            pageType    = reward.pageType;
            photoPath   = reward.photoPath;
        };
        rewards.add(reward.id, stored);
        switch (reward.availableCount) {
            case (?n) { rewardAvailableCount.add(reward.id, n) };
            case null { rewardAvailableCount.remove(reward.id) };
        };
        switch (reward.claimEmail) {
            case (?e) { rewardClaimEmail.add(reward.id, e) };
            case null { rewardClaimEmail.remove(reward.id) };
        };
    };

    public shared ({ caller }) func updateReward(reward : RewardInput) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update rewards");
        };
        let stored : Reward = {
            id          = reward.id;
            rewardType  = reward.rewardType;
            amount      = reward.amount;
            description = reward.description;
            pageType    = reward.pageType;
            photoPath   = reward.photoPath;
        };
        rewards.add(reward.id, stored);
        switch (reward.availableCount) {
            case (?n) { rewardAvailableCount.add(reward.id, n) };
            case null { rewardAvailableCount.remove(reward.id) };
        };
        switch (reward.claimEmail) {
            case (?e) { rewardClaimEmail.add(reward.id, e) };
            case null { rewardClaimEmail.remove(reward.id) };
        };
    };

    public shared ({ caller }) func deleteReward(rewardId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete rewards");
        };
        rewards.remove(rewardId);
        rewardAvailableCount.remove(rewardId);
        rewardClaimEmail.remove(rewardId);
    };

    /// Helper: enrich a stored Reward with the parallel-map extra fields.
    func _rewardToFull(r : Reward) : RewardFull {
        {
            id             = r.id;
            rewardType     = r.rewardType;
            amount         = r.amount;
            description    = r.description;
            pageType       = r.pageType;
            photoPath      = r.photoPath;
            availableCount = rewardAvailableCount.get(r.id);
            claimEmail     = rewardClaimEmail.get(r.id);
        };
    };

    public query func getRetailRewards() : async [RewardFull] {
        rewards.values().toArray()
            .filter(func(r : Reward) : Bool {
                switch (r.pageType) { case (#retail) true; case (#social) false };
            })
            .map(func(r) { _rewardToFull(r) });
    };

    public query func getSocialRewards() : async [RewardFull] {
        rewards.values().toArray()
            .filter(func(r : Reward) : Bool {
                switch (r.pageType) { case (#retail) false; case (#social) true };
            })
            .map(func(r) { _rewardToFull(r) });
    };

    public type BookSale = {
        bookNumber : Nat;
        customerName : ?Text;
        salesAmount : Nat;
    };

    public type BookSalesRecord = {
        sales : [BookSale];
    };

    public type Quarter = {
        #q1;
        #q2;
        #q3;
        #q4;
    };

    public type TaxRecord = {
        year : Nat;
        quarter : Quarter;
        salesAmount : Nat;
        taxAmount : Nat;
    };

    public type QuarterKey = {
        year : Nat;
        quarter : Quarter;
    };

    func compareQuarterKey(a : QuarterKey, b : QuarterKey) : { #less; #equal; #greater } {
        if (a.year < b.year) { #less } else if (a.year > b.year) { #greater } else {
            switch (a.quarter, b.quarter) {
                case (#q1, #q1) #equal;
                case (#q1, _) #less;
                case (#q2, #q1) #greater;
                case (#q2, #q2) #equal;
                case (#q2, _) #less;
                case (#q3, #q4) { #less };
                case (#q3, #q3) { #equal };
                case (#q3, _) { #greater };
                case (#q4, #q4) #equal;
                case (#q4, _) #greater;
            };
        };
    };

    let bookSales = Map.empty<Nat, BookSale>();
    let taxRecords = Map.empty<QuarterKey, TaxRecord>();

    public shared ({ caller }) func addBookSale(sale : BookSale) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add book sales");
        };
        bookSales.add(sale.bookNumber, sale);
    };

    public shared ({ caller }) func updateBookSale(sale : BookSale) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update book sales");
        };
        bookSales.add(sale.bookNumber, sale);
    };

    public shared ({ caller }) func deleteBookSale(bookNumber : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete book sales");
        };
        bookSales.remove(bookNumber);
    };

    public query ({ caller }) func getBookSales() : async [BookSale] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return [];
        };
        bookSales.values().toArray();
    };

    public shared ({ caller }) func addTaxRecord(record : TaxRecord) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add tax records");
        };
        let key : QuarterKey = {
            year = record.year;
            quarter = record.quarter;
        };
        taxRecords.add(compareQuarterKey, key, record);
    };

    public shared ({ caller }) func updateTaxRecord(record : TaxRecord) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update tax records");
        };
        let key : QuarterKey = {
            year = record.year;
            quarter = record.quarter;
        };
        taxRecords.add(compareQuarterKey, key, record);
    };

    public shared ({ caller }) func deleteTaxRecord(year : Nat, quarter : Quarter) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete tax records");
        };
        let key : QuarterKey = {
            year;
            quarter;
        };
        taxRecords.remove(compareQuarterKey, key);
    };

    public query ({ caller }) func getTaxRecords() : async [TaxRecord] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return [];
        };
        taxRecords.values().toArray();
    };

    public query func calculateTax(numberOfBooksSold : Nat) : async Text {
        let pricePerBookFloat : Float = 3939.0;
        let taxRateFloat : Float = 9.0;

        let totalCentsFloat : Float = numberOfBooksSold.toFloat() * pricePerBookFloat * taxRateFloat / 100.0;

        let eurosPart = (totalCentsFloat / 100.0).toInt().toNat();
        let centsPart = totalCentsFloat.toInt().toNat() % 100;

        var centsStr = centsPart.toText();
        if (centsPart < 10) {
            centsStr := "0" # centsStr;
        };

        eurosPart.toText() # "." # centsStr;
    };



    public shared func getRandomGalleryLayout(numImages : Nat) : async {
        imageIndex : Nat;
        x : Nat;
        y : Nat;
        rotation : Nat;
    } {
        let seed : Blob = await Random.blob();

        func nextRandom(currentSeed : Blob) : Nat {
            let bytes = currentSeed.toArray();
            if (bytes.size() < 4) return 0;
            let b0 = bytes[0].toNat();
            let b1 = bytes[1].toNat();
            let b2 = bytes[2].toNat();
            let b3 = bytes[3].toNat();
            (b0 * 1_000_000 + b1 * 10_000 + b2 * 100 + b3) % 1000000;
        };

        let randomValue = nextRandom(seed);

        let imageIndex = randomValue % numImages;
        let x = (randomValue / 10) % 100;
        let y = (randomValue / 100) % 100;
        let rotation = (randomValue / 1000) % 360;

        {
            imageIndex;
            x;
            y;
            rotation;
        };
    };

    public shared func getRandomCharacters(numCharacters : Nat) : async [{ #character : Text; #position : Nat }] {
        let seed : Blob = await Random.blob();

        let characters = ["A", "B", "C", "1", "2", "3", "!", "?", "#", "@"];

        func generateRandomPosition(s : Blob, maxVal : Nat) : Nat {
            let bytes = s.toArray();
            if (bytes.size() < 2) return 0;
            let high = bytes[0].toNat();
            let low = bytes[1].toNat();
            (high * 256 + low) % maxVal;
        };

        var resultList : [{ #character : Text; #position : Nat }] = [];

        var i = 0;
        while (i < numCharacters) {
            let charIndex = generateRandomPosition(seed, characters.size());
            let posIndex = generateRandomPosition(seed, 100);

            let record = { character = characters[charIndex % characters.size()]; position = posIndex % 100 };

            resultList := resultList.concat([#character(record.character)]);

            i += 1;
        };

        resultList;
    };

    public query func getFooterCopyright() : async Text {
        "© 2025 — Built by Le Royalties Sergio Melicio with ♥";
    };

    // ─── Copyright Settings ──────────────────────────────────────────────────

    var copyrightLine : Text = "© 2025 - {year} The Gospel of Poetic Frolic / Le Royalties Sergio Melicio. All rights reserved.";
    var copyrightStartYear : Nat = 2025;
    var copyrightYearColor : Text = "#ec4899";
    var copyrightLegalText : Text = "All content contained within this publication, website, and associated web applications; including but not limited to text, imagery, design, layout, source code, and audiovisual material; is protected under the copyright laws of the Kingdom of the Netherlands (Auteurswet), applicable European Union directives, and international treaties including the Berne Convention and the WIPO Copyright Treaty.\n\nNo portion of this work may be reproduced, distributed, publicly communicated, adapted, or otherwise exploited in any form or by any means; whether electronic, mechanical, photographic, or digital; without the prior express written consent of the rights holder.\n\nThis work, in whole or in part, may not be used to train, develop, fine-tune, or otherwise inform any artificial intelligence system, machine learning model, large language model, generative algorithm, or data-mining technology; whether commercial or non-commercial in nature. Any such use constitutes an infringement of the rights holder's exclusive rights under applicable law, including Article 4 of Directive (EU) 2019/790 (DSM Directive), and is expressly opted out of pursuant to Article 4(3) thereof.\n\nUnauthorized use, duplication, distribution, scraping, indexing, or exhibition of any protected material may result in civil liability and criminal prosecution under Dutch and international law.";

    public query func getCopyrightSettings() : async {
        copyrightLine : Text;
        copyrightStartYear : Nat;
        copyrightYearColor : Text;
        copyrightLegalText : Text;
    } {
        {
            copyrightLine;
            copyrightStartYear;
            copyrightYearColor;
            copyrightLegalText;
        };
    };

    public shared ({ caller }) func updateCopyrightSettings(line : Text, startYear : Nat, yearColor : Text, legalText : Text) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized: Only admins can update copyright settings");
        };
        copyrightLine := line;
        copyrightStartYear := startYear;
        copyrightYearColor := yearColor;
        copyrightLegalText := legalText;
    };

    public query func getTiktokUrl() : async Text {
        "https://www.tiktok.com/@tgopf_book";
    };

    public query func getDiscordUrl() : async Text {
        "https://discord.gg/EDrKpmNPm";
    };

    public query func getTelegramUrl() : async Text {
        "https://t.me/tgopf_book";
    };

    public query func getMediumUrl() : async Text {
        "https://medium.com/@meliciosergiobel";
    };

    public type BolBanner = {
        imagePath : Text;
        link : Text;
    };

    public query func getBolBanner() : async BolBanner {
        {
            imagePath = "bol-1.jpg";
            link = "https://www.bol.com/nl/nl/p/the-gospel-of-poetic-frolic-softcover-boek-gesigneerd-engelstalig-gedichten/9300000258914105/";
        };
    };

    public type ArtProduct = {
        id : Text;
        imagePath : ?Text;
        purchaseLink : Text;
        title : Text;
    };

    let artProducts = Map.empty<Text, ArtProduct>();

    public shared ({ caller }) func addArtProduct(artProduct : ArtProduct) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add art products");
        };
        artProducts.add(artProduct.id, artProduct);
    };

    public shared ({ caller }) func updateArtProduct(artProduct : ArtProduct) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update art products");
        };
        artProducts.add(artProduct.id, artProduct);
    };

    public shared ({ caller }) func deleteArtProduct(artProductId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete art products");
        };
        artProducts.remove(artProductId);
    };

    public query func getArtProducts() : async [ArtProduct] {
        artProducts.values().toArray();
    };

    public query func getArtProduct(artProductId : Text) : async ?ArtProduct {
        artProducts.get(artProductId);
    };

    public query func getDefaultArtProducts() : async [ArtProduct] {
        let defaultPurchaseLink = "https://www.paypal.com";
        let defaultTitle = "Art Piece from The Gospel of Poetic Frolic";

        let defaultArtProducts : [ArtProduct] = [
            { id = "1"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
            { id = "2"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
            { id = "3"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
            { id = "4"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
            { id = "5"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
            { id = "6"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
            { id = "7"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
            { id = "8"; imagePath = null; purchaseLink = defaultPurchaseLink; title = defaultTitle },
        ];
        defaultArtProducts;
    };

    public query func getArtProductsSectionData() : async {
        description : Text;
    } {
        {
            description = "If The Gospel of Poetic Frolic expanded your sense of dimensions, you can support my work by collecting your favourite art piece from the book: an author-signed artwork measuring 19.2 cm × 19.2 cm (20 cm × 20 cm external dimensions), presented in a black wooden frame (4 mm width, 35 mm depth) ready to hang on your wall, for €333.\n\nIf you would rather own something made specifically for you, you can commission a custom artwork in my Sergio Melicio Cube Dimension style (as shown above). Email tgopf@pm.me with your initial idea, your motivation, and what inspired you, whether a poem, theme, scene, or personal story. Custom commissions are €950.";
        };
    };

    public shared func getRandomArtProductsLayout(numImages : Nat) : async {
        imageIndex : Nat;
        x : Nat;
        y : Nat;
        rotation : Nat;
    } {
        let seed : Blob = await Random.blob();

        func nextRandom(currentSeed : Blob) : Nat {
            let bytes = currentSeed.toArray();
            if (bytes.size() < 4) return 0;
            let b0 = bytes[0].toNat();
            let b1 = bytes[1].toNat();
            let b2 = bytes[2].toNat();
            let b3 = bytes[3].toNat();
            (b0 * 1_000_000 + b1 * 10_000 + b2 * 100 + b3) % 1000000;
        };

        let randomValue = nextRandom(seed);

        let imageIndex = randomValue % numImages;
        let x = (randomValue / 10) % 100;
        let y = (randomValue / 100) % 100;
        let rotation = (randomValue / 1000) % 360;

        {
            imageIndex;
            x;
            y;
            rotation;
        };
    };

    public shared func getWatermarkedCharacters(numCharacters : Nat) : async [Text] {
        let seed : Blob = await Random.blob();

        func getRandomCharacter(s : Blob) : Text {
            let bytes = s.toArray();
            if (bytes.size() < 2) return "A";
            let randomValue = bytes[0].toNat() * 256 + bytes[1].toNat();
            if (randomValue % 100 < 70) {
                let latinChars = ["A", "B", "C", "D", "E", "F", "G"];
                latinChars[randomValue % latinChars.size()];
            } else {
                if (randomValue % 100 < 90) {
                    let japaneseChars = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"];
                    japaneseChars[randomValue % japaneseChars.size()];
                } else {
                    let katakanaChars = ["ア", "イ", "ウ", "エ", "オ"];
                    katakanaChars[randomValue % katakanaChars.size()];
                };
            };
        };

        var resultList : [Text] = [];
        var i = 0;
        while (i < numCharacters) {
            let character = getRandomCharacter(seed);
            resultList := resultList.concat([character]);
            i += 1;
        };

        resultList;
    };



    public shared func createEmissionEffectAnimation(numRows : Nat, durationMs : Nat, leftMargin : Nat, rightMargin : Nat, expandFactor : Nat) : async {
        animationId : Nat;
    } {
        let animation : {
            id : Nat;
            animationType : {
                #carousel;
                #watermark;
                #emissionEffect;
            };
            characterSet : [Text];
            numRows : Nat;
            durationMs : Nat;
            leftMargin : Nat;
            rightMargin : Nat;
            expandFactor : Nat;
        } = {
            id = 1;
            animationType = #emissionEffect;
            characterSet = [
                "A", "B", "C", "1", "2", "3", "!", "?", "#", "@",
                "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ",
                "ა", "ბ", "გ", "დ", "ე", "ვ", "ზ", "თ", "ი",
                "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊"
            ];
            numRows;
            durationMs;
            leftMargin = leftMargin * expandFactor;
            rightMargin = rightMargin * expandFactor;
            expandFactor;
        };

        {
            animationId = animation.id;
        };
    };





    public shared func getRandomEmissionCharacters(numCharacters : Nat, direction : {
        #left;
        #right;
    }) : async [Text] {
        let seed : Blob = await Random.blob();

        func generateRandomCharacter(s : Blob, dir : { #left; #right }) : Text {
            let bytes = s.toArray();
            if (bytes.size() < 2) return "A";
            let randomValue = bytes[0].toNat() * 256 + bytes[1].toNat();
            let characterSets : [[Text]] = switch (dir) {
                case (#left) [
                    ["A", "B", "C", "1", "2", "3", "!", "?", "#", "@"],
                    ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"],
                    ["ა", "ბ", "გ", "დ", "ე", "ვ", "ზ", "თ", "ი"],
                    ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊"],
                ];
                case (#right) [
                    ["A", "B", "C", "D", "E", "F", "G"],
                    ["あ", "い", "う", "え", "お"],
                    ["ა", "ბ", "გ", "დ", "ე"],
                ];
            };
            let setIndex = randomValue % characterSets.size();
            let characterSet = characterSets[setIndex];
            characterSet[randomValue % characterSet.size()];
        };

        var emissionCharacters : [Text] = [];
        var i = 0;
        while (i < numCharacters) {
            let character = generateRandomCharacter(seed, direction);
            emissionCharacters := emissionCharacters.concat([character]);
            i += 1;
        };

        emissionCharacters;
    };

    public type BackgroundMusicTrack = {
        path : Text;
        title : Text;
        artist : Text;
        uploadTimestamp : Int;
        isActive : Bool;
    };

    let backgroundMusicTracks = Map.empty<Text, BackgroundMusicTrack>();

    var activeBackgroundMusicTrack : ?Text = null;

    // Ordered playlist — array of track paths in play order
    var backgroundMusicPlaylist : [Text] = [];

    // Current index in the playlist (advances as tracks finish)
    var backgroundMusicPlaylistIndex : Nat = 0;

    // Master on/off toggle — when false the frontend must not play any music
    var backgroundMusicEnabled : Bool = true;

    public type BackgroundMusicState = {
        tracks : [BackgroundMusicTrack];
        activeTrack : ?Text;
        playlist : [Text];
        currentPlaylistIndex : Nat;
        musicEnabled : Bool;
        settings : {
            volume : Nat;
            fadeInDuration : Nat;
            fadeOutDuration : Nat;
            shouldLoop : Bool;
        };
    };

    var backgroundMusicSettings = {
        volume = 50;
        fadeInDuration = 3000;
        fadeOutDuration = 3000;
        shouldLoop = true;
    };

    public shared ({ caller }) func uploadBackgroundMusicTrack(track : BackgroundMusicTrack) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can upload background music tracks");
        };
        backgroundMusicTracks.add(track.path, track);
    };

    public shared ({ caller }) func setActiveBackgroundMusicTrack(trackPath : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can set active background music track");
        };
        let existingTrack = backgroundMusicTracks.get(trackPath);
        switch (existingTrack) {
            case (?track) {
                backgroundMusicTracks.add(trackPath, { track with isActive = true });
                activeBackgroundMusicTrack := ?trackPath;
                for ((key, t) in backgroundMusicTracks.entries()) {
                    if (key != trackPath and t.isActive) {
                        backgroundMusicTracks.add(key, { t with isActive = false });
                    };
                };
            };
            case null {
                Runtime.trap("Track not found");
            };
        };
    };

    public shared ({ caller }) func deactivateBackgroundMusicTrack(trackPath : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can deactivate background music track");
        };
        switch (backgroundMusicTracks.get(trackPath)) {
            case (?track) {
                backgroundMusicTracks.add(trackPath, { track with isActive = false });
                if (activeBackgroundMusicTrack == ?trackPath) activeBackgroundMusicTrack := null;
            };
            case null {
                Runtime.trap("Track not found");
            };
        };
    };

    public shared ({ caller }) func updateBackgroundMusicSettings(settings : {
        volume : Nat;
        fadeInDuration : Nat;
        fadeOutDuration : Nat;
        shouldLoop : Bool;
    }) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update background music settings");
        };
        backgroundMusicSettings := settings;
    };

    public query func getBackgroundMusic() : async BackgroundMusicState {
        let tracks = backgroundMusicTracks.values().toArray();
        {
            tracks;
            activeTrack = activeBackgroundMusicTrack;
            playlist = backgroundMusicPlaylist;
            currentPlaylistIndex = backgroundMusicPlaylistIndex;
            musicEnabled = backgroundMusicEnabled;
            settings = backgroundMusicSettings;
        };
    };

    public shared ({ caller }) func setBackgroundMusicPlaylist(playlist : [Text]) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can set background music playlist");
        };
        backgroundMusicPlaylist := playlist;
        backgroundMusicPlaylistIndex := 0;
    };

    public shared ({ caller }) func setBackgroundMusicEnabled(enabled : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can toggle background music");
        };
        backgroundMusicEnabled := enabled;
    };

    public query func getBackgroundMusicEnabled() : async Bool {
        backgroundMusicEnabled;
    };

    public query func getBackgroundMusicTracks() : async [BackgroundMusicTrack] {
        backgroundMusicTracks.values().toArray();
    };

    public query func getActiveBackgroundMusicTrack() : async ?Text {
        activeBackgroundMusicTrack;
    };

    public query func getBackgroundMusicSettings() : async {
        volume : Nat;
        fadeInDuration : Nat;
        fadeOutDuration : Nat;
        shouldLoop : Bool;
    } {
        backgroundMusicSettings;
    };

    public shared ({ caller }) func removeBackgroundMusicTrack(trackPath : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can remove background music track");
        };
        backgroundMusicTracks.remove(trackPath);
    };

    public shared func getSpiralFlowerPattern(spawnX : Nat, spawnY : Nat, colorCode : Text) : async {
        patternId : Nat;
        centerX : Nat;
        centerY : Nat;
        spiralColor : Text;
        isBlooming : Bool;
        bloomStartTime : Int;
        bloomDurationMs : Nat;
    } {
        let centerX = spawnX;
        let centerY = spawnY;
        let spiralColor = colorCode;
        let isBlooming = true;
        let bloomStartTime = 0;
        let bloomDurationMs = 30000;

        let pattern : {
            id : Nat;
            centerX : Nat;
            centerY : Nat;
            spiralColor : Text;
            isBlooming : Bool;
            bloomStartTime : Int;
            bloomDurationMs : Nat;
        } = {
            id = 1;
            centerX;
            centerY;
            spiralColor;
            isBlooming;
            bloomStartTime;
            bloomDurationMs;
        };

        {
            patternId = pattern.id;
            centerX;
            centerY;
            spiralColor;
            isBlooming;
            bloomStartTime;
            bloomDurationMs;
        };
    };

    public query func getBtcExchangeRate() : async ?Float {
        null;
    };

    public shared func getBtcEurPrice() : async Float {
        await getBtcEurRate();
    };

    /// Returns the live ETH/EUR price (calls the mixin's cached CoinGecko fetch).
    public shared func getEthEurPrice() : async Float {
        await getEthEurRate();
    };

    /// Returns the live ICP/EUR price (calls the mixin's cached CoinGecko fetch).
    public shared func getIcpEurPrice() : async Float {
        await getIcpEurRate();
    };

    public shared ({ caller }) func updateBtcExchangeRate(_rate : Float) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update BTC exchange rate");
        };
    };

    public query func getApproximateBtcAmount(_eurAmount : Float) : async Float {
        0.0104;
    };

    public query func getPurchaseButtonUrl() : async Text {
        "https://payment-links.mollie.com/payment/LuQNwLdn4JoBgHRBsupHD";
    };

    public query func getBtcOrangeColor() : async Text {
        "#F7931A";
    };

    public query func getPurchaseButtonInstructionalText() : async Text {
        "E-mail tgopf@pm.me or Whatsapp to +31648867766 with proof of payment & shipping details.";
    };

    public query func getPayPalButtonText() : async Text {
        "via PayPal";
    };

    public query func getPayPalButtonUrl() : async Text {
        "https://www.paypal.com/ncp/payment/K9YW45XWPWQVY";
    };

    public query func getMarktplaatsButtonText() : async Text {
        "Pay & Ship via Marktplaats";
    };

    public query func getVintedButtonText() : async Text {
        "Pay & Ship via Vinted";
    };

    public query func getFeaturedProductButtonTexts() : async {
        firstProductButtonText : Text;
        secondProductButtonText : Text;
    } {
        {
            firstProductButtonText = "via Mollie";
            secondProductButtonText = "Pay via Revolut";
        };
    };

    public query func getPopupInstructions() : async {
        mollieInstruction : Text;
        revolutInstruction : Text;
    } {
        {
            mollieInstruction = "E-mail tgopf@pm.me or Whatsapp to +31648867766 with proof of payment & shipping details.";
            revolutInstruction = "Transfer €55,39 & include e-mail or phone number to contact you for your shipping details.";
        };
    };



    public type ReflectionBlockReaction = { #love; #like; #dislike; #laugh };

    public type ReflectionBlock = {
        id : Text;
        poemTitle : Text;
        reflectionChallenges : [Text];
        reactions : ?{
            love : Nat;
            like : Nat;
            dislike : Nat;
            laugh : Nat;
        };
    };

    let reflectionBlocks = Map.empty<Text, ReflectionBlock>();
    // outer key = blockId, inner key = principal as Text, value = reaction variant
    let reflectionBlockReactions = Map.empty<Text, Map.Map<Text, ReflectionBlockReaction>>();

    // All reaction counters start at 0; no seeded pseudo-random values.
    func seedBlockReactions() : { love : Nat; like : Nat; dislike : Nat; laugh : Nat } {
        { love = 0; like = 0; dislike = 0; laugh = 0 };
    };

    public shared ({ caller }) func addReflectionBlock(block : ReflectionBlock) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add reflection blocks");
        };
        let seeded = seedBlockReactions();
        let withReactions : ReflectionBlock = {
            block with
            reactions = ?seeded;
        };
        reflectionBlocks.add(block.id, withReactions);
    };

    public shared ({ caller }) func updateReflectionBlock(block : ReflectionBlock) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update reflection blocks");
        };
        // Preserve existing reactions when updating
        let reactions = switch (reflectionBlocks.get(block.id)) {
            case (?existing) { switch (existing.reactions) { case (?r) { ?r }; case null { ?seedBlockReactions() } } };
            case null { ?seedBlockReactions() };
        };
        reflectionBlocks.add(block.id, { block with reactions });
    };

    public shared ({ caller }) func deleteReflectionBlock(blockId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete reflection blocks");
        };
        reflectionBlocks.remove(blockId);
        reflectionBlockReactions.remove(blockId);
    };

    public query func getReflectionBlocks() : async [ReflectionBlock] {
        reflectionBlocks.values().toArray().map(func(b) {
            let base = switch (b.reactions) { case (?rx) rx; case null ({ love = 0; like = 0; dislike = 0; laugh = 0 }) };
            { b with reactions = ?_reflectionDisplayReactions(b.id, base) };
        });
    };

    public query func getReflectionBlock(blockId : Text) : async ?ReflectionBlock {
        switch (reflectionBlocks.get(blockId)) {
            case null null;
            case (?b) {
                let base = switch (b.reactions) { case (?rx) rx; case null ({ love = 0; like = 0; dislike = 0; laugh = 0 }) };
                ?{ b with reactions = ?_reflectionDisplayReactions(b.id, base) };
            };
        };
    };

    public shared ({ caller }) func reactToReflectionBlock(blockId : Text, reaction : ReflectionBlockReaction) : async { #ok : ReflectionBlock; #err : Text } {
        if (caller.isAnonymous()) { return #err("Not authenticated") };
        switch (reflectionBlocks.get(blockId)) {
            case null { #err("Reflection block not found") };
            case (?block) {
                let callerText = caller.toText();
                let blockReactionMap : Map.Map<Text, ReflectionBlockReaction> = switch (reflectionBlockReactions.get(blockId)) {
                    case null {
                        let m = Map.empty<Text, ReflectionBlockReaction>();
                        reflectionBlockReactions.add(blockId, m);
                        m;
                    };
                    case (?m) { m };
                };
                let rxBase = switch (block.reactions) { case (?r) { r }; case null { seedBlockReactions() } };
                var newLove = rxBase.love;
                var newLike = rxBase.like;
                var newDislike = rxBase.dislike;
                var newLaugh = rxBase.laugh;
                switch (blockReactionMap.get(callerText)) {
                    case null {};
                    case (?prev) {
                        switch prev {
                            case (#love) { if (newLove > 0) { newLove -= 1 } };
                            case (#like) { if (newLike > 0) { newLike -= 1 } };
                            case (#dislike) { if (newDislike > 0) { newDislike -= 1 } };
                            case (#laugh) { if (newLaugh > 0) { newLaugh -= 1 } };
                        };
                    };
                };
                switch reaction {
                    case (#love) { newLove += 1 };
                    case (#like) { newLike += 1 };
                    case (#dislike) { newDislike += 1 };
                    case (#laugh) { newLaugh += 1 };
                };
                blockReactionMap.add(callerText, reaction);
                let updated : ReflectionBlock = {
                    block with
                    reactions = ?{ love = newLove; like = newLike; dislike = newDislike; laugh = newLaugh };
                };
                reflectionBlocks.add(blockId, updated);
                // Track user engagement for inflation weighting
                let rxLabel = switch reaction { case (#love) "love"; case (#like) "like"; case (#dislike) "dislike"; case (#laugh) "laugh" };
                _incUserCount("reflection:" # blockId # ":" # rxLabel);
                #ok(updated);
            };
        };
    };

    // ─── Author Notes ────────────────────────────────────────────────────────

    public type AuthorNoteReaction = { #love; #like; #dislike; #laugh };

    public type AuthorNote = {
        id : Text;
        poemTitle : Text;
        poemSubtitle : Text;
        noteText : Text;
        reactions : {
            love : Nat;
            like : Nat;
            dislike : Nat;
            laugh : Nat;
        };
    };

    let authorNotes = Map.empty<Text, AuthorNote>();
    // outer key = noteId, inner key = principal as Text, value = reaction variant
    let authorNoteReactions = Map.empty<Text, Map.Map<Text, AuthorNoteReaction>>();

    public shared ({ caller }) func addAuthorNote(poemTitle : Text, poemSubtitle : Text, noteText : Text) : async { #ok : AuthorNote; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized");
        };
        let id = Time.now().toText();
        let note : AuthorNote = {
            id;
            poemTitle;
            poemSubtitle;
            noteText;
            reactions = { love = 0; like = 0; dislike = 0; laugh = 0 };
        };
        authorNotes.add(id, note);
        #ok(note);
    };

    public shared ({ caller }) func updateAuthorNote(id : Text, poemTitle : Text, poemSubtitle : Text, noteText : Text) : async { #ok : AuthorNote; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized");
        };
        switch (authorNotes.get(id)) {
            case null { #err("Author note not found") };
            case (?existing) {
                let updated : AuthorNote = { existing with poemTitle; poemSubtitle; noteText };
                authorNotes.add(id, updated);
                #ok(updated);
            };
        };
    };

    public shared ({ caller }) func deleteAuthorNote(id : Text) : async { #ok : (); #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized");
        };
        switch (authorNotes.get(id)) {
            case null { #err("Author note not found") };
            case (?_) {
                authorNotes.remove(id);
                authorNoteReactions.remove(id);
                #ok(());
            };
        };
    };

    public query func getAuthorNotes() : async [AuthorNote] {
        authorNotes.values().toArray().map(func(n) {
            let base = n.reactions;
            { n with reactions = _authorNoteDisplayReactions(n.id, base) };
        });
    };

    public shared ({ caller }) func reactToAuthorNote(noteId : Text, reaction : AuthorNoteReaction) : async { #ok : AuthorNote; #err : Text } {
        if (caller.isAnonymous()) { return #err("Not authenticated") };
        switch (authorNotes.get(noteId)) {
            case null { #err("Author note not found") };
            case (?note) {
                let callerText = caller.toText();
                // Get or create the per-note reaction map
                let noteReactionMap : Map.Map<Text, AuthorNoteReaction> = switch (authorNoteReactions.get(noteId)) {
                    case null {
                        let m = Map.empty<Text, AuthorNoteReaction>();
                        authorNoteReactions.add(noteId, m);
                        m;
                    };
                    case (?m) { m };
                };
                // Determine adjusted counts based on previous vote
                var newLove = note.reactions.love;
                var newLike = note.reactions.like;
                var newDislike = note.reactions.dislike;
                var newLaugh = note.reactions.laugh;
                // Remove old reaction if any
                switch (noteReactionMap.get(callerText)) {
                    case null {};
                    case (?prev) {
                        switch prev {
                            case (#love) { if (newLove > 0) { newLove -= 1 } };
                            case (#like) { if (newLike > 0) { newLike -= 1 } };
                            case (#dislike) { if (newDislike > 0) { newDislike -= 1 } };
                            case (#laugh) { if (newLaugh > 0) { newLaugh -= 1 } };
                        };
                    };
                };
                // Add new reaction
                switch reaction {
                    case (#love) { newLove += 1 };
                    case (#like) { newLike += 1 };
                    case (#dislike) { newDislike += 1 };
                    case (#laugh) { newLaugh += 1 };
                };
                // Store updated vote
                noteReactionMap.add(callerText, reaction);
                // Save updated note
                let updated : AuthorNote = {
                    note with
                    reactions = { love = newLove; like = newLike; dislike = newDislike; laugh = newLaugh };
                };
                authorNotes.add(noteId, updated);
                // Track user engagement for inflation weighting
                let rxLabel = switch reaction { case (#love) "love"; case (#like) "like"; case (#dislike) "dislike"; case (#laugh) "laugh" };
                _incUserCount("author_note:" # noteId # ":" # rxLabel);
                #ok(updated);
            };
        };
    };

    // ─── Experience Hub Challenges ───────────────────────────────────────────

    public type ChallengeCategory = { #retail; #social };

    public type ExperienceChallenge = {
        id : Text;
        category : ChallengeCategory;
        title : Text;
        description : Text;
        rewardPoints : Nat;
        specialReward : ?Text;
    };

    let experienceChallenges = Map.empty<Text, ExperienceChallenge>();

    var submitProofEmail : Text = "tgopf@pm.me";

    // ── Global submit-proof email ────────────────────────────────────────────

    public query func getSubmitProofEmail() : async Text {
        submitProofEmail;
    };

    public shared ({ caller }) func updateSubmitProofEmail(email : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update the submit proof email");
        };
        submitProofEmail := email;
    };

    // ── Challenge CRUD ───────────────────────────────────────────────────────

    public shared ({ caller }) func addChallenge(
        category : ChallengeCategory,
        title : Text,
        description : Text,
        rewardPoints : Nat,
        specialReward : ?Text,
    ) : async { #ok : ExperienceChallenge; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized: Only admins can add challenges");
        };
        let id = Time.now().toText() # "-" # title;
        let challenge : ExperienceChallenge = {
            id;
            category;
            title;
            description;
            rewardPoints;
            specialReward;
        };
        experienceChallenges.add(id, challenge);
        #ok(challenge);
    };

    public shared ({ caller }) func updateChallenge(
        id : Text,
        category : ChallengeCategory,
        title : Text,
        description : Text,
        rewardPoints : Nat,
        specialReward : ?Text,
    ) : async { #ok : ExperienceChallenge; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized: Only admins can update challenges");
        };
        switch (experienceChallenges.get(id)) {
            case null { #err("Challenge not found") };
            case (?_) {
                let updated : ExperienceChallenge = {
                    id;
                    category;
                    title;
                    description;
                    rewardPoints;
                    specialReward;
                };
                experienceChallenges.add(id, updated);
                #ok(updated);
            };
        };
    };

    public shared ({ caller }) func deleteChallenge(id : Text) : async { #ok : (); #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized: Only admins can delete challenges");
        };
        switch (experienceChallenges.get(id)) {
            case null { #err("Challenge not found") };
            case (?_) {
                experienceChallenges.remove(id);
                #ok(());
            };
        };
    };

    public query func getChallenges() : async [ExperienceChallenge] {
        experienceChallenges.values().toArray();
    };

    public query func getChallengesByCategory(category : ChallengeCategory) : async [ExperienceChallenge] {
        experienceChallenges.values().toArray().filter(func(c : ExperienceChallenge) : Bool {
            switch (c.category, category) {
                case (#retail, #retail) { true };
                case (#social, #social) { true };
                case _ { false };
            }
        });
    };

    // ─── Footer Settings ──────────────────────────────────────────────────────

    public type FooterSettings = {
        businessName    : Text;
        businessAddress : Text;
        businessTaxId   : Text;
        businessKvk     : Text;
        businessIban    : Text;
        businessPhone   : Text;
        businessEmail   : Text;
        footerCaption   : Text;
    };

    var footerSettings : FooterSettings = {
        businessName    = "Le Royalties Sergio Melicio";
        businessAddress = "Rotterdam, The Netherlands";
        businessTaxId   = "NL005317123B43";
        businessKvk     = "98223216";
        businessIban    = "NL08 RABO 0155 3288 24";
        businessPhone   = "+31 6 12345678";
        businessEmail   = "tgopf@pm.me";
        footerCaption   = "Sergio Melicio's first published poetry bundle, crafted with love and innerness.";
    };

    public query func getFooterSettings() : async FooterSettings {
        footerSettings;
    };

    public shared ({ caller }) func updateFooterSettings(settings : FooterSettings) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized: Only admins can update footer settings");
        };
        footerSettings := settings;
    };

    // ─── Newsletter Subscribers ───────────────────────────────────────────────

    public type NewsletterSubscriber = {
        principalId  : Text;
        email        : Text;
        subscribedAt : Int;
    };

    let newsletterSubscribers = Map.empty<Text, NewsletterSubscriber>();

    public shared ({ caller }) func subscribeToNewsletter(email : Text) : async { #ok : Text; #err : Text } {
        if (caller.isAnonymous()) { return #err("You must be logged in to subscribe") };
        if (email.size() == 0) { return #err("Email address cannot be empty") };
        let pid = caller.toText();
        switch (newsletterSubscribers.get(pid)) {
            case (?_) { return #err("Already subscribed") };
            case null {};
        };
        let entry : NewsletterSubscriber = {
            principalId  = pid;
            email;
            subscribedAt = Time.now();
        };
        newsletterSubscribers.add(pid, entry);
        #ok("Successfully subscribed to the newsletter");
    };

    public shared ({ caller }) func unsubscribeFromNewsletter() : async { #ok : Text; #err : Text } {
        if (caller.isAnonymous()) { return #err("You must be logged in to unsubscribe") };
        let pid = caller.toText();
        switch (newsletterSubscribers.get(pid)) {
            case null { return #err("You are not subscribed") };
            case (?_) {
                newsletterSubscribers.remove(pid);
                #ok("Successfully unsubscribed from the newsletter");
            };
        };
    };

    public query ({ caller }) func getMyNewsletterSubscription() : async ?NewsletterSubscriber {
        if (caller.isAnonymous()) { return null };
        newsletterSubscribers.get(caller.toText());
    };

    public query ({ caller }) func listNewsletterSubscribers() : async [NewsletterSubscriber] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            return [];
        };
        newsletterSubscribers.values().toArray();
    };

    public shared ({ caller }) func removeNewsletterSubscriber(principalId : Text) : async { #ok : Text; #err : Text } {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            return #err("Unauthorized: Only admins can remove newsletter subscribers");
        };
        switch (newsletterSubscribers.get(principalId)) {
            case null { return #err("Subscriber not found") };
            case (?_) {
                newsletterSubscribers.remove(principalId);
                #ok("Subscriber removed successfully");
            };
        };
    };

    // ─── Donations ────────────────────────────────────────────────────────────
    let donationsMap = Map.empty<Text, DonationTypes.DonationEntry>();
    include DonationsAPI(accessControlState, donationsMap);

    // ─── Experience Hub Texts ─────────────────────────────────────────────────

    public type ExperienceHubTexts = {
        mainSubtitle          : Text;
        retailCardDescription : Text;
        socialCardDescription : Text;
        gamesCardDescription  : Text;
        retailPageSubtitle    : Text;
        socialPageSubtitle    : Text;
        gamesPageSubtitle     : Text;
    };

    var experienceHubTexts : ExperienceHubTexts = {
        mainSubtitle          = "Choose your path to earn rewards and climb the leaderboard";
        retailCardDescription = "Earn rewards through direct sales, referrals, and retail partnerships. Track your performance and compete with other retail ambassadors.";
        socialCardDescription = "Grow your influence through social media engagement, content creation, and community building. Compete on the social leaderboard.";
        gamesCardDescription  = "Explore a collection of games curated by the author. Discover new ways to play, react to your favourites, and join the conversation.";
        retailPageSubtitle    = "Top performers in retail sales and partnerships";
        socialPageSubtitle    = "Top performers in social media and community engagement";
        gamesPageSubtitle     = "Discover and explore games — shuffled fresh every visit.";
    };

    public query func getExperienceHubTexts() : async ExperienceHubTexts {
        experienceHubTexts;
    };

    public shared ({ caller }) func updateExperienceHubTexts(texts : ExperienceHubTexts) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized: Only admins can update Experience Hub texts");
        };
        experienceHubTexts := texts;
    };

    // ─── Gallery Carousel ─────────────────────────────────────────────────────

    public type GalleryCarouselPhoto = {
        id        : Text;
        path      : Text;
        linkUrl   : Text;
        sortOrder : Nat;
        side      : Text;
    };

    var galleryCarouselPhotosMap = Map.empty<Text, GalleryCarouselPhoto>();

    public query func getGalleryCarouselPhotos() : async [GalleryCarouselPhoto] {
        let photos = galleryCarouselPhotosMap.values().toArray();
        photos.sort(func(a : GalleryCarouselPhoto, b : GalleryCarouselPhoto) : Order.Order {
            if (a.side < b.side) { #less }
            else if (a.side > b.side) { #greater }
            else if (a.sortOrder < b.sortOrder) { #less }
            else if (a.sortOrder > b.sortOrder) { #greater }
            else { #equal }
        })
    };

    public shared ({ caller }) func saveGalleryCarouselPhoto(id : Text, path : Text, linkUrl : Text, sortOrder : Nat, side : Text) : async { #ok; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized");
        };
        let photo : GalleryCarouselPhoto = { id; path; linkUrl; sortOrder; side };
        galleryCarouselPhotosMap.add(id, photo);
        #ok
    };

    public shared ({ caller }) func deleteGalleryCarouselPhoto(id : Text) : async { #ok; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized");
        };
        galleryCarouselPhotosMap.remove(id);
        #ok
    };

    public shared ({ caller }) func reorderGalleryCarouselPhotos(orderedIds : [Text]) : async { #ok; #err : Text } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            return #err("Unauthorized");
        };
        var i : Nat = 0;
        for (id in orderedIds.vals()) {
            switch (galleryCarouselPhotosMap.get(id)) {
                case (?photo) {
                    galleryCarouselPhotosMap.add(id, { photo with sortOrder = i });
                    i += 1;
                };
                case null {};
            };
        };
        #ok
    };

    // ─── Announcements state ──────────────────────────────────────────────────────────────
    let announcementsMap  = Map.empty<Nat, AnnouncementsTypes.Announcement>();
    let announcementState = { var nextId : Nat = 0; var rotationInterval : Nat = 8 };
    include AnnouncementsAPI(accessControlState, announcementsMap, announcementState);

    // -- Feature system toggle getters/setters --

    /// Query: is the emoji/reaction counter system currently enabled?
    public query func getEmojiSystemEnabled() : async Bool {
        emojiSystemState.enabled;
    };

    /// Admin-only: enable or disable the emoji inflation engine and reaction counters.
    public shared ({ caller }) func setEmojiSystemEnabled(enabled : Bool) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        emojiSystemState.enabled := enabled;
    };

    /// Query: is the crypto payment system currently enabled?
    public query func getCryptoSystemEnabled() : async Bool {
        cryptoSystemState.enabled;
    };

    /// Admin-only: enable or disable the crypto payment system.
    public shared ({ caller }) func setCryptoSystemEnabled(enabled : Bool) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        cryptoSystemState.enabled := enabled;
    };

    /// Query: is the Amazon region payment section enabled for Emilie?
    public query func getEmilieAmazonEnabled() : async Bool {
        emilieAmazonState.enabled;
    };

    /// Admin-only: show or hide the Amazon region payment section for Emilie.
    public shared ({ caller }) func setEmilieAmazonEnabled(enabled : Bool) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        emilieAmazonState.enabled := enabled;
    };

    /// Query: is the Amazon region payment section enabled for Anna?
    public query func getAnnaAmazonEnabled() : async Bool {
        annaAmazonState.enabled;
    };

    /// Admin-only: show or hide the Amazon region payment section for Anna.
    public shared ({ caller }) func setAnnaAmazonEnabled(enabled : Bool) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        annaAmazonState.enabled := enabled;
    };

    /// Query: is the Amazon region payment section enabled for
    /// "The Song of Anna the Mermaid" 1st edition?
    public query func getAnnaSongAmazonEnabled() : async Bool {
        annaSongAmazonState.enabled;
    };

    /// Admin-only: show or hide the Amazon region payment section for
    /// "The Song of Anna the Mermaid" 1st edition.
    public shared ({ caller }) func setAnnaSongAmazonEnabled(enabled : Bool) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        annaSongAmazonState.enabled := enabled;
    };

    /// Query: is the Amazon region payment section enabled for
    /// "Emilie en de Ruïne van Azoth" 1st edition?
    public query func getEmilieNlAmazonEnabled() : async Bool {
        emilieNlAmazonState.enabled;
    };

    /// Admin-only: show or hide the Amazon region payment section for
    /// "Emilie en de Ruïne van Azoth" 1st edition.
    public shared ({ caller }) func setEmilieNlAmazonEnabled(enabled : Bool) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        emilieNlAmazonState.enabled := enabled;
    };

    /// Query: is the site-wide maintenance notice popup currently enabled?
    /// Default true after deploy. The frontend shows a large modal overlay on
    /// every page when this returns true; dismissal is per-session.
    public query func getMaintenanceNoticeEnabled() : async Bool {
        maintenanceNotice.enabled;
    };

    /// Admin-only: enable or disable the site-wide maintenance notice popup.
    public shared ({ caller }) func setMaintenanceNoticeEnabled(enabled : Bool) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Runtime.trap("Unauthorized");
        };
        maintenanceNotice.enabled := enabled;
    };

    // ─── OQL (Data Intelligence) — Expose mixin ───────────────────────────────
    // Adds the `schema` and `execute` query methods required by the Caffeine
    // Data Intelligence agent. One entity per persisted collection. Per-entity
    // authorization: #public_ for world-readable catalogues (reviews are shown
    // on the public site), #controllerOnly for admin-managed payment config
    // (Amazon region maps and feature toggles). OQL is read-only — writes
    // still go through the existing admin endpoints, unchanged.
    //
    // `Entity.manual` + `.payload` is used because the stored record types
    // Optional fields (`?Text`, `?Nat`) and nested-record fields have no
    // implicit `_toRow` instance in caffeineai-oql, so each `.payload` lambda
    // returns `OQL.Value` directly via `#text/#nat/#bool/#null_` variants and
    // the `_optTextToValue`/`_optNatToValue` helpers below. Options render as
    // `#null_` and primitives as their native variant.

    // Optional Text -> OQL.Value (#null_ when absent).
    func _optTextToValue(v : ?Text) : OQL.Value {
        switch (v) {
            case (?t) #text t;
            case null #null_;
        };
    };

    // Optional Nat -> OQL.Value (#null_ when absent).
    func _optNatToValue(v : ?Nat) : OQL.Value {
        switch (v) {
            case (?n) #nat n;
            case null #null_;
        };
    };

    include Expose({
        entities = [
            // ── reviews: public site content (visitors read; admin writes) ──
            reviews
                .toEntityManual("review", "Review", "id")
                .payload("id", func (r : Review) : OQL.Value { #text (r.id) })
                .payload("reviewerName", func (r : Review) : OQL.Value { #text (r.reviewerName) })
                .payload("companyBlogSite", func (r : Review) : OQL.Value { _optTextToValue(r.companyBlogSite) })
                .payload("bookTitle", func (r : Review) : OQL.Value { #text (r.bookTitle) })
                .payload("poemTitle", func (r : Review) : OQL.Value { #text (r.poemTitle) })
                .payload("poemSubTitle", func (r : Review) : OQL.Value { #text (r.poemSubTitle) })
                .payload("pageNumbers", func (r : Review) : OQL.Value { #text (r.pageNumbers) })
                .payload("photoPath", func (r : Review) : OQL.Value { _optTextToValue(r.photoPath) })
                .payload("snippet", func (r : Review) : OQL.Value { #text (r.snippet) })
                .payload("fullText", func (r : Review) : OQL.Value { #text (r.fullText) })
                .payload("sourceLink", func (r : Review) : OQL.Value { _optTextToValue(r.sourceLink) })
                .payload("videoUrl", func (r : Review) : OQL.Value { _optTextToValue(r.videoUrl) })
                .payload("starRating", func (r : Review) : OQL.Value { _optNatToValue(r.starRating) })
                .payload("reactionsLove", func (r : Review) : OQL.Value {
                    switch (r.reactions) {
                        case (?rx) #nat (rx.love);
                        case null #null_;
                    };
                })
                .payload("reactionsLike", func (r : Review) : OQL.Value {
                    switch (r.reactions) {
                        case (?rx) #nat (rx.like);
                        case null #null_;
                    };
                })
                .payload("reactionsDislike", func (r : Review) : OQL.Value {
                    switch (r.reactions) {
                        case (?rx) #nat (rx.dislike);
                        case null #null_;
                    };
                })
                .payload("reactionsLaugh", func (r : Review) : OQL.Value {
                    switch (r.reactions) {
                        case (?rx) #nat (rx.laugh);
                        case null #null_;
                    };
                })
                .public_()
                .build(),

            // ── Amazon region maps: admin-managed payment config (controllerOnly) ──
            amazonRegionsTopf
                .toEntityManual("amazonRegionTopf", "AmazonRegion", "id")
                .payload("id", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.id) })
                .payload("country", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.country) })
                .payload("domain", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.domain) })
                .payload("kindleLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleLink) })
                .payload("paperbackLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackLink) })
                .payload("hardcoverLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverLink) })
                .payload("kindleButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonText) })
                .payload("paperbackButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonText) })
                .payload("hardcoverButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonText) })
                .payload("kindleButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonColor) })
                .payload("paperbackButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonColor) })
                .payload("hardcoverButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonColor) })
                .payload("kindleFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleFontColor) })
                .payload("paperbackFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackFontColor) })
                .payload("hardcoverFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverFontColor) })
                .payload("showKindleUnlimited", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.showKindleUnlimited) })
                .payload("currencySymbol", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.currencySymbol) })
                .payload("kindlePrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindlePrice) })
                .payload("paperbackPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackPrice) })
                .payload("hardcoverPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverPrice) })
                .payload("enabled", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.enabled) })
                .controllerOnly()
                .build(),

            amazonRegionsEmilie
                .toEntityManual("amazonRegionEmilie", "AmazonRegion", "id")
                .payload("id", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.id) })
                .payload("country", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.country) })
                .payload("domain", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.domain) })
                .payload("kindleLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleLink) })
                .payload("paperbackLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackLink) })
                .payload("hardcoverLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverLink) })
                .payload("kindleButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonText) })
                .payload("paperbackButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonText) })
                .payload("hardcoverButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonText) })
                .payload("kindleButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonColor) })
                .payload("paperbackButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonColor) })
                .payload("hardcoverButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonColor) })
                .payload("kindleFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleFontColor) })
                .payload("paperbackFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackFontColor) })
                .payload("hardcoverFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverFontColor) })
                .payload("showKindleUnlimited", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.showKindleUnlimited) })
                .payload("currencySymbol", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.currencySymbol) })
                .payload("kindlePrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindlePrice) })
                .payload("paperbackPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackPrice) })
                .payload("hardcoverPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverPrice) })
                .payload("enabled", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.enabled) })
                .controllerOnly()
                .build(),

            amazonRegionsAnna
                .toEntityManual("amazonRegionAnna", "AmazonRegion", "id")
                .payload("id", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.id) })
                .payload("country", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.country) })
                .payload("domain", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.domain) })
                .payload("kindleLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleLink) })
                .payload("paperbackLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackLink) })
                .payload("hardcoverLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverLink) })
                .payload("kindleButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonText) })
                .payload("paperbackButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonText) })
                .payload("hardcoverButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonText) })
                .payload("kindleButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonColor) })
                .payload("paperbackButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonColor) })
                .payload("hardcoverButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonColor) })
                .payload("kindleFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleFontColor) })
                .payload("paperbackFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackFontColor) })
                .payload("hardcoverFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverFontColor) })
                .payload("showKindleUnlimited", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.showKindleUnlimited) })
                .payload("currencySymbol", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.currencySymbol) })
                .payload("kindlePrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindlePrice) })
                .payload("paperbackPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackPrice) })
                .payload("hardcoverPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverPrice) })
                .payload("enabled", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.enabled) })
                .controllerOnly()
                .build(),

            amazonRegionsAnnaSong
                .toEntityManual("amazonRegionAnnaSong", "AmazonRegion", "id")
                .payload("id", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.id) })
                .payload("country", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.country) })
                .payload("domain", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.domain) })
                .payload("kindleLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleLink) })
                .payload("paperbackLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackLink) })
                .payload("hardcoverLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverLink) })
                .payload("kindleButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonText) })
                .payload("paperbackButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonText) })
                .payload("hardcoverButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonText) })
                .payload("kindleButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonColor) })
                .payload("paperbackButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonColor) })
                .payload("hardcoverButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonColor) })
                .payload("kindleFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleFontColor) })
                .payload("paperbackFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackFontColor) })
                .payload("hardcoverFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverFontColor) })
                .payload("showKindleUnlimited", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.showKindleUnlimited) })
                .payload("currencySymbol", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.currencySymbol) })
                .payload("kindlePrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindlePrice) })
                .payload("paperbackPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackPrice) })
                .payload("hardcoverPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverPrice) })
                .payload("enabled", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.enabled) })
                .controllerOnly()
                .build(),

            amazonRegionsEmilieNl
                .toEntityManual("amazonRegionEmilieNl", "AmazonRegion", "id")
                .payload("id", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.id) })
                .payload("country", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.country) })
                .payload("domain", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.domain) })
                .payload("kindleLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleLink) })
                .payload("paperbackLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackLink) })
                .payload("hardcoverLink", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverLink) })
                .payload("kindleButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonText) })
                .payload("paperbackButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonText) })
                .payload("hardcoverButtonText", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonText) })
                .payload("kindleButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleButtonColor) })
                .payload("paperbackButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackButtonColor) })
                .payload("hardcoverButtonColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverButtonColor) })
                .payload("kindleFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindleFontColor) })
                .payload("paperbackFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackFontColor) })
                .payload("hardcoverFontColor", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverFontColor) })
                .payload("showKindleUnlimited", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.showKindleUnlimited) })
                .payload("currencySymbol", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.currencySymbol) })
                .payload("kindlePrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.kindlePrice) })
                .payload("paperbackPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.paperbackPrice) })
                .payload("hardcoverPrice", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #text (r.hardcoverPrice) })
                .payload("enabled", func (r : AmazonRegionTypes.AmazonRegion) : OQL.Value { #bool (r.enabled) })
                .controllerOnly()
                .build(),

            // ── Amazon feature toggles: admin config (controllerOnly) ──
            // One row per book; the four persisted toggle state variables are
            // surfaced as a single queryable entity keyed by `book`.
            Entity.manual<{ book : Text; enabled : Bool }>(
                "amazonToggleState",
                func () {
                    [
                        { book = "emilie"; enabled = emilieAmazonState.enabled },
                        { book = "anna"; enabled = annaAmazonState.enabled },
                        { book = "anna-song"; enabled = annaSongAmazonState.enabled },
                        { book = "emilie-nl"; enabled = emilieNlAmazonState.enabled },
                    ].values();
                },
                "AmazonToggleState",
                "book",
            )
                .payload("book", func (t : { book : Text; enabled : Bool }) : OQL.Value { #text (t.book) })
                .payload("enabled", func (t : { book : Text; enabled : Bool }) : OQL.Value { #bool (t.enabled) })
                .controllerOnly()
                .build(),
        ];
    });
};
