import Types "../types/short-messages";
import ShortMessagesLib "../lib/short-messages";
import AccessControl "../authorization/access-control";
import Map "mo:core/Map";

/// Public API mixin for the ShortMessages domain.
/// Injects: accessControlState, shortMessages map.
mixin (
    accessControlState : AccessControl.AccessControlState,
    shortMessages      : Map.Map<Text, Types.ShortMessage>,
) {

    // ── Admin mutations ───────────────────────────────────────────────────────

    /// Add a new short message (max 280 chars). Admin only.
    public shared ({ caller }) func addShortMessage(text : Text) : async { #ok : Types.ShortMessage; #err : Text } {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            return #err("Unauthorized: Only admins can add short messages");
        };
        if (text.size() > 280) {
            return #err("Text exceeds 280 character limit");
        };
        #ok(ShortMessagesLib.addShortMessage(shortMessages, text));
    };

    /// Update an existing short message. Admin only.
    public shared ({ caller }) func updateShortMessage(id : Text, text : Text) : async { #ok : Types.ShortMessage; #err : Text } {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            return #err("Unauthorized: Only admins can update short messages");
        };
        if (text.size() > 280) {
            return #err("Text exceeds 280 character limit");
        };
        switch (ShortMessagesLib.updateShortMessage(shortMessages, id, text)) {
            case null  { #err("Message not found") };
            case (?msg) { #ok(msg) };
        };
    };

    /// Delete a short message by ID. Admin only.
    public shared ({ caller }) func deleteShortMessage(id : Text) : async { #ok : Bool; #err : Text } {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            return #err("Unauthorized: Only admins can delete short messages");
        };
        let deleted = ShortMessagesLib.deleteShortMessage(shortMessages, id);
        if (deleted) { #ok(true) } else { #err("Message not found") };
    };

    /// List all short messages. Public — no auth required.
    public query func listShortMessages() : async [Types.ShortMessage] {
        ShortMessagesLib.listShortMessages(shortMessages);
    };
};
