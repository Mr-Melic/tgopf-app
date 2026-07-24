import Types "../types/donations";
import DonationsLib "../lib/donations";
import AccessControl "../authorization/access-control";
import Map "mo:core/Map";

/// Public API mixin for the donations domain.
/// State (donationsMap) and access control are injected by main.mo.
/// Only the admin can mutate data; listDonations is public.
mixin (
    accessControlState : AccessControl.AccessControlState,
    donationsMap       : Map.Map<Text, Types.DonationEntry>,
) {

    // ── Public API ────────────────────────────────────────────────────────────

    /// Add a new donation entry (admin only).
    /// Returns the new entry ID on success, or an "error: …" string on failure.
    public shared ({ caller }) func addDonation(
        name     : Text,
        address  : Text,
        column   : Nat,
        position : Nat,
    ) : async Text {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            return "error: unauthorized";
        };
        switch (DonationsLib.addDonation(donationsMap, name, address, column, position)) {
            case (#ok id)   { id };
            case (#err msg) { "error: " # msg };
        };
    };

    /// Update an existing donation entry (admin only).
    /// Returns true on success, false if not found or validation fails.
    public shared ({ caller }) func updateDonation(
        id       : Text,
        name     : Text,
        address  : Text,
        column   : Nat,
        position : Nat,
    ) : async Bool {
        if (not AccessControl.isAdmin(accessControlState, caller)) { return false };
        switch (DonationsLib.updateDonation(donationsMap, id, name, address, column, position)) {
            case (#ok result) { result };
            case (#err _)     { false };
        };
    };

    /// Delete a donation entry by ID (admin only).
    /// Returns true on success, false if not found.
    public shared ({ caller }) func deleteDonation(id : Text) : async Bool {
        if (not AccessControl.isAdmin(accessControlState, caller)) { return false };
        DonationsLib.deleteDonation(donationsMap, id);
    };

    /// List all donation entries. Public — no authentication required.
    public query func listDonations() : async [Types.DonationEntry] {
        DonationsLib.listDonations(donationsMap);
    };
};
