import Types "../types/favourites";
import FavouritesLib "../lib/favourites";
import AccessControl "../authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

/// Public API mixin for the Favourites domain.
/// Injects: accessControlState, userProfiles map.
mixin (
    accessControlState : AccessControl.AccessControlState,
    userProfiles       : Map.Map<Principal, Types.UserProfile>,
) {

    // ── Mutations ─────────────────────────────────────────────────────────────

    /// Add an item to the caller's favourites.
    /// itemType must be one of: "reflection", "authorNote", "game".
    /// Returns true if the item was newly added, false if it was already present.
    /// Requires the caller to be authenticated (non-anonymous).
    public shared ({ caller }) func addFavourite(itemType : Text, itemId : Text) : async Bool {
        if (caller.isAnonymous()) {
            return false;
        };
        let parsed : ?Types.FavouriteItemType = switch itemType {
            case "reflection"   { ?#reflection };
            case "authorNote"   { ?#authorNote };
            case "game"         { ?#game };
            case "vocabulary"   { ?#vocabulary };
            case "shortMessage" { ?#shortMessage };
            case _              { null };
        };
        switch parsed {
            case null { false };
            case (?t) { FavouritesLib.addFavourite(userProfiles, caller, t, itemId) };
        };
    };

    /// Remove an item from the caller's favourites.
    /// Returns true if the item was removed, false if it was not present.
    /// Requires the caller to be authenticated (non-anonymous).
    public shared ({ caller }) func removeFavourite(itemType : Text, itemId : Text) : async Bool {
        if (caller.isAnonymous()) {
            return false;
        };
        let parsed : ?Types.FavouriteItemType = switch itemType {
            case "reflection"   { ?#reflection };
            case "authorNote"   { ?#authorNote };
            case "game"         { ?#game };
            case "vocabulary"   { ?#vocabulary };
            case "shortMessage" { ?#shortMessage };
            case _              { null };
        };
        switch parsed {
            case null { false };
            case (?t) { FavouritesLib.removeFavourite(userProfiles, caller, t, itemId) };
        };
    };

    // ── Queries ───────────────────────────────────────────────────────────────

    /// Return all favourites for the authenticated caller, grouped by type.
    /// Returns empty lists for anonymous callers.
    public query ({ caller }) func getUserFavourites() : async Types.UserFavourites {
        if (caller.isAnonymous()) {
            return { reflections = []; authorNotes = []; games = []; vocabulary = []; shortMessages = [] };
        };
        FavouritesLib.getUserFavourites(userProfiles, caller);
    };
};
