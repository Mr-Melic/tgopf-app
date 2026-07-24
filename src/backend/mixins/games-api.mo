import Types "../types/games";
import GamesLib "../lib/games";
import AccessControl "../authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

/// Public API mixin for the Games domain.
/// State slices are injected: games map, reactions map, comments map, accessControlState.
mixin (
    accessControlState : AccessControl.AccessControlState,
    games : Map.Map<Text, Types.Game>,
    gameReactions : Map.Map<Text, Map.Map<Text, Types.GameReaction>>,
    gameComments : Map.Map<Text, Types.GameComment>,
) {

    // ── Admin: Game CRUD ─────────────────────────────────────────────────────

    /// Add a new game. Admin-only. Returns the generated id.
    public shared ({ caller }) func addGame(
        title : Text,
        gameType : Text,
        playerCount : Text,
        materialsRequired : Text,
        imageUrl : ?Text,
        rules : [Text],
    ) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add games");
        };
        GamesLib.addGame(games, title, gameType, playerCount, materialsRequired, imageUrl, rules);
    };

    /// Update an existing game. Admin-only. Returns true on success.
    public shared ({ caller }) func updateGame(
        id : Text,
        title : Text,
        gameType : Text,
        playerCount : Text,
        materialsRequired : Text,
        imageUrl : ?Text,
        rules : ?[Text],
    ) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update games");
        };
        GamesLib.updateGame(games, id, title, gameType, playerCount, materialsRequired, imageUrl, rules);
    };

    /// Delete a game and cascade to its reactions and comments. Admin-only.
    public shared ({ caller }) func deleteGame(id : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete games");
        };
        GamesLib.deleteGame(games, gameReactions, gameComments, id);
    };

    // ── Public: Game Queries ─────────────────────────────────────────────────

    /// Return all games. Frontend is responsible for shuffling.
    public query func getGames() : async [Types.Game] {
        GamesLib.getGames(games);
    };

    // ── Logged-in: Reactions ─────────────────────────────────────────────────

    /// Toggle-react to a game. Authenticated (non-anonymous) callers only.
    /// Sending the same reaction removes it; a different reaction replaces the previous one.
    public shared ({ caller }) func reactToGame(gameId : Text, reaction : Types.GameReaction) : async Bool {
        if (caller.isAnonymous()) {
            Runtime.trap("Unauthorized: Must be logged in to react");
        };
        GamesLib.reactToGame(games, gameReactions, gameId, caller.toText(), reaction);
    };

    /// Get aggregated reaction counts for a game. Public.
    public query func getGameReactionCounts(gameId : Text) : async Types.GameReactionCounts {
        GamesLib.getReactionCounts(gameReactions, gameId);
    };

    /// Get the caller's current reaction for a game, or null. Public.
    public query ({ caller }) func getCallerGameReaction(gameId : Text) : async ?Types.GameReaction {
        GamesLib.getCallerReaction(gameReactions, gameId, caller.toText());
    };

    // ── Logged-in: Comments ──────────────────────────────────────────────────

    /// Add a comment under a game. Authenticated (non-anonymous) callers only.
    /// Returns the new comment id.
    public shared ({ caller }) func addGameComment(gameId : Text, commentText : Text) : async Text {
        if (caller.isAnonymous()) {
            Runtime.trap("Unauthorized: Must be logged in to comment");
        };
        if (commentText.size() == 0) {
            Runtime.trap("Comment text cannot be empty");
        };
        let authorName = caller.toText();
        GamesLib.addGameComment(gameComments, gameId, caller.toText(), authorName, commentText);
    };

    /// Delete a comment. Owner or admin may delete.
    public shared ({ caller }) func deleteGameComment(commentId : Text) : async Bool {
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);
        GamesLib.deleteGameComment(gameComments, commentId, caller.toText(), isAdmin);
    };

    /// Get all comments for a game. Public (readable by anyone).
    public query func getGameComments(gameId : Text) : async [Types.GameComment] {
        GamesLib.getGameComments(gameComments, gameId);
    };
};
