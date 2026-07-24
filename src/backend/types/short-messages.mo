module {
    /// A tweet-sized message managed by the admin.
    /// Text is capped at 280 characters by convention (enforced in the API layer).
    public type ShortMessage = {
        id        : Text;
        text      : Text;
        createdAt : Int;
    };
};
