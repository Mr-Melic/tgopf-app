import Types "../types/games";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import List "mo:core/List";

/// Domain logic for the Games section of the Experience Hub.
/// All functions are pure / stateless — state is injected via parameters.
module {
    public type Game = Types.Game;
    public type GameReaction = Types.GameReaction;
    public type GameComment = Types.GameComment;
    public type GameReactionCounts = Types.GameReactionCounts;

    // ── Helpers ──────────────────────────────────────────────────────────────

    /// Generate a time-based id string.
    public func newId(prefix : Text) : Text {
        prefix # "-" # Time.now().toText();
    };

    // ── Games CRUD ───────────────────────────────────────────────────────────

    /// Create a new Game record and insert it into the map.
    public func addGame(
        games : Map.Map<Text, Game>,
        title : Text,
        gameType : Text,
        playerCount : Text,
        materialsRequired : Text,
        imageUrl : ?Text,
        rules : [Text],
    ) : Text {
        let id = newId("game");
        let game : Game = {
            id;
            title;
            gameType;
            playerCount;
            materialsRequired;
            imageUrl;
            rules;
            createdAt = Time.now();
        };
        games.add(id, game);
        id;
    };

    /// Update an existing game; returns false if not found.
    public func updateGame(
        games : Map.Map<Text, Game>,
        id : Text,
        title : Text,
        gameType : Text,
        playerCount : Text,
        materialsRequired : Text,
        imageUrl : ?Text,
        rules : ?[Text],
    ) : Bool {
        switch (games.get(id)) {
            case null { false };
            case (?existing) {
                let updatedRules = switch (rules) { case (?r) { r }; case null { existing.rules } };
                games.add(id, { existing with title; gameType; playerCount; materialsRequired; imageUrl; rules = updatedRules });
                true;
            };
        };
    };

    /// Delete a game (and cascade to its reactions / comments); returns false if not found.
    public func deleteGame(
        games : Map.Map<Text, Game>,
        gameReactions : Map.Map<Text, Map.Map<Text, GameReaction>>,
        gameComments : Map.Map<Text, GameComment>,
        id : Text,
    ) : Bool {
        switch (games.get(id)) {
            case null { false };
            case (?_) {
                games.remove(id);
                gameReactions.remove(id);
                // Remove all comments belonging to this game
                let toDelete = List.empty<Text>();
                for ((commentId, comment) in gameComments.entries()) {
                    if (comment.gameId == id) { toDelete.add(commentId) };
                };
                for (commentId in toDelete.values()) {
                    gameComments.remove(commentId);
                };
                true;
            };
        };
    };

    /// Return all games as an array (frontend shuffles).
    public func getGames(games : Map.Map<Text, Game>) : [Game] {
        games.values().toArray();
    };

    // ── Reactions ────────────────────────────────────────────────────────────

    /// Toggle-react: same reaction removes it, different reaction replaces it.
    /// Returns false if the game does not exist.
    public func reactToGame(
        games : Map.Map<Text, Game>,
        gameReactions : Map.Map<Text, Map.Map<Text, GameReaction>>,
        gameId : Text,
        callerText : Text,
        reaction : GameReaction,
    ) : Bool {
        switch (games.get(gameId)) {
            case null { false };
            case (?_) {
                let reactionMap : Map.Map<Text, GameReaction> = switch (gameReactions.get(gameId)) {
                    case null {
                        let m = Map.empty<Text, GameReaction>();
                        gameReactions.add(gameId, m);
                        m;
                    };
                    case (?m) { m };
                };
                switch (reactionMap.get(callerText)) {
                    case (?prev) {
                        if (prev == reaction) {
                            // Same reaction — toggle off
                            reactionMap.remove(callerText);
                        } else {
                            // Different reaction — replace
                            reactionMap.add(callerText, reaction);
                        };
                    };
                    case null {
                        reactionMap.add(callerText, reaction);
                    };
                };
                true;
            };
        };
    };

    /// Build aggregate counts for a game from raw storage.
    public func getReactionCounts(
        gameReactions : Map.Map<Text, Map.Map<Text, GameReaction>>,
        gameId : Text,
    ) : GameReactionCounts {
        switch (gameReactions.get(gameId)) {
            case null { { love = 0; like = 0; dislike = 0; laugh = 0 } };
            case (?reactionMap) {
                var love : Nat = 0;
                var like : Nat = 0;
                var dislike : Nat = 0;
                var laugh : Nat = 0;
                for ((_, r) in reactionMap.entries()) {
                    switch r {
                        case (#love) { love += 1 };
                        case (#like) { like += 1 };
                        case (#dislike) { dislike += 1 };
                        case (#laugh) { laugh += 1 };
                    };
                };
                { love; like; dislike; laugh };
            };
        };
    };

    /// Return the caller's current reaction for a game, or null.
    public func getCallerReaction(
        gameReactions : Map.Map<Text, Map.Map<Text, GameReaction>>,
        gameId : Text,
        callerText : Text,
    ) : ?GameReaction {
        switch (gameReactions.get(gameId)) {
            case null { null };
            case (?reactionMap) { reactionMap.get(callerText) };
        };
    };

    // ── Comments ─────────────────────────────────────────────────────────────

    /// Add a comment from an authenticated user; returns the new comment id.
    public func addGameComment(
        gameComments : Map.Map<Text, GameComment>,
        gameId : Text,
        callerText : Text,
        authorName : Text,
        commentText : Text,
    ) : Text {
        let id = newId("comment");
        let comment : GameComment = {
            id;
            gameId;
            authorPrincipal = callerText;
            authorName;
            commentText;
            createdAt = Time.now();
        };
        gameComments.add(id, comment);
        id;
    };

    /// Delete a comment; only the owner or an admin may delete.
    /// Returns false if not found or not authorised.
    public func deleteGameComment(
        gameComments : Map.Map<Text, GameComment>,
        commentId : Text,
        callerText : Text,
        isAdmin : Bool,
    ) : Bool {
        switch (gameComments.get(commentId)) {
            case null { false };
            case (?comment) {
                if (isAdmin or comment.authorPrincipal == callerText) {
                    gameComments.remove(commentId);
                    true;
                } else {
                    false;
                };
            };
        };
    };

    /// Return all comments for a given game.
    public func getGameComments(
        gameComments : Map.Map<Text, GameComment>,
        gameId : Text,
    ) : [GameComment] {
        gameComments.values().toArray().filter(func(c : GameComment) : Bool {
            c.gameId == gameId
        });
    };
};
