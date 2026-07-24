import AmazonRegionTypes "./amazon-regions";

module {
    // A keyed store of per-book Amazon region maps.
    // Valid book keys: "topf", "emilie", "anna", "anna-song", "emilie-nl"
    public type BookKey = Text;

    public type MultiBookRegionState = {
        topf       : [AmazonRegionTypes.AmazonRegion];
        emilie     : [AmazonRegionTypes.AmazonRegion];
        anna       : [AmazonRegionTypes.AmazonRegion];
        annaSong   : [AmazonRegionTypes.AmazonRegion];
        emilieNl   : [AmazonRegionTypes.AmazonRegion];
    };
};
