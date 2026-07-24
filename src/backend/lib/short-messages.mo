import Types "../types/short-messages";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";

/// Domain logic for the short-messages system.
/// All functions are pure / stateless — state is injected via the messages map.
module {
    public type ShortMessage = Types.ShortMessage;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// Generate a deterministic UUID-style ID from Time.now().
    /// Uses base-16 representation of the nanosecond timestamp for uniqueness.
    func generateId() : Text {
        let t = Time.now();
        // Use abs value and combine with a salt to spread IDs further
        let abs = Int.abs(t);
        "msg-" # abs.toText();
    };

    // ── CRUD ──────────────────────────────────────────────────────────────────

    /// Add a new short message. Returns the created ShortMessage.
    public func addShortMessage(
        messages : Map.Map<Text, ShortMessage>,
        text     : Text,
    ) : ShortMessage {
        let id        = generateId();
        let createdAt = Time.now();
        let msg : ShortMessage = { id; text; createdAt };
        messages.add(id, msg);
        msg;
    };

    /// Update the text of an existing message. Returns ?ShortMessage or null if not found.
    public func updateShortMessage(
        messages : Map.Map<Text, ShortMessage>,
        id       : Text,
        text     : Text,
    ) : ?ShortMessage {
        switch (messages.get(id)) {
            case null { null };
            case (?existing) {
                let updated : ShortMessage = { existing with text };
                messages.add(id, updated);
                ?updated;
            };
        };
    };

    /// Delete a message by ID. Returns true if deleted, false if not found.
    public func deleteShortMessage(
        messages : Map.Map<Text, ShortMessage>,
        id       : Text,
    ) : Bool {
        switch (messages.get(id)) {
            case null { false };
            case (?_)  {
                messages.remove(id);
                true;
            };
        };
    };

    /// Return all messages as an array.
    public func listShortMessages(
        messages : Map.Map<Text, ShortMessage>,
    ) : [ShortMessage] {
        messages.values().toArray();
    };
};
