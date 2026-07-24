import Map "mo:core/Map";
import AmazonRegionTypes "../types/amazon-regions";

module {
    // ─── Helpers ─────────────────────────────────────────────────────────────

    /// Resolve bookKey to the correct Map. Returns null for unknown keys.
    /// Valid book keys: "topf", "emilie", "anna", "anna-song", "emilie-nl".
    public func resolveBook(
        bookKey    : Text,
        topf       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilie     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        anna       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        annaSong   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilieNl   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    ) : ?Map.Map<Text, AmazonRegionTypes.AmazonRegion> {
        switch (bookKey) {
            case "topf"       ?topf;
            case "emilie"     ?emilie;
            case "anna"       ?anna;
            case "anna-song"  ?annaSong;
            case "emilie-nl"  ?emilieNl;
            case _            null;
        };
    };

    // ─── Public API helpers ───────────────────────────────────────────────────

    /// Return all regions for a book as a shared array.
    public func getRegionsByBook(
        bookKey    : Text,
        topf       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilie     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        anna       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        annaSong   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilieNl   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    ) : [AmazonRegionTypes.AmazonRegion] {
        switch (resolveBook(bookKey, topf, emilie, anna, annaSong, emilieNl)) {
            case (?map) { map.values().toArray() };
            case null   [];
        };
    };

    /// Get a single region by id for a specific book.
    public func getRegionByBook(
        bookKey    : Text,
        regionId   : Text,
        topf       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilie     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        anna       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        annaSong   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilieNl   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    ) : ?AmazonRegionTypes.AmazonRegion {
        switch (resolveBook(bookKey, topf, emilie, anna, annaSong, emilieNl)) {
            case (?map) { map.get(regionId) };
            case null   null;
        };
    };

    /// Upsert a single region for a specific book.
    public func saveRegionForBook(
        bookKey    : Text,
        region     : AmazonRegionTypes.AmazonRegion,
        topf       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilie     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        anna       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        annaSong   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilieNl   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    ) : () {
        switch (resolveBook(bookKey, topf, emilie, anna, annaSong, emilieNl)) {
            case (?map) { map.add(region.id, region) };
            case null   {};
        };
    };

    /// Bulk-replace all regions for a specific book.
    public func setRegionsByBook(
        bookKey    : Text,
        regions    : [AmazonRegionTypes.AmazonRegion],
        topf       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilie     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        anna       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        annaSong   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilieNl   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    ) : () {
        switch (resolveBook(bookKey, topf, emilie, anna, annaSong, emilieNl)) {
            case (?map) {
                // Clear existing entries.
                let keys = map.keys().toArray();
                for (k in keys.values()) { map.remove(k) };
                // Insert the new set.
                for (r in regions.values()) { map.add(r.id, r) };
            };
            case null {};
        };
    };

    /// Remove a region by id from a specific book.
    public func removeRegionFromBook(
        bookKey    : Text,
        regionId   : Text,
        topf       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilie     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        anna       : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        annaSong   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilieNl   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    ) : () {
        switch (resolveBook(bookKey, topf, emilie, anna, annaSong, emilieNl)) {
            case (?map) { map.remove(regionId) };
            case null   {};
        };
    };

    /// Seed all five books with the same default regions.
    /// Only seeds a book map if it is empty (first-launch guard).
    public func seedAllBooks(
        seedFn   : (Map.Map<Text, AmazonRegionTypes.AmazonRegion>) -> (),
        topf     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilie   : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        anna     : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        annaSong : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
        emilieNl : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    ) : () {
        if (topf.size() == 0)     { seedFn(topf) };
        if (emilie.size() == 0)   { seedFn(emilie) };
        if (anna.size() == 0)     { seedFn(anna) };
        if (annaSong.size() == 0) { seedFn(annaSong) };
        if (emilieNl.size() == 0) { seedFn(emilieNl) };
    };
};
