import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "../authorization/access-control";
import AmazonRegionTypes "../types/amazon-regions";
import AmazonRegionsMultiLib "../lib/amazon-regions-multi";

// Mixin that exposes per-book Amazon region CRUD.
// Valid bookKey values: "topf", "emilie", "anna", "anna-song", "emilie-nl".
mixin (
    accessControlState   : AccessControl.AccessControlState,
    amazonRegionsTopf    : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    amazonRegionsEmilie  : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    amazonRegionsAnna    : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    amazonRegionsAnnaSong : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
    amazonRegionsEmilieNl : Map.Map<Text, AmazonRegionTypes.AmazonRegion>,
) {
    // ─── Read ─────────────────────────────────────────────────────────────────

    /// Return all regions for a book (bookKey: "topf" | "emilie" | "anna" | "anna-song" | "emilie-nl").
    public query func getAmazonRegionsByBook(bookKey : Text) : async [AmazonRegionTypes.AmazonRegion] {
        AmazonRegionsMultiLib.getRegionsByBook(
            bookKey,
            amazonRegionsTopf,
            amazonRegionsEmilie,
            amazonRegionsAnna,
            amazonRegionsAnnaSong,
            amazonRegionsEmilieNl,
        );
    };

    /// Return a single region by id for a book.
    public query func getAmazonRegionForBook(bookKey : Text, regionId : Text) : async ?AmazonRegionTypes.AmazonRegion {
        AmazonRegionsMultiLib.getRegionByBook(
            bookKey,
            regionId,
            amazonRegionsTopf,
            amazonRegionsEmilie,
            amazonRegionsAnna,
            amazonRegionsAnnaSong,
            amazonRegionsEmilieNl,
        );
    };

    // ─── Write ────────────────────────────────────────────────────────────────

    /// Upsert a single region for a specific book.
    public shared ({ caller }) func saveAmazonRegionForBook(bookKey : Text, region : AmazonRegionTypes.AmazonRegion) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can save Amazon regions for a book");
        };
        AmazonRegionsMultiLib.saveRegionForBook(
            bookKey,
            region,
            amazonRegionsTopf,
            amazonRegionsEmilie,
            amazonRegionsAnna,
            amazonRegionsAnnaSong,
            amazonRegionsEmilieNl,
        );
    };

    /// Bulk-replace all regions for a specific book.
    public shared ({ caller }) func saveAmazonRegionsByBook(bookKey : Text, regions : [AmazonRegionTypes.AmazonRegion]) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can set Amazon regions for a book");
        };
        AmazonRegionsMultiLib.setRegionsByBook(
            bookKey,
            regions,
            amazonRegionsTopf,
            amazonRegionsEmilie,
            amazonRegionsAnna,
            amazonRegionsAnnaSong,
            amazonRegionsEmilieNl,
        );
    };

    /// Remove a region by id from a specific book.
    public shared ({ caller }) func removeAmazonRegionFromBook(bookKey : Text, regionId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can remove Amazon regions from a book");
        };
        AmazonRegionsMultiLib.removeRegionFromBook(
            bookKey,
            regionId,
            amazonRegionsTopf,
            amazonRegionsEmilie,
            amazonRegionsAnna,
            amazonRegionsAnnaSong,
            amazonRegionsEmilieNl,
        );
    };
};
