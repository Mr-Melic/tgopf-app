import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "../authorization/access-control";
import Types "../types/amazon-regions";

mixin (
    accessControlState : AccessControl.AccessControlState,
    amazonRegions : Map.Map<Text, Types.AmazonRegion>,
) {
    public shared ({ caller }) func addAmazonRegion(region : Types.AmazonRegion) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add Amazon regions");
        };
        amazonRegions.add(region.id, region);
    };

    public shared ({ caller }) func updateAmazonRegion(region : Types.AmazonRegion) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update Amazon regions");
        };
        amazonRegions.add(region.id, region);
    };

    public shared ({ caller }) func deleteAmazonRegion(regionId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete Amazon regions");
        };
        amazonRegions.remove(regionId);
    };

    public query func getAmazonRegions() : async [Types.AmazonRegion] {
        amazonRegions.values().toArray();
    };

    public query func getAmazonRegion(regionId : Text) : async ?Types.AmazonRegion {
        amazonRegions.get(regionId);
    };

    // Bulk-replace all regions (admin saves full list at once).
    // Only existing entries are replaced; removed entries are deleted.
    public shared ({ caller }) func setAmazonRegions(regions : [Types.AmazonRegion]) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can set Amazon regions");
        };
        // Clear and repopulate atomically.
        let toRemove = amazonRegions.keys().toArray();
        for (k in toRemove.vals()) {
            amazonRegions.remove(k);
        };
        for (region in regions.vals()) {
            amazonRegions.add(region.id, region);
        };
    };
};
