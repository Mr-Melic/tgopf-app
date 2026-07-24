import Array "mo:core/Array";
import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat32 "mo:core/Nat32";
import Char "mo:core/Char";
import Nat64 "mo:core/Nat64";

/// Pure emoji-inflation logic. No timers, no async — everything is deterministic
/// given the same (state, currentTime) inputs. Triggered from the frontend on
/// every session open via main.mo's `triggerInflation()` update call.
///
/// Entity key format: "{entityType}:{entityId}:{reactionType}"
/// Entity types: "review" | "reflection" | "author_note" | "game"
/// Reaction types: "love" | "like" | "dislike" | "laugh"
module {

    // ─── Public types ─────────────────────────────────────────────────────────

    /// Admin-configurable inflation ratio ranges per emoji type.
    /// Values are integers scaled by 1_000_000_000 (e.g. 1_000_000_000 = 1.0).
    /// The engine draws a true random value in [min, max] per (entity × reaction-type)
    /// so each content block gets its own independent growth curve.
    public type EmojiRatioConfig = {
        loveMin    : Nat;
        loveMax    : Nat;
        likeMin    : Nat;
        likeMax    : Nat;
        laughMin   : Nat;
        laughMax   : Nat;
        dislikeMin : Nat;
        dislikeMax : Nat;
    };

    public type BurstState = {
        nextBurstTime  : Int;   // nanoseconds — when the next burst starts
        burstEndTime   : Int;   // nanoseconds — when current burst ends (0 = none active)
        burstRemaining : Nat;   // reactions still to distribute in current burst
        burstReactionType : Text; // "love" | "like" | "dislike" | "laugh"
    };

    public type InflationState = {
        lastRunTime    : Int;                   // ns timestamp of last run
        launchTime     : Int;                   // ns timestamp of first-ever run
        automatedCounts : Map.Map<Text, Nat>;   // entity_key → automated count
        burstState     : BurstState;
    };

    // ─── Initialisation ───────────────────────────────────────────────────────

    public func initState(now : Int) : InflationState {
        {
            lastRunTime     = now;
            launchTime      = now;
            automatedCounts = Map.empty();
            burstState      = {
                nextBurstTime     = now + _hoursToNs(9); // first burst in ~9 h
                burstEndTime      = 0;
                burstRemaining    = 0;
                burstReactionType = "love";
            };
        };
    };

    // ─── Core computation ─────────────────────────────────────────────────────

    /// Compute how much inflation to add since the last run and return a new
    /// InflationState plus a delta Map<Text, Nat> of counts to add.
    ///
    /// Each entity key gets its OWN independent Poisson draw per minute.
    /// This ensures counters don't all move together — each item is independent.
    ///
    /// entityKeys : array of all "type:id:reaction" keys
    /// currentCounts : not used for distribution (kept for API compat)
    public func computeInflation(
        state        : InflationState,
        currentTime  : Int,
        entityKeys   : [Text],
        _currentCounts : Map.Map<Text, Nat>,
        ratios       : EmojiRatioConfig,
    ) : (InflationState, Map.Map<Text, Nat>) {

        if (entityKeys.size() == 0) {
            return ({ state with lastRunTime = currentTime }, Map.empty());
        };

        let ns_per_day : Int = 86_400_000_000_000;

        // Daily buckets — max 7 days instead of 10,080 per-minute iterations.
        // Reduces per-page-load computation by ~1440x.
        let rawDays = (currentTime - state.lastRunTime) / ns_per_day;
        let daysElapsed : Nat = if (rawDays <= 0) {
            0
        } else if (rawDays > 7) {
            7
        } else {
            Int.abs(rawDays)
        };

        if (daysElapsed == 0) {
            return ({ state with lastRunTime = currentTime }, Map.empty());
        };

        let ns_per_day2 : Int = 86_400_000_000_000;
        let daysSinceLaunch1000 : Nat = if (state.launchTime >= currentTime) {
            0
        } else {
            Int.abs((currentTime - state.launchTime) * 1000 / ns_per_day2)
        };

        let denomPart : Nat = 10000 + daysSinceLaunch1000 / 30;
        let decay1000Raw : Nat = 10_000_000 / denomPart;
        let decay1000 : Nat = if (decay1000Raw < 100) { 100 } else if (decay1000Raw > 1000) { 1000 } else { decay1000Raw };

        ignore ratios;

        let delta = Map.empty<Text, Nat>();

        var burstState = state.burstState;

        if (burstState.nextBurstTime <= currentTime and burstState.burstRemaining == 0) {
            let burstSize  = 3 + _pseudoRand(Int.abs(currentTime) % 1_000_000_007, 7, 10);
            let burstRType = _pickBurstReaction(_pseudoRand(Int.abs(currentTime) % 1_000_000_007, 11, 4));
            let nextGapH   = 6 + _pseudoRand(Int.abs(currentTime) % 1_000_000_007, 13, 12);
            burstState := {
                nextBurstTime     = currentTime + nextGapH * 3_600_000_000_000;
                burstEndTime      = currentTime + 15 * 60_000_000_000;
                burstRemaining    = burstSize;
                burstReactionType = burstRType;
            };
        };

        let burstActive = burstState.burstRemaining > 0
            and burstState.burstEndTime >= state.lastRunTime;
        let burstType = burstState.burstReactionType;
        let burstPool = if (burstActive) { burstState.burstRemaining } else { 0 };

        if (burstActive and burstPool > 0) {
            var matchingIndices : [Nat] = [];
            var idx : Nat = 0;
            for (key in entityKeys.values()) {
                let isBurstMatch = key.endsWith(#text (":" # burstType));
                if (isBurstMatch) {
                    matchingIndices := matchingIndices.concat([idx]);
                };
                idx += 1;
            };
            let numMatching = matchingIndices.size();
            if (numMatching > 0) {
                var bIdx : Nat = 0;
                while (bIdx < burstPool) {
                    let pickSeedN64 : Nat64 = Nat64.fromNat(_keyHash(burstType)) *% 2654435761 ^ Nat64.fromNat(Int.abs(burstState.burstEndTime)) *% 2246822519 ^ Nat64.fromNat(bIdx) *% 3266489917;
                    let pickSeed : Nat = (pickSeedN64 % 1_000_000_007).toNat();
                    let pickedMatchIdx = _pseudoRand(pickSeed, bIdx + 3, numMatching);
                    let targetEntityIdx = matchingIndices[pickedMatchIdx];
                    let targetKey = entityKeys[targetEntityIdx];
                    let prev = switch (delta.get(targetKey)) { case (?v) v; case null 0 };
                    delta.add(targetKey, prev + 1);
                    bIdx += 1;
                };
            };
            burstState := { burstState with burstRemaining = 0 };
        } else if (burstActive) {
            burstState := { burstState with burstRemaining = 0 };
        };

        // Per-entity draw: ONE draw per day elapsed (max 7 iterations per entity)
        // instead of one draw per minute (up to 10,080 iterations per entity).
        var entityIdx : Nat = 0;

        for (key in entityKeys.values()) {
            let rxType : Text = if (key.endsWith(#text ":love"))    { "love" }
                                else if (key.endsWith(#text ":like"))    { "like" }
                                else if (key.endsWith(#text ":laugh"))   { "laugh" }
                                else if (key.endsWith(#text ":dislike")) { "dislike" }
                                else                                      { "" };

            if (rxType != "") {
                let (rMin, rMax, rxOffset) : (Nat, Nat, Nat) =
                    switch rxType {
                        case "love"    (ratios.loveMin,    ratios.loveMax,    0);
                        case "like"    (ratios.likeMin,    ratios.likeMax,    1);
                        case "laugh"   (ratios.laughMin,   ratios.laughMax,   2);
                        case _         (ratios.dislikeMin, ratios.dislikeMax, 3);
                    };

                let keyHash2 : Nat = _keyHash(key);
                let rangeSeed : Nat = _pseudoRand(
                    (keyHash2 + Int.abs(currentTime) % 1_000_000_007) % 1_000_000_007,
                    rxOffset + 7,
                    1_000_000_007
                );
                let rRange : Nat = if (rMax > rMin) { rMax - rMin } else { 0 };
                let entityRatio : Nat = if (rRange == 0) { rMin } else { rMin + (rangeSeed % rRange) };

                // Daily base rate: ratio * ~192 reactions/day / 1_000_000_000
                // (8 reactions/hour * 24 hours = 192/day at ratio 1.0)
                let baseRateDaily : Nat = entityRatio * 192 / 1_000_000_000;

                let keyHash : Nat = _keyHash(key);

                var totalAdd : Nat = 0;

                var dayIdx : Nat = 0;
                while (dayIdx < daysElapsed) {
                    let prob : Nat = baseRateDaily * decay1000 / 1_000;
                    let p1 : Nat64 = Nat64.fromNat(dayIdx + 1)    *% 2654435761;
                    let p2 : Nat64 = Nat64.fromNat(keyHash)        *% 2246822519;
                    let p3 : Nat64 = Nat64.fromNat(rxOffset + 17)  *% 3266489917;
                    var h64 : Nat64 = p1 ^ p2 ^ p3;
                    h64 ^= h64 >> 30;
                    h64 *%= 0xbf58476d1ce4e5b9;
                    h64 ^= h64 >> 27;
                    h64 *%= 0x94d049bb133111eb;
                    h64 ^= h64 >> 31;
                    let rand : Nat = (h64 % 1_000_000_000).toNat();
                    if (rand < prob) { totalAdd += 1 };
                    dayIdx += 1;
                };

                if (totalAdd > 0) {
                    let prev = switch (delta.get(key)) { case (?v) v; case null 0 };
                    delta.add(key, prev + totalAdd);
                };
            };

            entityIdx += 1;
        };

        let newState : InflationState = {
            state with
            lastRunTime = currentTime;
            burstState;
        };

        (newState, delta);
    };

    /// Simple deterministic pseudo-random: returns value in [0, modulo)
    /// Kept for burst-distribution use only; Poisson draws now use splitmix64 inline.
    func _pseudoRand(seed : Nat, offset : Nat, modulo : Nat) : Nat {
        if (modulo == 0) return 0;
        // Splitmix-inspired: avoid linear LCG collapse by using multiplicative hashing
        var h : Nat64 = Nat64.fromNat(seed) *% 0x9e3779b97f4a7c15;
        h ^= h >> 30;
        h *%= 0xbf58476d1ce4e5b9;
        h ^= h >> 27;
        h *%= 0x94d049bb133111eb;
        h ^= h >> 31;
        h ^= Nat64.fromNat(offset) *% 2654435761;
        (h % Nat64.fromNat(modulo)).toNat();
    };

    func _pickBurstReaction(n : Nat) : Text {
        switch (n % 4) {
            case 0 "love";
            case 1 "like";
            case 2 "laugh";
            case _ "dislike";
        };
    };

    func _hoursToNs(h : Nat) : Int {
        h * 3_600_000_000_000;
    };

    /// Hash a Text key into a large Nat. Used to give each entity a unique seed
    /// so that growth paths are fully independent across entities even when
    /// processing the same time window simultaneously.
    /// Uses FNV-1a with splitmix64 final avalanche for excellent bit dispersion.
    func _keyHash(key : Text) : Nat {
        // FNV-1a over UTF-8 code points
        var h : Nat64 = 14695981039346656037; // FNV offset basis (Nat64 wrapping)
        for (c in key.chars()) {
            let code : Nat64 = Nat64.fromNat(c.toNat32().toNat());
            h ^= code;
            h *%= 1099511628211;  // FNV prime
        };
        // Splitmix64 avalanche to eliminate any linear bias from FNV
        h ^= h >> 30;
        h *%= 0xbf58476d1ce4e5b9;
        h ^= h >> 27;
        h *%= 0x94d049bb133111eb;
        h ^= h >> 31;
        // Map to [0, 10^18) — large enough to prevent seed collisions across entity counts
        (h % 1_000_000_000_000_000_019).toNat();
    };
};
