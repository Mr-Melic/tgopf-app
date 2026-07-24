import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Float "mo:core/Float";
import AccessControl "../authorization/access-control";
import Types "../types/payment-countries";
import PaymentCountriesLib "../lib/payment-countries";
import OutCall "../http-outcalls/outcall";

// BTC/ETH/ICP EUR rate caches — stored as mutable records passed in from main.mo.
// rate = 0.0 means "never fetched yet".
mixin (
    accessControlState  : AccessControl.AccessControlState,
    paymentCountries    : Map.Map<Text, Types.PaymentCountry>,
    paymentOptions      : Map.Map<Text, Types.PaymentOption>,
    sharedPaymentLogos  : Map.Map<Text, Types.SharedPaymentLogo>,
    btcRateCache        : { var rate : Float; var fetchedAt : Int },
    httpTransform       : OutCall.Transform,
    btcConfig           : { var walletAddress : Text; var contactEmail : Text },
    ethRateCache        : { var rate : Float; var fetchedAt : Int },
    ethConfig           : { var walletAddress : Text },
    icpRateCache        : { var rate : Float; var fetchedAt : Int },
    icpConfig           : { var walletAddress : Text },
    _unifiedCryptoCache : { var btcRate : Float; var ethRate : Float; var icpRate : Float; var fetchedAt : Int },
    cryptoSystemState   : { var enabled : Bool },
) {
    // ── Country CRUD ─────────────────────────────────────────────────────────

    public shared ({ caller }) func addPaymentCountry(country : Types.PaymentCountry) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add payment countries");
        };
        paymentCountries.add(country.id, country);
        // Auto-seed Bitcoin, Ethereum, ICP, and Creditcard for the newly added country.
        PaymentCountriesLib.ensureBitcoinForAllCountries(paymentCountries, paymentOptions);
        PaymentCountriesLib.ensureEthereumForAllCountries(paymentCountries, paymentOptions);
        PaymentCountriesLib.ensureIcpForAllCountries(paymentCountries, paymentOptions);
        PaymentCountriesLib.ensureCreditcardForAllCountries(paymentCountries, paymentOptions);
        true;
    };

    public shared ({ caller }) func updatePaymentCountry(country : Types.PaymentCountry) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update payment countries");
        };
        paymentCountries.add(country.id, country);
        true;
    };

    public shared ({ caller }) func deletePaymentCountry(id : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete payment countries");
        };
        paymentCountries.remove(id);
        // Also remove all payment options for this country
        let toRemove = paymentOptions.entries().toArray();
        for ((optId, opt) in toRemove.vals()) {
            if (opt.countryId == id) {
                paymentOptions.remove(optId);
            };
        };
        true;
    };

    public query func getPaymentCountries() : async [Types.PaymentCountry] {
        paymentCountries.values().toArray();
    };

    // ── Payment option CRUD ──────────────────────────────────────────────────

    public shared ({ caller }) func addPaymentOption(option : Types.PaymentOption) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add payment options");
        };
        paymentOptions.add(option.id, option);
        true;
    };

    public shared ({ caller }) func updatePaymentOption(option : Types.PaymentOption) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update payment options");
        };
        paymentOptions.add(option.id, option);
        true;
    };

    public shared ({ caller }) func deletePaymentOption(id : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete payment options");
        };
        paymentOptions.remove(id);
        true;
    };

    public query func getPaymentOptions() : async [Types.PaymentOption] {
        paymentOptions.values().toArray();
    };

    public query func getPaymentOptionsByCountry(countryId : Text) : async [Types.PaymentOption] {
        paymentOptions.values().filter(func(opt) { opt.countryId == countryId }).toArray();
    };

    // ── Ensure Bitcoin for all countries (admin utility) ─────────────────────

    public shared ({ caller }) func ensureBitcoinForAllCountries() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can run this utility");
        };
        PaymentCountriesLib.ensureBitcoinForAllCountries(paymentCountries, paymentOptions);
    };

    // ── Unified crypto rate cache ─────────────────────────────────────────────

    /// Cache TTL: 10 minutes in nanoseconds — shared unified cache.
    let _cryptoCacheTtlNs : Int = 10 * 60 * 1_000_000_000;

    /// Legacy per-coin TTL alias (kept so existing cache checks compile).
    let _btcCacheTtlNs : Int = _cryptoCacheTtlNs;

    /// Parse a multi-coin CoinGecko response:
    ///   {"bitcoin":{"eur":X},"ethereum":{"eur":Y},"internet-computer":{"eur":Z}}
    /// Returns ?(btcEur, ethEur, icpEur) or null on any parse failure.
    /// Strategy: scan once for each of the three coin keys, then extract the
    /// "eur" value immediately following it.
    func _parseCryptoRatesJson(json : Text) : ?(Float, Float, Float) {
        func _extractEurAfter(src : Text, coinKey : Text) : ?Float {
            // Find "<coinKey>" in src, then scan forward for "eur":<number>.
            let fullKey = "\"" # coinKey # "\"";
            let chars = src.chars().toArray();
            let srcLen = chars.size();
            let keyChars = fullKey.chars().toArray();
            let keyLen = keyChars.size();
            // Find first occurrence of fullKey.
            var ki = 0;
            var found = false;
            var startAfter = 0;
            var i = 0;
            label searchLoop while (i < srcLen) {
                if (chars[i] == keyChars[ki]) {
                    ki += 1;
                    if (ki == keyLen) {
                        startAfter := i + 1;
                        found := true;
                        break searchLoop;
                    };
                } else {
                    ki := if (chars[i] == keyChars[0]) 1 else 0;
                };
                i += 1;
            };
            if (not found) { return null };
            // Now scan from startAfter for "eur":.
            let eurKey = "\"eur\":";
            let eurChars = eurKey.chars().toArray();
            let eurKeyLen = eurChars.size();
            var eki = 0;
            var eurStart = 0;
            var eurFound = false;
            var i2 = startAfter;
            label eurSearch while (i2 < srcLen) {
                if (chars[i2] == eurChars[eki]) {
                    eki += 1;
                    if (eki == eurKeyLen) {
                        eurStart := i2 + 1;
                        eurFound := true;
                        break eurSearch;
                    };
                } else {
                    eki := if (chars[i2] == eurChars[0]) 1 else 0;
                };
                i2 += 1;
            };
            if (not eurFound) { return null };
            // Collect digits (and one decimal point) starting at eurStart.
            var numStr = "";
            var seenDot = false;
            var j = eurStart;
            while (j < srcLen) {
                let c = chars[j];
                if (c >= '0' and c <= '9') {
                    numStr #= Text.fromChar(c);
                } else if (c == '.' and not seenDot) {
                    seenDot := true;
                    numStr #= ".";
                } else if (c == ' ' or c == '\t') {
                    // skip whitespace between colon and number
                    if (numStr != "") break;
                } else {
                    // non-numeric character stops collection
                    if (numStr != "") break;
                };
                j += 1;
            };
            if (numStr == "" or numStr == ".") { return null };
            // Parse intPart.fracPart manually (mo:core Float has no fromText).
            var intPart = "";
            var fracPart = "";
            var passedDot = false;
            for (c in numStr.chars()) {
                if (c == '.') { passedDot := true }
                else if (passedDot) { fracPart #= Text.fromChar(c) }
                else { intPart #= Text.fromChar(c) };
            };
            var intVal : Nat = 0;
            for (c in intPart.chars()) {
                intVal := intVal * 10 + (c.toNat32() - '0'.toNat32()).toNat();
            };
            var fracVal : Float = 0.0;
            var divisor : Float = 10.0;
            for (c in fracPart.chars()) {
                let d : Float = (c.toNat32() - '0'.toNat32()).toNat().toFloat();
                fracVal := fracVal + d / divisor;
                divisor := divisor * 10.0;
            };
            ?(intVal.toFloat() + fracVal)
        };

        let btcOpt = _extractEurAfter(json, "bitcoin");
        let ethOpt = _extractEurAfter(json, "ethereum");
        let icpOpt = _extractEurAfter(json, "internet-computer");
        switch (btcOpt, ethOpt, icpOpt) {
            case (?b, ?e, ?i) { ?(b, e, i) };
            case _ { null };
        };
    };

    /// Fetch all three crypto rates in a SINGLE CoinGecko HTTP call.
    /// Backend-side cache: shared across all callers, 10-minute TTL.
    /// When cryptoSystemState.enabled = false, returns fallback values — NO HTTP outcall.
    public shared func getCryptoRates() : async { btc : Float; eth : Float; icp : Float } {
        // Crypto system disabled: return cached or fallback values immediately, no HTTP call.
        if (not cryptoSystemState.enabled) {
            return {
                btc = if (_unifiedCryptoCache.btcRate > 0.0) { _unifiedCryptoCache.btcRate } else { 85000.0 };
                eth = if (_unifiedCryptoCache.ethRate > 0.0) { _unifiedCryptoCache.ethRate } else { 3000.0 };
                icp = if (_unifiedCryptoCache.icpRate > 0.0) { _unifiedCryptoCache.icpRate } else { 8.0 };
            };
        };
        let now = Time.now();
        // Return unified cache if still fresh.
        if (_unifiedCryptoCache.fetchedAt > 0 and (now - _unifiedCryptoCache.fetchedAt) < _cryptoCacheTtlNs) {
            return { btc = _unifiedCryptoCache.btcRate; eth = _unifiedCryptoCache.ethRate; icp = _unifiedCryptoCache.icpRate };
        };
        // One HTTP call for all three coins.
        let url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,internet-computer&vs_currencies=eur";
        try {
            let body = await OutCall.httpGetRequest(url, [], httpTransform);
            switch (_parseCryptoRatesJson(body)) {
                case (?(btc, eth, icp)) {
                    _unifiedCryptoCache.btcRate   := btc;
                    _unifiedCryptoCache.ethRate   := eth;
                    _unifiedCryptoCache.icpRate   := icp;
                    _unifiedCryptoCache.fetchedAt := now;
                    { btc; eth; icp };
                };
                case null {
                    // Parse failed — return stale cache if available, else fallbacks.
                    {
                        btc = if (_unifiedCryptoCache.btcRate > 0.0) { _unifiedCryptoCache.btcRate } else { 85000.0 };
                        eth = if (_unifiedCryptoCache.ethRate > 0.0) { _unifiedCryptoCache.ethRate } else { 3000.0 };
                        icp = if (_unifiedCryptoCache.icpRate > 0.0) { _unifiedCryptoCache.icpRate } else { 8.0 };
                    };
                };
            };
        } catch (_) {
            // Network error — stale cache or hardcoded fallbacks.
            {
                btc = if (_unifiedCryptoCache.btcRate > 0.0) { _unifiedCryptoCache.btcRate } else { 85000.0 };
                eth = if (_unifiedCryptoCache.ethRate > 0.0) { _unifiedCryptoCache.ethRate } else { 3000.0 };
                icp = if (_unifiedCryptoCache.icpRate > 0.0) { _unifiedCryptoCache.icpRate } else { 8.0 };
            };
        };
    };

    // ── BTC/EUR live rate ─────────────────────────────────────────────────────

    /// Hardcoded fallback rate in case the API call fails.
    let _btcFallbackRate : Float = 85000.0;

    /// Parse {"bitcoin":{"eur":XXXXX}} and return the eur value as Float.
    /// Returns null if parsing fails.
    /// Strategy: scan the JSON char-by-char looking for the sequence "eur":
    /// then collect the digits (and optional decimal) that follow.
    func _parseBtcEurJson(json : Text) : ?Float {
        let eurKey = "\"eur\":";
        let keyLen  = 6; // length of "\"eur\":"
        var numStr  = "";
        var seenDot = false;
        var collecting = false; // true once we've passed the "eur": marker
        var keyMatch : Nat = 0; // how many chars of eurKey we've matched so far
        var skipWhitespace = false; // skip spaces/tabs after the colon

        for (ch in json.chars()) {
            if (not collecting) {
                // Try to match the eurKey character by character.
                var pos : Nat = 0;
                var matched = false;
                for (kc in eurKey.chars()) {
                    if (pos == keyMatch and not matched) {
                        if (ch == kc) {
                            keyMatch += 1;
                            matched := true;
                            if (keyMatch == keyLen) {
                                // Fully matched "eur": — start collecting next
                                collecting := true;
                                skipWhitespace := true;
                            };
                        } else {
                            // Mismatch — reset; but if ch starts the key, keep 1
                            keyMatch := if (ch == '\"') 1 else 0;
                            matched := true;
                        };
                    };
                    pos += 1;
                };
            } else {
                // Collecting the number value
                if (skipWhitespace) {
                    if (ch == ' ' or ch == '\t') {
                        // skip
                    } else {
                        skipWhitespace := false;
                        // process this char as part of the number
                        if (ch >= '0' and ch <= '9') {
                            numStr #= Text.fromChar(ch);
                        } else if (ch == '.' and not seenDot) {
                            seenDot := true;
                            numStr #= ".";
                        };
                        // else stop collecting (non-numeric, non-dot char)
                    };
                } else {
                    if (ch >= '0' and ch <= '9') {
                        numStr #= Text.fromChar(ch);
                    } else if (ch == '.' and not seenDot) {
                        seenDot := true;
                        numStr #= ".";
                    };
                    // else: stop collecting — we simply keep numStr as-is
                };
            };
        };
        if (numStr == "" or numStr == ".") { return null };
        // mo:core Float has no fromText — parse integer and decimal parts manually.
        // Split numStr on '.'.
        var intPart  = "";
        var fracPart = "";
        var seenDot2 = false;
        for (c in numStr.chars()) {
            if (c == '.') { seenDot2 := true }
            else if (seenDot2) { fracPart #= Text.fromChar(c) }
            else { intPart #= Text.fromChar(c) };
        };
        // Parse integer part as Nat.
        var intValN : Nat = 0;
        for (c in intPart.chars()) {
            let d : Nat = (c.toNat32() - '0'.toNat32()).toNat();
            intValN := intValN * 10 + d;
        };
        // Parse fractional part.
        var fracVal : Float = 0.0;
        var divisor : Float = 10.0;
        for (c in fracPart.chars()) {
            let d : Float = (c.toNat32() - '0'.toNat32()).toNat().toFloat();
            fracVal := fracVal + d / divisor;
            divisor := divisor * 10.0;
        };
        ?(intValN.toFloat() + fracVal)
    };

    /// Returns the live BTC/EUR rate — delegates to getCryptoRates() so only
    /// one HTTP call is ever made for all three coins together.
    public shared func getBtcEurRate() : async Float {
        let rates = await getCryptoRates();
        rates.btc;
    };

    // ── Bitcoin payment configuration ─────────────────────────────────────────

    /// Returns the Bitcoin wallet address and contact email for the
    /// pop-up modal shown when a visitor clicks any Bitcoin payment button.
    public query func getBitcoinPaymentConfig() : async { walletAddress : Text; contactEmail : Text } {
        {
            walletAddress = btcConfig.walletAddress;
            contactEmail  = btcConfig.contactEmail;
        };
    };

    /// Admin-only: update the global BTC wallet address.
    public shared ({ caller }) func setBtcWalletAddress(address : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update the BTC wallet address");
        };
        btcConfig.walletAddress := address;
        true;
    };

    /// Admin-only: update the global BTC contact email.
    public shared ({ caller }) func setBtcContactEmail(email : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update the BTC contact email");
        };
        btcConfig.contactEmail := email;
        true;
    };

    // ── ETH/EUR live rate ─────────────────────────────────────────────────────

    /// Hardcoded fallback rate for ETH in case the API call fails.
    let _ethFallbackRate : Float = 3000.0;

    /// Parse {"ethereum":{"eur":XXXXX}} or {"internet-computer":{"eur":XXXXX}}
    /// by reusing the same "eur": scanning logic from _parseBtcEurJson.
    func _parseCoinEurJson(json : Text) : ?Float {
        let eurKey = "\"eur\":";
        let keyLen  = 6;
        var numStr  = "";
        var seenDot = false;
        var collecting = false;
        var keyMatch : Nat = 0;
        var skipWhitespace = false;

        for (ch in json.chars()) {
            if (not collecting) {
                var pos : Nat = 0;
                var matched = false;
                for (kc in eurKey.chars()) {
                    if (pos == keyMatch and not matched) {
                        if (ch == kc) {
                            keyMatch += 1;
                            matched := true;
                            if (keyMatch == keyLen) {
                                collecting := true;
                                skipWhitespace := true;
                            };
                        } else {
                            keyMatch := if (ch == '\"') 1 else 0;
                            matched := true;
                        };
                    };
                    pos += 1;
                };
            } else {
                if (skipWhitespace) {
                    if (ch == ' ' or ch == '\t') {
                        // skip
                    } else {
                        skipWhitespace := false;
                        if (ch >= '0' and ch <= '9') {
                            numStr #= Text.fromChar(ch);
                        } else if (ch == '.' and not seenDot) {
                            seenDot := true;
                            numStr #= ".";
                        };
                    };
                } else {
                    if (ch >= '0' and ch <= '9') {
                        numStr #= Text.fromChar(ch);
                    } else if (ch == '.' and not seenDot) {
                        seenDot := true;
                        numStr #= ".";
                    };
                };
            };
        };
        if (numStr == "" or numStr == ".") { return null };
        var intPart  = "";
        var fracPart = "";
        var seenDot2 = false;
        for (c in numStr.chars()) {
            if (c == '.') { seenDot2 := true }
            else if (seenDot2) { fracPart #= Text.fromChar(c) }
            else { intPart #= Text.fromChar(c) };
        };
        var intValN : Nat = 0;
        for (c in intPart.chars()) {
            let d : Nat = (c.toNat32() - '0'.toNat32()).toNat();
            intValN := intValN * 10 + d;
        };
        var fracVal : Float = 0.0;
        var divisor : Float = 10.0;
        for (c in fracPart.chars()) {
            let d : Float = (c.toNat32() - '0'.toNat32()).toNat().toFloat();
            fracVal := fracVal + d / divisor;
            divisor := divisor * 10.0;
        };
        ?(intValN.toFloat() + fracVal)
    };

    /// Returns the live ETH/EUR rate — delegates to getCryptoRates().
    public shared func getEthEurRate() : async Float {
        let rates = await getCryptoRates();
        rates.eth;
    };

    // ── Ethereum wallet configuration ─────────────────────────────────────────

    public query func getEthAddress() : async Text {
        ethConfig.walletAddress;
    };

    public shared ({ caller }) func setEthWalletAddress(address : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update the ETH wallet address");
        };
        ethConfig.walletAddress := address;
        true;
    };

    // ── Ensure Ethereum for all countries (admin utility) ────────────────────

    public shared ({ caller }) func ensureEthereumForAllCountries() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can run this utility");
        };
        PaymentCountriesLib.ensureEthereumForAllCountries(paymentCountries, paymentOptions);
    };

    // ── ICP/EUR live rate ─────────────────────────────────────────────────────

    /// Hardcoded fallback rate for ICP in case the API call fails.
    let _icpFallbackRate : Float = 8.0;

    /// Returns the live ICP/EUR rate — delegates to getCryptoRates().
    public shared func getIcpEurRate() : async Float {
        let rates = await getCryptoRates();
        rates.icp;
    };

    // ── ICP wallet configuration ──────────────────────────────────────────────

    public query func getIcpAddress() : async Text {
        icpConfig.walletAddress;
    };

    public shared ({ caller }) func setIcpWalletAddress(address : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update the ICP wallet address");
        };
        icpConfig.walletAddress := address;
        true;
    };

    // ── Ensure ICP for all countries (admin utility) ─────────────────────────

    public shared ({ caller }) func ensureIcpForAllCountries() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can run this utility");
        };
        PaymentCountriesLib.ensureIcpForAllCountries(paymentCountries, paymentOptions);
    };

    // ── Ensure Creditcard for all countries (admin utility) ──────────────────

    public shared ({ caller }) func ensureCreditcardForAllCountries() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can run this utility");
        };
        PaymentCountriesLib.ensureCreditcardForAllCountries(paymentCountries, paymentOptions);
    };

    // ── Shared payment logos ──────────────────────────────────────────────────

    /// Returns all logos in the central shared logo registry.
    public query func getSharedPaymentLogos() : async [Types.SharedPaymentLogo] {
        sharedPaymentLogos.values().toArray();
    };

    /// Admin-only: add a new logo to the shared registry.
    public shared ({ caller }) func addSharedPaymentLogo(logo : Types.SharedPaymentLogo) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add shared payment logos");
        };
        sharedPaymentLogos.add(logo.id, logo);
        true;
    };

    /// Admin-only: update an existing logo in the shared registry.
    public shared ({ caller }) func updateSharedPaymentLogo(logo : Types.SharedPaymentLogo) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update shared payment logos");
        };
        sharedPaymentLogos.add(logo.id, logo);
        true;
    };

    /// Admin-only: remove a logo from the shared registry.
    public shared ({ caller }) func deleteSharedPaymentLogo(id : Text) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete shared payment logos");
        };
        sharedPaymentLogos.remove(id);
        true;
    };
};
