import Types "../types/favourites";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Array "mo:core/Array";

/// Domain logic for user favourites.
/// All functions are pure / stateless — state is injected via the userProfiles map.
module {
    public type UserProfile       = Types.UserProfile;
    public type UserFavourites    = Types.UserFavourites;
    public type FavouriteItemType = Types.FavouriteItemType;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// Return an existing profile, or a default empty-favourites profile if none exists.
    public func getOrDefault(
        userProfiles : Map.Map<Principal, UserProfile>,
        caller       : Principal,
    ) : UserProfile {
        switch (userProfiles.get(caller)) {
            case (?profile) { profile };
            case null {
                {
                    name                   = "";
                    favouriteReflections   = [];
                    favouriteAuthorNotes   = [];
                    favouriteGames         = [];
                    favouriteVocabulary    = [];
                    favouriteShortMessages = [];
                }
            };
        };
    };

    // ── Add / Remove favourites ───────────────────────────────────────────────

    /// Add itemId to the caller's favourites list for the given itemType.
    /// Returns true if added, false if already present.
    public func addFavourite(
        userProfiles : Map.Map<Principal, UserProfile>,
        caller       : Principal,
        itemType     : FavouriteItemType,
        itemId       : Text,
    ) : Bool {
        let profile = getOrDefault(userProfiles, caller);
        switch itemType {
            case (#reflection) {
                let alreadyPresent = profile.favouriteReflections.find(func(id : Text) : Bool { id == itemId }) != null;
                if (alreadyPresent) return false;
                let updated : UserProfile = {
                    profile with
                    favouriteReflections = profile.favouriteReflections.concat([itemId]);
                };
                userProfiles.add(caller, updated);
                true;
            };
            case (#authorNote) {
                let alreadyPresent = profile.favouriteAuthorNotes.find(func(id : Text) : Bool { id == itemId }) != null;
                if (alreadyPresent) return false;
                let updated : UserProfile = {
                    profile with
                    favouriteAuthorNotes = profile.favouriteAuthorNotes.concat([itemId]);
                };
                userProfiles.add(caller, updated);
                true;
            };
            case (#game) {
                let alreadyPresent = profile.favouriteGames.find(func(id : Text) : Bool { id == itemId }) != null;
                if (alreadyPresent) return false;
                let updated : UserProfile = {
                    profile with
                    favouriteGames = profile.favouriteGames.concat([itemId]);
                };
                userProfiles.add(caller, updated);
                true;
            };
            case (#vocabulary) {
                let alreadyPresent = profile.favouriteVocabulary.find(func(id : Text) : Bool { id == itemId }) != null;
                if (alreadyPresent) return false;
                let updated : UserProfile = {
                    profile with
                    favouriteVocabulary = profile.favouriteVocabulary.concat([itemId]);
                };
                userProfiles.add(caller, updated);
                true;
            };
            case (#shortMessage) {
                let alreadyPresent = profile.favouriteShortMessages.find(func(id : Text) : Bool { id == itemId }) != null;
                if (alreadyPresent) return false;
                let updated : UserProfile = {
                    profile with
                    favouriteShortMessages = profile.favouriteShortMessages.concat([itemId]);
                };
                userProfiles.add(caller, updated);
                true;
            };
        };
    };

    /// Remove itemId from the caller's favourites list for the given itemType.
    /// Returns true if removed, false if not present.
    public func removeFavourite(
        userProfiles : Map.Map<Principal, UserProfile>,
        caller       : Principal,
        itemType     : FavouriteItemType,
        itemId       : Text,
    ) : Bool {
        let profile = getOrDefault(userProfiles, caller);
        switch itemType {
            case (#reflection) {
                let before = profile.favouriteReflections;
                let after  = before.filter(func(id : Text) : Bool { id != itemId });
                if (after.size() == before.size()) return false;
                userProfiles.add(caller, { profile with favouriteReflections = after });
                true;
            };
            case (#authorNote) {
                let before = profile.favouriteAuthorNotes;
                let after  = before.filter(func(id : Text) : Bool { id != itemId });
                if (after.size() == before.size()) return false;
                userProfiles.add(caller, { profile with favouriteAuthorNotes = after });
                true;
            };
            case (#game) {
                let before = profile.favouriteGames;
                let after  = before.filter(func(id : Text) : Bool { id != itemId });
                if (after.size() == before.size()) return false;
                userProfiles.add(caller, { profile with favouriteGames = after });
                true;
            };
            case (#vocabulary) {
                let before = profile.favouriteVocabulary;
                let after  = before.filter(func(id : Text) : Bool { id != itemId });
                if (after.size() == before.size()) return false;
                userProfiles.add(caller, { profile with favouriteVocabulary = after });
                true;
            };
            case (#shortMessage) {
                let before = profile.favouriteShortMessages;
                let after  = before.filter(func(id : Text) : Bool { id != itemId });
                if (after.size() == before.size()) return false;
                userProfiles.add(caller, { profile with favouriteShortMessages = after });
                true;
            };
        };
    };

    // ── Read favourites ───────────────────────────────────────────────────────

    /// Return all favourite lists for the caller.
    public func getUserFavourites(
        userProfiles : Map.Map<Principal, UserProfile>,
        caller       : Principal,
    ) : UserFavourites {
        let profile = getOrDefault(userProfiles, caller);
        {
            reflections   = profile.favouriteReflections;
            authorNotes   = profile.favouriteAuthorNotes;
            games         = profile.favouriteGames;
            vocabulary    = profile.favouriteVocabulary;
            shortMessages = profile.favouriteShortMessages;
        };
    };
};
