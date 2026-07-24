module {
    public type Announcement = {
        id : Nat;
        title : Text;
        message : Text;
        url : ?Text;
        createdAt : Int;
    };
};
