module {
    /// A single game block in the Experience Hub Games section.
    public type Game = {
        id : Text;
        title : Text;
        gameType : Text;
        playerCount : Text;
        materialsRequired : Text;
        imageUrl : ?Text;
        rules : [Text];
        createdAt : Int;
    };

    /// A reaction variant for a game — same shape as ReviewReaction.
    public type GameReaction = { #love; #like; #dislike; #laugh };

    /// A comment left by a logged-in user under a specific game.
    public type GameComment = {
        id : Text;
        gameId : Text;
        authorPrincipal : Text;
        authorName : Text;
        commentText : Text;
        createdAt : Int;
    };

    /// Aggregate reaction counts returned to the frontend.
    public type GameReactionCounts = {
        love : Nat;
        like : Nat;
        dislike : Nat;
        laugh : Nat;
    };
};
