import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaymentCountry {
    id: string;
    sortOrder: bigint;
    name: string;
    continent: string;
    enabled: boolean;
}
export interface LeaderboardEntry {
    id: string;
    photoPath?: string;
    name: string;
    score: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Game {
    id: string;
    title: string;
    createdAt: bigint;
    playerCount: string;
    imageUrl?: string;
    gameType: string;
    materialsRequired: string;
    rules: Array<string>;
}
export interface FooterSettings {
    businessKvk: string;
    businessIban: string;
    businessName: string;
    businessEmail: string;
    businessAddress: string;
    footerCaption: string;
    businessPhone: string;
    businessTaxId: string;
}
export interface ExperienceChallenge {
    id: string;
    title: string;
    specialReward?: string;
    rewardPoints: bigint;
    description: string;
    category: ChallengeCategory;
}
export interface BookSale {
    customerName?: string;
    salesAmount: bigint;
    bookNumber: bigint;
}
export interface BackgroundMusicTrack {
    title: string;
    path: string;
    uploadTimestamp: bigint;
    isActive: boolean;
    artist: string;
}
export interface GalleryCarouselPhoto {
    id: string;
    linkUrl: string;
    sortOrder: bigint;
    path: string;
    side: string;
}
export interface ReflectionBlock {
    id: string;
    poemTitle: string;
    reactions?: {
        like: bigint;
        love: bigint;
        laugh: bigint;
        dislike: bigint;
    };
    reflectionChallenges: Array<string>;
}
export interface ArtProduct {
    id: string;
    title: string;
    imagePath?: string;
    purchaseLink: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface RewardInput {
    id: string;
    photoPath?: string;
    pageType: Variant_retail_social;
    description: string;
    availableCount?: bigint;
    rewardType: Variant_referral_other_points;
    claimEmail?: string;
    amount: bigint;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface UserFavourites {
    shortMessages: Array<string>;
    authorNotes: Array<string>;
    reflections: Array<string>;
    games: Array<string>;
    vocabulary: Array<string>;
}
export interface GameComment {
    id: string;
    createdAt: bigint;
    authorName: string;
    gameId: string;
    commentText: string;
    authorPrincipal: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface FileReference {
    hash: string;
    path: string;
}
export interface SharedPaymentLogo {
    id: string;
    name: string;
    logoStorageKey: string;
    logoUrl: string;
}
export interface RewardFull {
    id: string;
    photoPath?: string;
    pageType: Variant_retail_social;
    description: string;
    availableCount?: bigint;
    rewardType: Variant_referral_other_points;
    claimEmail?: string;
    amount: bigint;
}
export interface ReviewMilestone {
    prizeImagePath?: string;
    milestone: bigint;
}
export interface Review {
    id: string;
    bookTitle: string;
    photoPath?: string;
    starRating?: bigint;
    pageNumbers: string;
    fullText: string;
    reviewerName: string;
    snippet: string;
    sourceLink?: string;
    poemSubTitle: string;
    poemTitle: string;
    companyBlogSite?: string;
    videoUrl?: string;
    reactions?: {
        like: bigint;
        love: bigint;
        laugh: bigint;
        dislike: bigint;
    };
}
export interface PolicyContent {
    title: string;
    content: string;
    policyType: PolicyType;
}
export interface ExperienceHubTexts {
    mainSubtitle: string;
    socialPageSubtitle: string;
    retailCardDescription: string;
    gamesPageSubtitle: string;
    retailPageSubtitle: string;
    socialCardDescription: string;
    gamesCardDescription: string;
}
export interface GameReactionCounts {
    like: bigint;
    love: bigint;
    laugh: bigint;
    dislike: bigint;
}
export interface EmojiBreakdown {
    userLike: bigint;
    userLove: bigint;
    userLaugh: bigint;
    autoLike: bigint;
    autoLove: bigint;
    autoLaugh: bigint;
    userDislike: bigint;
    autoDislike: bigint;
}
export interface TaxRecord {
    salesAmount: bigint;
    quarter: Quarter;
    year: bigint;
    taxAmount: bigint;
}
export interface BolBanner {
    imagePath: string;
    link: string;
}
export interface AmazonRegion {
    id: string;
    country: string;
    domain: string;
    kindleLink: string;
    currencySymbol: string;
    paperbackButtonText: string;
    hardcoverButtonText: string;
    kindleButtonColor: string;
    paperbackPrice: string;
    enabled: boolean;
    hardcoverButtonColor: string;
    hardcoverLink: string;
    kindleButtonText: string;
    kindleFontColor: string;
    paperbackLink: string;
    showKindleUnlimited: boolean;
    hardcoverPrice: string;
    paperbackFontColor: string;
    paperbackButtonColor: string;
    hardcoverFontColor: string;
    kindlePrice: string;
}
export interface DictionaryEntry {
    meaning: string;
    word: string;
    etymology: string;
    examples: string;
}
export interface ShortMessage {
    id: string;
    createdAt: bigint;
    text: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface TextBlock {
    title: string;
    content: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface EmojiRatioConfig {
    loveMax: bigint;
    loveMin: bigint;
    laughMax: bigint;
    laughMin: bigint;
    likeMax: bigint;
    likeMin: bigint;
    dislikeMax: bigint;
    dislikeMin: bigint;
}
export interface DonationEntry {
    id: string;
    name: string;
    address: string;
    column: bigint;
    position: bigint;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface BackgroundMusicState {
    musicEnabled: boolean;
    tracks: Array<BackgroundMusicTrack>;
    playlist: Array<string>;
    currentPlaylistIndex: bigint;
    activeTrack?: string;
    settings: {
        volume: bigint;
        fadeOutDuration: bigint;
        shouldLoop: boolean;
        fadeInDuration: bigint;
    };
}
export interface AuthorNote {
    id: string;
    poemSubtitle: string;
    noteText: string;
    poemTitle: string;
    reactions: {
        like: bigint;
        love: bigint;
        laugh: bigint;
        dislike: bigint;
    };
}
export interface Announcement {
    id: bigint;
    url?: string;
    title: string;
    createdAt: bigint;
    message: string;
}
export interface HomepageTextBlocks {
    block1: TextBlock;
    block2: TextBlock;
    block3: TextBlock;
}
export interface NewsletterSubscriber {
    subscribedAt: bigint;
    email: string;
    principalId: string;
}
export interface PaymentOption {
    id: string;
    methodName: string;
    sortOrder: bigint;
    link: string;
    logoStorageKey: string;
    countryId: string;
    enabled: boolean;
    logoUrl: string;
    shippingEuro: string;
    buttonColor: string;
    priceEuro: string;
    fontColor: string;
    buzzingEnabled: boolean;
}
export interface Product {
    id: string;
    title: string;
    hasCustomImage: boolean;
    description: string;
    editionType: string;
    price: bigint;
    frontCoverImagePath?: string;
    images: Array<string>;
}
export interface UserProfile {
    favouriteReflections: Array<string>;
    name: string;
    favouriteVocabulary: Array<string>;
    favouriteShortMessages: Array<string>;
    favouriteGames: Array<string>;
    favouriteAuthorNotes: Array<string>;
}
export enum AuthorNoteReaction {
    like = "like",
    love = "love",
    laugh = "laugh",
    dislike = "dislike"
}
export enum PolicyType {
    refundAndReturn = "refundAndReturn",
    privacyPolicy = "privacyPolicy",
    shippingAndDelivery = "shippingAndDelivery",
    termsAndConditions = "termsAndConditions",
    disclaimerLiability = "disclaimerLiability",
    cookiePolicy = "cookiePolicy",
    intellectualProperty = "intellectualProperty",
    promotionalTerms = "promotionalTerms"
}
export enum Quarter {
    q1 = "q1",
    q2 = "q2",
    q3 = "q3",
    q4 = "q4"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_left_right {
    left = "left",
    right = "right"
}
export enum Variant_referral_other_points {
    referral = "referral",
    other = "other",
    points = "points"
}
export enum Variant_retail_social {
    retail = "retail",
    social = "social"
}
export interface backendInterface {
    addAmazonRegion(region: AmazonRegion): Promise<void>;
    addAnnouncement(title: string, message: string, url: string | null): Promise<bigint>;
    addArtProduct(artProduct: ArtProduct): Promise<void>;
    addAuthorNote(poemTitle: string, poemSubtitle: string, noteText: string): Promise<{
        __kind__: "ok";
        ok: AuthorNote;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addBookSale(sale: BookSale): Promise<void>;
    addChallenge(category: ChallengeCategory, title: string, description: string, rewardPoints: bigint, specialReward: string | null): Promise<{
        __kind__: "ok";
        ok: ExperienceChallenge;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addDictionaryEntry(entry: DictionaryEntry): Promise<void>;
    addDonation(name: string, address: string, column: bigint, position: bigint): Promise<string>;
    addFavourite(itemType: string, itemId: string): Promise<boolean>;
    addGame(title: string, gameType: string, playerCount: string, materialsRequired: string, imageUrl: string | null, rules: Array<string>): Promise<string>;
    addGameComment(gameId: string, commentText: string): Promise<string>;
    addPaymentCountry(country: PaymentCountry): Promise<boolean>;
    addPaymentOption(option: PaymentOption): Promise<boolean>;
    addReflectionBlock(block: ReflectionBlock): Promise<void>;
    addRetailLeaderboardEntry(entry: LeaderboardEntry): Promise<void>;
    addReview(review: Review): Promise<void>;
    addReviewMilestone(milestone: ReviewMilestone): Promise<void>;
    addReward(reward: RewardInput): Promise<void>;
    addSharedPaymentLogo(logo: SharedPaymentLogo): Promise<boolean>;
    addShortMessage(text: string): Promise<{
        __kind__: "ok";
        ok: ShortMessage;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addSocialLeaderboardEntry(entry: LeaderboardEntry): Promise<void>;
    addTaxRecord(record: TaxRecord): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateTax(numberOfBooksSold: bigint): Promise<string>;
    createEmissionEffectAnimation(numRows: bigint, durationMs: bigint, leftMargin: bigint, rightMargin: bigint, expandFactor: bigint): Promise<{
        animationId: bigint;
    }>;
    deactivateBackgroundMusicTrack(trackPath: string): Promise<void>;
    deleteAmazonRegion(regionId: string): Promise<void>;
    deleteArtProduct(artProductId: string): Promise<void>;
    deleteAuthorNote(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteBookSale(bookNumber: bigint): Promise<void>;
    deleteChallenge(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteDictionaryEntry(word: string): Promise<void>;
    deleteDonation(id: string): Promise<boolean>;
    deleteGalleryCarouselPhoto(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteGame(id: string): Promise<boolean>;
    deleteGameComment(commentId: string): Promise<boolean>;
    deletePaymentCountry(id: string): Promise<boolean>;
    deletePaymentOption(id: string): Promise<boolean>;
    deleteReflectionBlock(blockId: string): Promise<void>;
    deleteRetailLeaderboardEntry(entryId: string): Promise<void>;
    deleteReview(reviewId: string): Promise<void>;
    deleteReviewMilestone(milestone: bigint): Promise<void>;
    deleteReward(rewardId: string): Promise<void>;
    deleteSharedPaymentLogo(id: string): Promise<boolean>;
    deleteShortMessage(id: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteSocialLeaderboardEntry(entryId: string): Promise<void>;
    deleteTaxRecord(year: bigint, quarter: Quarter): Promise<void>;
    /**
     * / Admin-only: manually distribute totalAmount emoji reactions across all items
     * / in the given section, randomly within the configured ratio ranges.
     * / Adds to existing counts — never replaces or removes existing data.
     * / section: "reviews" | "challenges" | "authorNotes" | "games"
     */
    distributeEmojiManually(section: string, totalAmount: bigint): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    ensureBitcoinForAllCountries(): Promise<void>;
    ensureCreditcardForAllCountries(): Promise<void>;
    ensureEthereumForAllCountries(): Promise<void>;
    ensureIcpForAllCountries(): Promise<void>;
    execute(qJson: string): Promise<Result>;
    getActiveBackgroundMusicTrack(): Promise<string | null>;
    getAllFileReferences(): Promise<Array<FileReference>>;
    getAmazonRegion(regionId: string): Promise<AmazonRegion | null>;
    getAmazonRegionForBook(bookKey: string, regionId: string): Promise<AmazonRegion | null>;
    getAmazonRegions(): Promise<Array<AmazonRegion>>;
    getAmazonRegionsByBook(bookKey: string): Promise<Array<AmazonRegion>>;
    /**
     * / Query: is the Amazon region payment section enabled for Anna?
     */
    getAnnaAmazonEnabled(): Promise<boolean>;
    /**
     * / Query: is the Amazon region payment section enabled for
     * / "The Song of Anna the Mermaid" 1st edition?
     */
    getAnnaSongAmazonEnabled(): Promise<boolean>;
    getAnnouncementRotationInterval(): Promise<bigint>;
    getAnnouncements(): Promise<Array<Announcement>>;
    getApproximateBtcAmount(_eurAmount: number): Promise<number>;
    getArtProduct(artProductId: string): Promise<ArtProduct | null>;
    getArtProducts(): Promise<Array<ArtProduct>>;
    getArtProductsSectionData(): Promise<{
        description: string;
    }>;
    getAuthorNotes(): Promise<Array<AuthorNote>>;
    getBackgroundMusic(): Promise<BackgroundMusicState>;
    getBackgroundMusicEnabled(): Promise<boolean>;
    getBackgroundMusicSettings(): Promise<{
        volume: bigint;
        fadeOutDuration: bigint;
        shouldLoop: boolean;
        fadeInDuration: bigint;
    }>;
    getBackgroundMusicTracks(): Promise<Array<BackgroundMusicTrack>>;
    getBitcoinInstructionText(): Promise<string>;
    getBitcoinPaymentAmount(): Promise<{
        currency: string;
        amount: string;
    }>;
    getBitcoinPaymentConfig(): Promise<{
        walletAddress: string;
        contactEmail: string;
    }>;
    getBitcoinPaymentDetails(): Promise<{
        qrCodeImagePath: string;
        btcEurAmount: string;
        btcAddress: string;
    }>;
    getBitcoinPaymentModalState(): Promise<{
        isOpen: boolean;
        lastUpdateTimestamp: bigint;
    }>;
    getBolBanner(): Promise<BolBanner>;
    getBoldedDeliveryInfoText(): Promise<string>;
    getBookSales(): Promise<Array<BookSale>>;
    getBtcAddress(): Promise<string>;
    getBtcEurPrice(): Promise<number>;
    getBtcEurRate(): Promise<number>;
    getBtcExchangeRate(): Promise<number | null>;
    getBtcOrangeColor(): Promise<string>;
    getCallerGameReaction(gameId: string): Promise<GameReaction | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChallenges(): Promise<Array<ExperienceChallenge>>;
    getChallengesByCategory(category: ChallengeCategory): Promise<Array<ExperienceChallenge>>;
    getCopyrightSettings(): Promise<{
        copyrightStartYear: bigint;
        copyrightLine: string;
        copyrightYearColor: string;
        copyrightLegalText: string;
    }>;
    getCryptoRates(): Promise<{
        btc: number;
        eth: number;
        icp: number;
    }>;
    /**
     * / Query: is the crypto payment system currently enabled?
     */
    getCryptoSystemEnabled(): Promise<boolean>;
    getCurrentReviewNumber(): Promise<bigint>;
    getDefaultArtProducts(): Promise<Array<ArtProduct>>;
    getDefaultReviews(): Promise<Array<Review>>;
    getDictionaryEntry(word: string): Promise<DictionaryEntry | null>;
    getDisclaimerText(): Promise<string>;
    getDiscordUrl(): Promise<string>;
    /**
     * / Read-only preview: returns what WOULD be distributed if distributeEmojiManually
     * / were called with the given section and totalAmount.
     * / Returns [(itemId, love, like, laugh, dislike)] — does NOT apply anything.
     */
    getDistributionPreview(section: string, totalAmount: bigint): Promise<Array<[string, bigint, bigint, bigint, bigint]>>;
    /**
     * / Query: is the Amazon region payment section enabled for Emilie?
     */
    getEmilieAmazonEnabled(): Promise<boolean>;
    /**
     * / Query: is the Amazon region payment section enabled for
     * / "Emilie en de Ruïne van Azoth" 1st edition?
     */
    getEmilieNlAmazonEnabled(): Promise<boolean>;
    /**
     * / Query: is the emoji/reaction counter system currently enabled?
     */
    getEmojiSystemEnabled(): Promise<boolean>;
    getEthAddress(): Promise<string>;
    /**
     * / Returns the live ETH/EUR price (calls the mixin's cached CoinGecko fetch).
     */
    getEthEurPrice(): Promise<number>;
    getEthEurRate(): Promise<number>;
    getExperienceHubTexts(): Promise<ExperienceHubTexts>;
    getFeaturedProductButtonTexts(): Promise<{
        secondProductButtonText: string;
        firstProductButtonText: string;
    }>;
    getFileReference(path: string): Promise<FileReference | null>;
    getFirstProductPrice(): Promise<string>;
    getFooterCopyright(): Promise<string>;
    getFooterSettings(): Promise<FooterSettings>;
    getGalleryCarouselPhotos(): Promise<Array<GalleryCarouselPhoto>>;
    getGameComments(gameId: string): Promise<Array<GameComment>>;
    getGameReactionCounts(gameId: string): Promise<GameReactionCounts>;
    /**
     * / Return game reaction counts including automated inflation.
     */
    getGameReactionCountsInflated(gameId: string): Promise<GameReactionCounts>;
    getGames(): Promise<Array<Game>>;
    getHomepageTextBlocks(): Promise<{
        block1: TextBlock;
        block2: TextBlock;
        block3: TextBlock;
    }>;
    getHomepageTextBlocksAnnaEn(): Promise<HomepageTextBlocks>;
    getHomepageTextBlocksAnnaNl(): Promise<HomepageTextBlocks>;
    getHomepageTextBlocksEmilieEn(): Promise<HomepageTextBlocks>;
    getHomepageTextBlocksEmilieNl(): Promise<HomepageTextBlocks>;
    getIcpAddress(): Promise<string>;
    /**
     * / Returns the live ICP/EUR price (calls the mixin's cached CoinGecko fetch).
     */
    getIcpEurPrice(): Promise<number>;
    getIcpEurRate(): Promise<number>;
    /**
     * / Public query: returns the current emoji inflation ratio config.
     */
    getInflationRatios(): Promise<EmojiRatioConfig>;
    /**
     * / Admin-only: full raw distribution stats for the monitor panel.
     */
    getInflationStats(): Promise<{
        lastRunTime: bigint;
        automatedCounts: Array<[string, bigint]>;
        userCounts: Array<[string, bigint]>;
        launchTime: bigint;
        totalEntities: bigint;
    }>;
    /**
     * / Admin-only: summary grouped by section (review / reflection / author_note / game).
     * / Returns per-section, per-emoji breakdown: automated counts vs user-clicked counts.
     */
    getInflationSummary(): Promise<{
        totalAutomated: bigint;
        totalUser: bigint;
        bySection: Array<[string, EmojiBreakdown]>;
    }>;
    getInternationalCustomerCheckoutUrl(): Promise<string>;
    getMarktplaatsButtonText(): Promise<string>;
    getMediumUrl(): Promise<string>;
    getMyNewsletterSubscription(): Promise<NewsletterSubscriber | null>;
    getPayPalButtonText(): Promise<string>;
    getPayPalButtonUrl(): Promise<string>;
    getPaymentCountries(): Promise<Array<PaymentCountry>>;
    getPaymentOptions(): Promise<Array<PaymentOption>>;
    getPaymentOptionsByCountry(countryId: string): Promise<Array<PaymentOption>>;
    getPolicyContent(policyType: PolicyType): Promise<PolicyContent>;
    getPopupInstructions(): Promise<{
        mollieInstruction: string;
        revolutInstruction: string;
    }>;
    getProductByKey(textKey: string): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getPromotionalTermsContent(): Promise<string>;
    getPurchaseButtonInstructionalText(): Promise<string>;
    getPurchaseButtonUrl(): Promise<string>;
    getQrCodeImagePath(): Promise<string>;
    getRandomArtProductsLayout(numImages: bigint): Promise<{
        x: bigint;
        y: bigint;
        rotation: bigint;
        imageIndex: bigint;
    }>;
    getRandomCharacters(numCharacters: bigint): Promise<Array<{
        __kind__: "character";
        character: string;
    } | {
        __kind__: "position";
        position: bigint;
    }>>;
    getRandomEmissionCharacters(numCharacters: bigint, direction: Variant_left_right): Promise<Array<string>>;
    getRandomGalleryLayout(numImages: bigint): Promise<{
        x: bigint;
        y: bigint;
        rotation: bigint;
        imageIndex: bigint;
    }>;
    getReflectionBlock(blockId: string): Promise<ReflectionBlock | null>;
    getReflectionBlocks(): Promise<Array<ReflectionBlock>>;
    getRetailLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getRetailRewards(): Promise<Array<RewardFull>>;
    getReview(reviewId: string): Promise<Review | null>;
    getReviewBookTitles(): Promise<Array<string>>;
    getReviewEmojiCountsV2(reviewId: string): Promise<{
        like: bigint;
        love: bigint;
        laugh: bigint;
        dislike: bigint;
    }>;
    getReviewMilestones(): Promise<Array<ReviewMilestone>>;
    getReviews(): Promise<Array<Review>>;
    getReviewsByBookTitle(bookTitle: string): Promise<Array<Review>>;
    getRevolutPayButtonTextFirstProduct(): Promise<string>;
    getRevolutPayButtonTextSecondProduct(): Promise<string>;
    getRevolutPayButtonUrl(): Promise<string>;
    getRoadmapSectionData(): Promise<{
        title: string;
        currentReviews: bigint;
        progressPercentage: bigint;
        description: string;
    }>;
    getSecondProductPayPalUrl(): Promise<string>;
    getSecondProductPrice(): Promise<string>;
    getSharedPaymentLogos(): Promise<Array<SharedPaymentLogo>>;
    getShippingNote(): Promise<string>;
    getSocialLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getSocialRewards(): Promise<Array<RewardFull>>;
    getSpiralFlowerPattern(spawnX: bigint, spawnY: bigint, colorCode: string): Promise<{
        centerX: bigint;
        centerY: bigint;
        isBlooming: boolean;
        bloomDurationMs: bigint;
        patternId: bigint;
        spiralColor: string;
        bloomStartTime: bigint;
    }>;
    getSubmitProofEmail(): Promise<string>;
    getTaxRecords(): Promise<Array<TaxRecord>>;
    getTelegramUrl(): Promise<string>;
    getTiktokUrl(): Promise<string>;
    getUserFavourites(): Promise<UserFavourites>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserReviewReactionV2(reviewId: string): Promise<string | null>;
    getViaMarktplaatsButtonUrl(): Promise<string>;
    getViaVintedButtonUrl(): Promise<string>;
    getVintedButtonText(): Promise<string>;
    getWatermarkedCharacters(numCharacters: bigint): Promise<Array<string>>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listDictionaryEntries(): Promise<Array<DictionaryEntry>>;
    listDonations(): Promise<Array<DonationEntry>>;
    listFileReferences(): Promise<Array<FileReference>>;
    listNewsletterSubscribers(): Promise<Array<NewsletterSubscriber>>;
    listShortMessages(): Promise<Array<ShortMessage>>;
    reactToAuthorNote(noteId: string, reaction: AuthorNoteReaction): Promise<{
        __kind__: "ok";
        ok: AuthorNote;
    } | {
        __kind__: "err";
        err: string;
    }>;
    reactToGame(gameId: string, reaction: GameReaction): Promise<boolean>;
    /**
     * / React to a game and track user engagement for inflation weighting.
     */
    reactToGameAndTrack(gameId: string, reaction: GameReaction): Promise<boolean>;
    reactToReflectionBlock(blockId: string, reaction: ReflectionBlockReaction): Promise<{
        __kind__: "ok";
        ok: ReflectionBlock;
    } | {
        __kind__: "err";
        err: string;
    }>;
    reactToReviewV2(reviewId: string, reaction: string): Promise<void>;
    registerFileReference(path: string, hash: string): Promise<void>;
    removeAmazonRegionFromBook(bookKey: string, regionId: string): Promise<void>;
    removeAnnouncement(id: bigint): Promise<boolean>;
    removeBackgroundMusicTrack(trackPath: string): Promise<void>;
    removeFavourite(itemType: string, itemId: string): Promise<boolean>;
    removeNewsletterSubscriber(principalId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    reorderGalleryCarouselPhotos(orderedIds: Array<string>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: reset the manual distribution counts (e.g. for a clean slate).
     * / Does NOT touch per-item user reaction data.
     */
    resetInflationCounts(): Promise<void>;
    saveAmazonRegionForBook(bookKey: string, region: AmazonRegion): Promise<void>;
    saveAmazonRegionsByBook(bookKey: string, regions: Array<AmazonRegion>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveGalleryCarouselPhoto(id: string, path: string, linkUrl: string, sortOrder: bigint, side: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    schema(): Promise<string>;
    setActiveBackgroundMusicTrack(trackPath: string): Promise<void>;
    setAmazonRegions(regions: Array<AmazonRegion>): Promise<void>;
    /**
     * / Admin-only: show or hide the Amazon region payment section for Anna.
     */
    setAnnaAmazonEnabled(enabled: boolean): Promise<void>;
    /**
     * / Admin-only: show or hide the Amazon region payment section for
     * / "The Song of Anna the Mermaid" 1st edition.
     */
    setAnnaSongAmazonEnabled(enabled: boolean): Promise<void>;
    setAnnouncementRotationInterval(seconds: bigint): Promise<boolean>;
    setBackgroundMusicEnabled(enabled: boolean): Promise<void>;
    setBackgroundMusicPlaylist(playlist: Array<string>): Promise<void>;
    setBtcContactEmail(email: string): Promise<boolean>;
    setBtcWalletAddress(address: string): Promise<boolean>;
    /**
     * / Admin-only: enable or disable the crypto payment system.
     */
    setCryptoSystemEnabled(enabled: boolean): Promise<void>;
    /**
     * / Admin-only: show or hide the Amazon region payment section for Emilie.
     */
    setEmilieAmazonEnabled(enabled: boolean): Promise<void>;
    /**
     * / Admin-only: show or hide the Amazon region payment section for
     * / "Emilie en de Ruïne van Azoth" 1st edition.
     */
    setEmilieNlAmazonEnabled(enabled: boolean): Promise<void>;
    /**
     * / Admin-only: enable or disable the emoji inflation engine and reaction counters.
     */
    setEmojiSystemEnabled(enabled: boolean): Promise<void>;
    setEthWalletAddress(address: string): Promise<boolean>;
    setIcpWalletAddress(address: string): Promise<boolean>;
    /**
     * / Admin-only: update the emoji inflation ratio config.
     */
    setInflationRatios(config: EmojiRatioConfig): Promise<void>;
    subscribeToNewsletter(email: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    /**
     * / No-op: kept for frontend binding compatibility.
     * / Automatic inflation has been removed. All emoji distribution is manual via distributeEmojiManually().
     */
    triggerInflation(): Promise<void>;
    unsubscribeFromNewsletter(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateAmazonRegion(region: AmazonRegion): Promise<void>;
    updateAnnouncement(id: bigint, title: string, message: string, url: string | null): Promise<boolean>;
    updateArtProduct(artProduct: ArtProduct): Promise<void>;
    updateAuthorNote(id: string, poemTitle: string, poemSubtitle: string, noteText: string): Promise<{
        __kind__: "ok";
        ok: AuthorNote;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateBackgroundMusicSettings(settings: {
        volume: bigint;
        fadeOutDuration: bigint;
        shouldLoop: boolean;
        fadeInDuration: bigint;
    }): Promise<void>;
    updateBookSale(sale: BookSale): Promise<void>;
    updateBtcExchangeRate(_rate: number): Promise<void>;
    updateChallenge(id: string, category: ChallengeCategory, title: string, description: string, rewardPoints: bigint, specialReward: string | null): Promise<{
        __kind__: "ok";
        ok: ExperienceChallenge;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateCopyrightSettings(line: string, startYear: bigint, yearColor: string, legalText: string): Promise<void>;
    updateCurrentReviewNumber(reviewNumber: bigint): Promise<void>;
    updateDictionaryEntry(entry: DictionaryEntry): Promise<void>;
    updateDonation(id: string, name: string, address: string, column: bigint, position: bigint): Promise<boolean>;
    updateExperienceHubTexts(texts: ExperienceHubTexts): Promise<void>;
    updateFooterSettings(settings: FooterSettings): Promise<void>;
    updateGame(id: string, title: string, gameType: string, playerCount: string, materialsRequired: string, imageUrl: string | null, rules: Array<string> | null): Promise<boolean>;
    updateHomepageTextBlocks(blocks: {
        block1: TextBlock;
        block2: TextBlock;
        block3: TextBlock;
    }): Promise<void>;
    updateHomepageTextBlocksAnnaEn(blocks: HomepageTextBlocks): Promise<void>;
    updateHomepageTextBlocksAnnaNl(blocks: HomepageTextBlocks): Promise<void>;
    updateHomepageTextBlocksEmilieEn(blocks: HomepageTextBlocks): Promise<void>;
    updateHomepageTextBlocksEmilieNl(blocks: HomepageTextBlocks): Promise<void>;
    updatePaymentCountry(country: PaymentCountry): Promise<boolean>;
    updatePaymentOption(option: PaymentOption): Promise<boolean>;
    updatePolicyContent(policyType: PolicyType, content: string): Promise<void>;
    updateProductByKey(textKey: string, product: Product): Promise<boolean>;
    updatePromotionalTermsContent(content: string): Promise<void>;
    updateReflectionBlock(block: ReflectionBlock): Promise<void>;
    updateRetailLeaderboardEntry(entry: LeaderboardEntry): Promise<void>;
    updateReview(review: Review): Promise<void>;
    updateReviewMilestone(milestone: ReviewMilestone): Promise<void>;
    updateReward(reward: RewardInput): Promise<void>;
    updateSharedPaymentLogo(logo: SharedPaymentLogo): Promise<boolean>;
    updateShortMessage(id: string, text: string): Promise<{
        __kind__: "ok";
        ok: ShortMessage;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateSocialLeaderboardEntry(entry: LeaderboardEntry): Promise<void>;
    updateSubmitProofEmail(email: string): Promise<void>;
    updateTaxRecord(record: TaxRecord): Promise<void>;
    uploadBackgroundMusicTrack(track: BackgroundMusicTrack): Promise<void>;
}
