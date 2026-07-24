// Migration for the content-products-reviews domain restructure.
//
// The previous migration already ran, so the CURRENTLY deployed actor (the
// `stable` section of .old/src/backend/dist/backend.most) already has:
//   - homepageTextBlocksAnnaBilingual   : {var value : BilingualHomepageTextBlocks}
//   - homepageTextBlocksEmilieBilingual : {var value : BilingualHomepageTextBlocks}
//   - products                          : Map<Text, Product>
//   - reviews                           : Map<Text, Review>  (Review already has starRating : ?Nat)
//
// It does NOT have firstProduct / secondProduct / homepageTextBlocksAnna /
// homepageTextBlocksEmilie — those were retired by the prior migration.
//
// The deployed type aliases (BilingualHomepageTextBlocks__667161996,
// Product__1065022864, Review__422344017) match the current
// Types.BilingualHomepageTextBlocks / Types.Product / Types.Review exactly,
// so this migration is a PURE PASSTHROUGH — no type transformation, no map
// over reviews, no re-seeding of products. OldActor mirrors the currently
// deployed stable fields; NewActor mirrors the current main.mo stable
// fields; run() forwards each field unchanged.
//
// OldReview is defined inline (with starRating) per the
// migrating-motoko-actors skill — `.old/` paths are not resolvable in the
// sandboxed compile environment.

import Map "mo:core/Map";
import Types "./types/content-products-reviews";

module {
    // ─── Old types (inline, copied from .old/src/backend/main.mo) ──────────────

    // Old Review — the previously deployed shape, WITH starRating (the prior
    // migration already added it). Identical to the current Review type, so
    // reviews pass through the migration unchanged (no map transformation).
    public type OldReview = {
        id : Text;
        reviewerName : Text;
        companyBlogSite : ?Text;
        bookTitle : Text;
        poemTitle : Text;
        poemSubTitle : Text;
        pageNumbers : Text;
        photoPath : ?Text;
        snippet : Text;
        fullText : Text;
        sourceLink : ?Text;
        videoUrl : ?Text;
        starRating : ?Nat;
        reactions : ?{
            love : Nat;
            like : Nat;
            dislike : Nat;
            laugh : Nat;
        };
    };

    // ─── New types (inline, matching the new actor's Review) ───────────────────

    // New Review — identical to OldReview. Kept as a separate alias so the
    // migration's domain/codomain types are self-documenting.
    public type NewReview = {
        id : Text;
        reviewerName : Text;
        companyBlogSite : ?Text;
        bookTitle : Text;
        poemTitle : Text;
        poemSubTitle : Text;
        pageNumbers : Text;
        photoPath : ?Text;
        snippet : Text;
        fullText : Text;
        sourceLink : ?Text;
        videoUrl : ?Text;
        starRating : ?Nat;
        reactions : ?{
            love : Nat;
            like : Nat;
            dislike : Nat;
            laugh : Nat;
        };
    };

    // ─── OldActor: every stable field from the previously deployed actor ───────
    // Field names and types mirror .old/src/backend/dist/backend.most.
    // `var` vs `let` mutability matches the old declarations so the upgrade
    // checker accepts the domain.
    public type OldActor = {
        _btcCacheTtlNs : Int;
        _btcFallbackRate : Float;
        _cryptoCacheTtlNs : Int;
        var _dailyCheckNs : Int;
        _ethFallbackRate : Float;
        _icpFallbackRate : Float;
        _unifiedCryptoCache : {
            var btcRate : Float;
            var ethRate : Float;
            var fetchedAt : Int;
            var icpRate : Float;
        };
        accessControlState : {
            var adminAssigned : Bool;
            userRoles : Map.Map<Principal, { #admin; #guest; #user }>;
        };
        var activeBackgroundMusicTrack : ?Text;
        var adImages : [{
            id : Nat;
            sectionId : Text;
            fileKey : Text;
            sortOrder : Nat;
        }];
        amazonRegions : Map.Map<Text, AmazonRegion>;
        amazonRegionsAnna : Map.Map<Text, AmazonRegion>;
        amazonRegionsEmilie : Map.Map<Text, AmazonRegion>;
        amazonRegionsTopf : Map.Map<Text, AmazonRegion>;
        annaAmazonState : { var enabled : Bool };
        announcementState : { var nextId : Nat; var rotationInterval : Nat };
        announcementsMap : Map.Map<Nat, Announcement>;
        artProducts : Map.Map<Text, ArtProduct>;
        authorNoteReactions : Map.Map<Text, Map.Map<Text, { #dislike; #laugh; #like; #love }>>;
        authorNotes : Map.Map<Text, AuthorNote>;
        var backgroundMusicEnabled : Bool;
        var backgroundMusicPlaylist : [Text];
        var backgroundMusicPlaylistIndex : Nat;
        var backgroundMusicSettings : {
            fadeInDuration : Nat;
            fadeOutDuration : Nat;
            shouldLoop : Bool;
            volume : Nat;
        };
        backgroundMusicTracks : Map.Map<Text, BackgroundMusicTrack>;
        blobRegistry : {
            var authorizedPrincipals : [Principal];
            blobsToRemove : Map.Map<Text, Bool>;
            references : Map.Map<Text, FileReference>;
        };
        bookInflation : {
            id : Text;
            basePrice : Float;
            currentPrice : Float;
            inflationRatePercent : Float;
            lastAppliedYear : Int;
            history : [InflationHistoryEntry];
        };
        bookSales : Map.Map<Nat, BookSale>;
        btcConfig : { var contactEmail : Text; var walletAddress : Text };
        btcRateCache : { var fetchedAt : Int; var rate : Float };
        var copyrightLegalText : Text;
        var copyrightLine : Text;
        var copyrightStartYear : Nat;
        var copyrightYearColor : Text;
        cryptoSystemState : { var enabled : Bool };
        var currentReviewNumber : Nat;
        dictionaryEntries : Map.Map<Text, DictionaryEntry>;
        donationsMap : Map.Map<Text, DonationEntry>;
        emilieAmazonState : { var enabled : Bool };
        var emojiRatioConfig : {
            dislikeMax : Nat;
            dislikeMin : Nat;
            laughMax : Nat;
            laughMin : Nat;
            likeMax : Nat;
            likeMin : Nat;
            loveMax : Nat;
            loveMin : Nat;
        };
        emojiSystemState : { var enabled : Bool };
        ethConfig : { var walletAddress : Text };
        ethRateCache : { var fetchedAt : Int; var rate : Float };
        experienceChallenges : Map.Map<Text, ExperienceChallenge>;
        var experienceHubTexts : {
            gamesCardDescription : Text;
            gamesPageSubtitle : Text;
            mainSubtitle : Text;
            retailCardDescription : Text;
            retailPageSubtitle : Text;
            socialCardDescription : Text;
            socialPageSubtitle : Text;
        };
        var footerSettings : {
            businessAddress : Text;
            businessEmail : Text;
            businessIban : Text;
            businessKvk : Text;
            businessName : Text;
            businessPhone : Text;
            businessTaxId : Text;
            footerCaption : Text;
        };
        var galleryCarouselPhotosMap : Map.Map<Text, GalleryCarouselPhoto>;
        gameComments : Map.Map<Text, GameComment>;
        gameReactions : Map.Map<Text, Map.Map<Text, { #dislike; #laugh; #like; #love }>>;
        games : Map.Map<Text, Game>;
        var homepageTextBlocks : {
            block1 : TextBlock;
            block2 : TextBlock;
            block3 : TextBlock;
        };
        homepageTextBlocksAnnaBilingual : { var value : Types.BilingualHomepageTextBlocks };
        homepageTextBlocksEmilieBilingual : { var value : Types.BilingualHomepageTextBlocks };
        icpConfig : { var walletAddress : Text };
        icpRateCache : { var fetchedAt : Int; var rate : Float };
        var manualDistributionCounts : Map.Map<Text, Nat>;
        var modelPhotoPanels : [{ panelId : Nat; images : [Text] }];
        newsletterSubscribers : Map.Map<Text, NewsletterSubscriber>;
        var nextAdImageId : Nat;
        paymentCountries : Map.Map<Text, PaymentCountry>;
        paymentOptions : Map.Map<Text, PaymentOption>;
        policies : Map.Map<PolicyType, PolicyContent>;
        products : Map.Map<Text, Types.Product>;
        reflectionBlockReactions : Map.Map<Text, Map.Map<Text, { #dislike; #laugh; #like; #love }>>;
        reflectionBlocks : Map.Map<Text, ReflectionBlock>;
        retailLeaderboard : Map.Map<Text, LeaderboardEntry>;
        reviewEmojiV2Counts : Map.Map<Text, { dislike : Nat; laugh : Nat; like : Nat; love : Nat }>;
        reviewEmojiV2UserVotes : Map.Map<Text, Map.Map<Text, Text>>;
        reviewMilestones : Map.Map<Nat, ReviewMilestone>;
        reviewReactions : Map.Map<Text, Map.Map<Text, { #dislike; #laugh; #like; #love }>>;
        reviews : Map.Map<Text, OldReview>;
        rewardAvailableCount : Map.Map<Text, Nat>;
        rewardClaimEmail : Map.Map<Text, Text>;
        rewards : Map.Map<Text, Reward>;
        sharedPaymentLogos : Map.Map<Text, SharedPaymentLogo>;
        shippingInflation : {
            id : Text;
            basePrice : Float;
            currentPrice : Float;
            inflationRatePercent : Float;
            lastAppliedYear : Int;
            history : [InflationHistoryEntry];
        };
        shortMessages : Map.Map<Text, ShortMessage>;
        socialLeaderboard : Map.Map<Text, LeaderboardEntry>;
        var submitProofEmail : Text;
        taxRecords : Map.Map<QuarterKey, TaxRecord>;
        userProfiles : Map.Map<Principal, UserProfile>;
        userReactionCounts : Map.Map<Text, Nat>;
        visitorCount : Nat;
    };

    // ─── NewActor: only the fields whose type/shape changed ───────────────────
    // Produced by the migration as a PURE PASSTHROUGH — the deployed actor
    // already has these four fields with identical types, so run() forwards
    // each one unchanged:
    //   - reviews                            : Map<Text, Review> (unchanged)
    //   - homepageTextBlocksEmilieBilingual  : {var value : BilingualHomepageTextBlocks}
    //   - homepageTextBlocksAnnaBilingual    : {var value : BilingualHomepageTextBlocks}
    //   - products                           : Map<Text, Product> (unchanged)
    // All other stable fields are inherited from the old actor unchanged,
    // and any new fields not listed here are initialized by their own
    // declarations on upgrade.
    public type NewActor = {
        reviews : Map.Map<Text, NewReview>;
        homepageTextBlocksEmilieBilingual : { var value : Types.BilingualHomepageTextBlocks };
        homepageTextBlocksAnnaBilingual : { var value : Types.BilingualHomepageTextBlocks };
        products : Map.Map<Text, Types.Product>;
    };

    // ─── Migration function ───────────────────────────────────────────────────
    // Pure and trap-free: pure passthrough. The deployed actor already has
    // these four fields with identical types, so each is forwarded unchanged.
    // No map transformation, no re-seeding, no record reconstruction.
    public func run(old : OldActor) : NewActor {
        {
            // reviews: deployed Review type already has starRating : ?Nat and
            // matches the current Review type exactly, so pass through directly
            // (no map transformation needed).
            reviews = old.reviews;
            homepageTextBlocksEmilieBilingual = { var value = old.homepageTextBlocksEmilieBilingual.value };
            homepageTextBlocksAnnaBilingual = { var value = old.homepageTextBlocksAnnaBilingual.value };
            products = old.products;
        };
    };

    // ─── Inline type aliases used by OldActor ──────────────────────────────────
    // These mirror the field-level types from .old/src/backend/dist/backend.most.
    // Defined after OldActor to keep the record declaration readable; Motoko
    // allows forward references to type aliases within a module.

    public type AmazonRegion = {
        country : Text;
        currencySymbol : Text;
        domain : Text;
        enabled : Bool;
        hardcoverButtonColor : Text;
        hardcoverButtonText : Text;
        hardcoverFontColor : Text;
        hardcoverLink : Text;
        hardcoverPrice : Text;
        id : Text;
        kindleButtonColor : Text;
        kindleButtonText : Text;
        kindleFontColor : Text;
        kindleLink : Text;
        kindlePrice : Text;
        paperbackButtonColor : Text;
        paperbackButtonText : Text;
        paperbackFontColor : Text;
        paperbackLink : Text;
        paperbackPrice : Text;
        showKindleUnlimited : Bool;
    };

    public type Announcement = {
        createdAt : Int;
        id : Nat;
        message : Text;
        title : Text;
        url : ?Text;
    };

    public type ArtProduct = {
        id : Text;
        imagePath : ?Text;
        purchaseLink : Text;
        title : Text;
    };

    public type AuthorNote = {
        id : Text;
        noteText : Text;
        poemSubtitle : Text;
        poemTitle : Text;
        reactions : { dislike : Nat; laugh : Nat; like : Nat; love : Nat };
    };

    public type BackgroundMusicTrack = {
        artist : Text;
        isActive : Bool;
        path : Text;
        title : Text;
        uploadTimestamp : Int;
    };

    public type BookSale = {
        bookNumber : Nat;
        customerName : ?Text;
        salesAmount : Nat;
    };

    public type DictionaryEntry = {
        etymology : Text;
        examples : Text;
        meaning : Text;
        word : Text;
    };

    public type DonationEntry = {
        address : Text;
        column : Nat;
        id : Text;
        name : Text;
        position : Nat;
    };

    public type ExperienceChallenge = {
        category : { #retail; #social };
        description : Text;
        id : Text;
        rewardPoints : Nat;
        specialReward : ?Text;
        title : Text;
    };

    public type FileReference = {
        hash : Text;
        path : Text;
    };

    public type GalleryCarouselPhoto = {
        id : Text;
        linkUrl : Text;
        path : Text;
        side : Text;
        sortOrder : Nat;
    };

    public type GameComment = {
        authorName : Text;
        authorPrincipal : Text;
        commentText : Text;
        createdAt : Int;
        gameId : Text;
        id : Text;
    };

    public type Game = {
        createdAt : Int;
        gameType : Text;
        id : Text;
        imageUrl : ?Text;
        materialsRequired : Text;
        playerCount : Text;
        rules : [Text];
        title : Text;
    };

    public type InflationHistoryEntry = {
        appliedAt : Int;
        newPrice : Float;
        oldPrice : Float;
        ratePercent : Float;
        year : Int;
    };

    public type LeaderboardEntry = {
        id : Text;
        name : Text;
        photoPath : ?Text;
        score : Nat;
    };

    public type NewsletterSubscriber = {
        email : Text;
        principalId : Text;
        subscribedAt : Int;
    };

    public type PaymentCountry = {
        continent : Text;
        enabled : Bool;
        id : Text;
        name : Text;
        sortOrder : Nat;
    };

    public type PaymentOption = {
        buttonColor : Text;
        buzzingEnabled : Bool;
        countryId : Text;
        enabled : Bool;
        fontColor : Text;
        id : Text;
        link : Text;
        logoStorageKey : Text;
        logoUrl : Text;
        methodName : Text;
        priceEuro : Text;
        shippingEuro : Text;
        sortOrder : Nat;
    };

    public type PolicyContent = {
        content : Text;
        policyType : PolicyType;
        title : Text;
    };

    public type PolicyType = {
        #cookiePolicy;
        #disclaimerLiability;
        #intellectualProperty;
        #privacyPolicy;
        #promotionalTerms;
        #refundAndReturn;
        #shippingAndDelivery;
        #termsAndConditions;
    };

    public type Product = {
        description : Text;
        editionType : Text;
        frontCoverImagePath : ?Text;
        hasCustomImage : Bool;
        id : Text;
        images : [Text];
        price : Nat;
        title : Text;
    };

    public type QuarterKey = {
        quarter : { #q1; #q2; #q3; #q4 };
        year : Nat;
    };

    public type TaxRecord = {
        quarter : { #q1; #q2; #q3; #q4 };
        salesAmount : Nat;
        taxAmount : Nat;
        year : Nat;
    };

    public type ReflectionBlock = {
        id : Text;
        poemTitle : Text;
        reactions : ?{ dislike : Nat; laugh : Nat; like : Nat; love : Nat };
        reflectionChallenges : [Text];
    };

    public type ReviewMilestone = {
        milestone : Nat;
        prizeImagePath : ?Text;
    };

    public type Reward = {
        amount : Nat;
        description : Text;
        id : Text;
        pageType : { #retail; #social };
        photoPath : ?Text;
        rewardType : { #other; #points; #referral };
    };

    public type SharedPaymentLogo = {
        id : Text;
        logoStorageKey : Text;
        logoUrl : Text;
        name : Text;
    };

    public type ShortMessage = {
        createdAt : Int;
        id : Text;
        text : Text;
    };

    public type TextBlock = {
        content : Text;
        title : Text;
    };

    public type UserProfile = {
        favouriteAuthorNotes : [Text];
        favouriteGames : [Text];
        favouriteReflections : [Text];
        favouriteShortMessages : [Text];
        favouriteVocabulary : [Text];
        name : Text;
    };
};
