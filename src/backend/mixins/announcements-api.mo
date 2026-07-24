import AccessControl "../authorization/access-control";
import AnnouncementsTypes "../types/announcements";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Array "mo:core/Array";

/// Public API mixin for the Announcements domain.
/// State slices injected: accessControlState, announcements map, nextId state, rotationInterval state.

mixin (
    accessControlState    : AccessControl.AccessControlState,
    announcements         : Map.Map<Nat, AnnouncementsTypes.Announcement>,
    announcementState     : { var nextId : Nat; var rotationInterval : Nat },
) {

    // ── Admin: Announcements CRUD ─────────────────────────────────────────────

    /// Add a new announcement. Admin-only. Returns the new announcement id.
    public shared ({ caller }) func addAnnouncement(title : Text, message : Text, url : ?Text) : async Nat {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: Only admins can add announcements");
        };
        let id = announcementState.nextId;
        announcementState.nextId += 1;
        let announcement : AnnouncementsTypes.Announcement = {
            id;
            title;
            message;
            url;
            createdAt = Time.now();
        };
        announcements.add(id, announcement);
        id;
    };

    /// Update an existing announcement. Admin-only. Returns true if found and updated.
    public shared ({ caller }) func updateAnnouncement(id : Nat, title : Text, message : Text, url : ?Text) : async Bool {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: Only admins can update announcements");
        };
        switch (announcements.get(id)) {
            case null { false };
            case (?existing) {
                announcements.add(id, { existing with title; message; url });
                true;
            };
        };
    };

    /// Remove an announcement by id. Admin-only. Returns true if found and removed.
    public shared ({ caller }) func removeAnnouncement(id : Nat) : async Bool {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: Only admins can remove announcements");
        };
        switch (announcements.get(id)) {
            case null { false };
            case (?_) {
                announcements.remove(id);
                true;
            };
        };
    };

    /// Get all announcements sorted by id ascending. Public.
    public query func getAnnouncements() : async [AnnouncementsTypes.Announcement] {
        let arr = announcements.entries().toArray();
        let sorted = arr.sort(func((aId, _), (bId, _)) = Nat.compare(aId, bId));
        sorted.map(func((_, a)) = a);
    };

    // ── Admin: Rotation interval ───────────────────────────────────────────────

    /// Set the global announcement rotation interval in seconds. Admin-only.
    /// Returns true on success.
    public shared ({ caller }) func setAnnouncementRotationInterval(seconds : Nat) : async Bool {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
            Runtime.trap("Unauthorized: Only admins can change rotation interval");
        };
        announcementState.rotationInterval := seconds;
        true;
    };

    /// Get the current announcement rotation interval in seconds. Public.
    public query func getAnnouncementRotationInterval() : async Nat {
        announcementState.rotationInterval;
    };
};
