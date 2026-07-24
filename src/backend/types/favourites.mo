module {
    /// The set of item IDs a user has favourited, grouped by domain.
    /// All arrays default to empty when a UserProfile is first migrated.
    public type UserFavourites = {
        reflections    : [Text];
        authorNotes    : [Text];
        games          : [Text];
        vocabulary     : [Text];
        shortMessages  : [Text];
    };

    /// Extended UserProfile that includes favourites.
    /// New fields default to [] via migration; existing profiles without them
    /// are treated as having empty arrays.
    public type UserProfile = {
        name                     : Text;
        favouriteReflections     : [Text];
        favouriteAuthorNotes     : [Text];
        favouriteGames           : [Text];
        favouriteVocabulary      : [Text];
        favouriteShortMessages   : [Text];
    };

    /// The item-type discriminator accepted by the favourites API.
    public type FavouriteItemType = {
        #reflection;
        #authorNote;
        #game;
        #vocabulary;
        #shortMessage;
    };
};
