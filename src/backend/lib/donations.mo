import Types "../types/donations";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";

/// Domain logic for the donations system.
/// All functions are pure / stateless — state is injected via the donations map.
module {
    public type DonationEntry = Types.DonationEntry;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// Generate a unique ID from the nanosecond timestamp.
    func generateId() : Text {
        let t   = Time.now();
        let abs = Int.abs(t);
        "don-" # abs.toText();
    };

    /// Count how many entries exist in a given column.
    func countInColumn(
        donations : Map.Map<Text, DonationEntry>,
        column    : Nat,
    ) : Nat {
        donations.values().foldLeft(0, func(acc : Nat, e : DonationEntry) : Nat {
            if (e.column == column) { acc + 1 } else { acc }
        });
    };

    // ── Validation ────────────────────────────────────────────────────────────

    /// Returns null on success, or an error message.
    func validate(column : Nat, position : Nat) : ?Text {
        if (column < 1 or column > 3) {
            return ?"column must be 1, 2, or 3";
        };
        if (position < 1 or position > 6) {
            return ?"position must be between 1 and 6";
        };
        null;
    };

    // ── CRUD ──────────────────────────────────────────────────────────────────

    /// Add a new donation entry.
    /// Returns the new ID on success, or an error message on failure.
    public func addDonation(
        donations : Map.Map<Text, DonationEntry>,
        name      : Text,
        address   : Text,
        column    : Nat,
        position  : Nat,
    ) : { #ok : Text; #err : Text } {
        switch (validate(column, position)) {
            case (?msg) { return #err msg };
            case null   {};
        };
        if (countInColumn(donations, column) >= 6) {
            return #err "column already has 6 entries (maximum reached)";
        };
        let id = generateId();
        let entry : DonationEntry = { id; name; address; column; position };
        donations.add(id, entry);
        #ok id;
    };

    /// Update an existing donation entry.
    /// Returns true on success, false if not found, or an error message on validation failure.
    public func updateDonation(
        donations : Map.Map<Text, DonationEntry>,
        id        : Text,
        name      : Text,
        address   : Text,
        column    : Nat,
        position  : Nat,
    ) : { #ok : Bool; #err : Text } {
        switch (validate(column, position)) {
            case (?msg) { return #err msg };
            case null   {};
        };
        switch (donations.get(id)) {
            case null    { #ok false };
            case (?existing) {
                // If column changes, check the new column's capacity
                // (exclude the entry itself from the count)
                if (existing.column != column) {
                    if (countInColumn(donations, column) >= 6) {
                        return #err "target column already has 6 entries (maximum reached)";
                    };
                };
                let updated : DonationEntry = { existing with name; address; column; position };
                donations.add(id, updated);
                #ok true;
            };
        };
    };

    /// Delete a donation entry by ID.
    /// Returns true if deleted, false if not found.
    public func deleteDonation(
        donations : Map.Map<Text, DonationEntry>,
        id        : Text,
    ) : Bool {
        switch (donations.get(id)) {
            case null { false };
            case (?_) {
                donations.remove(id);
                true;
            };
        };
    };

    /// Return all donation entries as an array.
    public func listDonations(
        donations : Map.Map<Text, DonationEntry>,
    ) : [DonationEntry] {
        donations.values().toArray();
    };
};
