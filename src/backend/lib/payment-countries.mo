import Map "mo:core/Map";
import Types "../types/payment-countries";

module {
    // ── Default countries (with continent assignments) ────────────────────────
    let defaultCountries : [Types.PaymentCountry] = [
        { id = "AF"; name = "Afghanistan";            enabled = true; sortOrder = 1;  continent = "Asia"        },
        { id = "AL"; name = "Albania";                enabled = true; sortOrder = 2;  continent = "Europe"      },
        { id = "AD"; name = "Andorra";                enabled = true; sortOrder = 3;  continent = "Europe"      },
        { id = "AR"; name = "Argentina";              enabled = true; sortOrder = 4;  continent = "Americas"    },
        { id = "AU"; name = "Australia";              enabled = true; sortOrder = 5;  continent = "Oceania"     },
        { id = "AT"; name = "Austria";                enabled = true; sortOrder = 6;  continent = "Europe"      },
        { id = "BE"; name = "Belgium";                enabled = true; sortOrder = 7;  continent = "Europe"      },
        { id = "BO"; name = "Bolivia";                enabled = true; sortOrder = 8;  continent = "Americas"    },
        { id = "BR"; name = "Brazil";                 enabled = true; sortOrder = 9;  continent = "Americas"    },
        { id = "BG"; name = "Bulgaria";               enabled = true; sortOrder = 10; continent = "Europe"      },
        { id = "CA"; name = "Canada";                 enabled = true; sortOrder = 11; continent = "Americas"    },
        { id = "CL"; name = "Chile";                  enabled = true; sortOrder = 12; continent = "Americas"    },
        { id = "CN"; name = "China";                  enabled = true; sortOrder = 13; continent = "Asia"        },
        { id = "CO"; name = "Colombia";               enabled = true; sortOrder = 14; continent = "Americas"    },
        { id = "HR"; name = "Croatia";                enabled = true; sortOrder = 15; continent = "Europe"      },
        { id = "CY"; name = "Cyprus";                 enabled = true; sortOrder = 16; continent = "Europe"      },
        { id = "CZ"; name = "Czech Republic";         enabled = true; sortOrder = 17; continent = "Europe"      },
        { id = "DK"; name = "Denmark";                enabled = true; sortOrder = 18; continent = "Europe"      },
        { id = "EC"; name = "Ecuador";                enabled = true; sortOrder = 19; continent = "Americas"    },
        { id = "EG"; name = "Egypt";                  enabled = true; sortOrder = 20; continent = "Africa"      },
        { id = "EE"; name = "Estonia";                enabled = true; sortOrder = 21; continent = "Europe"      },
        { id = "FI"; name = "Finland";                enabled = true; sortOrder = 22; continent = "Europe"      },
        { id = "FR"; name = "France";                 enabled = true; sortOrder = 23; continent = "Europe"      },
        { id = "DE"; name = "Germany";                enabled = true; sortOrder = 24; continent = "Europe"      },
        { id = "GR"; name = "Greece";                 enabled = true; sortOrder = 25; continent = "Europe"      },
        { id = "HU"; name = "Hungary";                enabled = true; sortOrder = 26; continent = "Europe"      },
        { id = "IS"; name = "Iceland";                enabled = true; sortOrder = 27; continent = "Europe"      },
        { id = "IN"; name = "India";                  enabled = true; sortOrder = 28; continent = "Asia"        },
        { id = "ID"; name = "Indonesia";              enabled = true; sortOrder = 29; continent = "Asia"        },
        { id = "IE"; name = "Ireland";                enabled = true; sortOrder = 30; continent = "Europe"      },
        { id = "IL"; name = "Israel";                 enabled = true; sortOrder = 31; continent = "Middle East" },
        { id = "IT"; name = "Italy";                  enabled = true; sortOrder = 32; continent = "Europe"      },
        { id = "JP"; name = "Japan";                  enabled = true; sortOrder = 33; continent = "Asia"        },
        { id = "LV"; name = "Latvia";                 enabled = true; sortOrder = 34; continent = "Europe"      },
        { id = "LI"; name = "Liechtenstein";          enabled = true; sortOrder = 35; continent = "Europe"      },
        { id = "LT"; name = "Lithuania";              enabled = true; sortOrder = 36; continent = "Europe"      },
        { id = "LU"; name = "Luxembourg";             enabled = true; sortOrder = 37; continent = "Europe"      },
        { id = "MY"; name = "Malaysia";               enabled = true; sortOrder = 38; continent = "Asia"        },
        { id = "MT"; name = "Malta";                  enabled = true; sortOrder = 39; continent = "Europe"      },
        { id = "MX"; name = "Mexico";                 enabled = true; sortOrder = 40; continent = "Americas"    },
        { id = "MC"; name = "Monaco";                 enabled = true; sortOrder = 41; continent = "Europe"      },
        { id = "MA"; name = "Morocco";                enabled = true; sortOrder = 42; continent = "Africa"      },
        { id = "NL"; name = "Netherlands";            enabled = true; sortOrder = 43; continent = "Europe"      },
        { id = "NZ"; name = "New Zealand";            enabled = true; sortOrder = 44; continent = "Oceania"     },
        { id = "NG"; name = "Nigeria";                enabled = true; sortOrder = 45; continent = "Africa"      },
        { id = "NO"; name = "Norway";                 enabled = true; sortOrder = 46; continent = "Europe"      },
        { id = "PE"; name = "Peru";                   enabled = true; sortOrder = 47; continent = "Americas"    },
        { id = "PH"; name = "Philippines";            enabled = true; sortOrder = 48; continent = "Asia"        },
        { id = "PL"; name = "Poland";                 enabled = true; sortOrder = 49; continent = "Europe"      },
        { id = "PT"; name = "Portugal";               enabled = true; sortOrder = 50; continent = "Europe"      },
        { id = "RO"; name = "Romania";                enabled = true; sortOrder = 51; continent = "Europe"      },
        { id = "SM"; name = "San Marino";             enabled = true; sortOrder = 52; continent = "Europe"      },
        { id = "SA"; name = "Saudi Arabia";           enabled = true; sortOrder = 53; continent = "Middle East" },
        { id = "RS"; name = "Serbia";                 enabled = true; sortOrder = 54; continent = "Europe"      },
        { id = "SG"; name = "Singapore";              enabled = true; sortOrder = 55; continent = "Asia"        },
        { id = "SK"; name = "Slovakia";               enabled = true; sortOrder = 56; continent = "Europe"      },
        { id = "SI"; name = "Slovenia";               enabled = true; sortOrder = 57; continent = "Europe"      },
        { id = "ZA"; name = "South Africa";           enabled = true; sortOrder = 58; continent = "Africa"      },
        { id = "KR"; name = "South Korea";            enabled = true; sortOrder = 59; continent = "Asia"        },
        { id = "ES"; name = "Spain";                  enabled = true; sortOrder = 60; continent = "Europe"      },
        { id = "SE"; name = "Sweden";                 enabled = true; sortOrder = 61; continent = "Europe"      },
        { id = "CH"; name = "Switzerland";            enabled = true; sortOrder = 62; continent = "Europe"      },
        { id = "TH"; name = "Thailand";               enabled = true; sortOrder = 63; continent = "Asia"        },
        { id = "TR"; name = "Turkey";                 enabled = true; sortOrder = 64; continent = "Europe"      },
        { id = "UA"; name = "Ukraine";                enabled = true; sortOrder = 65; continent = "Europe"      },
        { id = "AE"; name = "United Arab Emirates";   enabled = true; sortOrder = 66; continent = "Middle East" },
        { id = "GB"; name = "United Kingdom";         enabled = true; sortOrder = 67; continent = "Europe"      },
        { id = "US"; name = "United States";          enabled = true; sortOrder = 68; continent = "Americas"    },
        { id = "UY"; name = "Uruguay";                enabled = true; sortOrder = 69; continent = "Americas"    },
        { id = "VA"; name = "Vatican City";           enabled = true; sortOrder = 70; continent = "Europe"      },
        { id = "VN"; name = "Vietnam";                enabled = true; sortOrder = 71; continent = "Asia"        },
    ];

    // ── Default payment options for Netherlands ──────────────────────────────
    let defaultOptions : [Types.PaymentOption] = [
        {
            id             = "NL-IDEAL";
            countryId      = "NL";
            methodName     = "iDEAL / Wero";
            link           = "https://payment-links.mollie.com/payment/LuQNwLdn4JoBgHRBsupHD";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#C026D3";
            fontColor      = "#FFFFFF";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 1;
            enabled        = true;
        },
        {
            id             = "NL-PAYPAL";
            countryId      = "NL";
            methodName     = "PayPal";
            link           = "https://www.paypal.com/ncp/payment/K9YW45XWPWQVY";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#003087";
            fontColor      = "#FFFFFF";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 2;
            enabled        = true;
        },
        {
            id             = "NL-BITCOIN";
            countryId      = "NL";
            methodName     = "Bitcoin";
            link           = "bc1qksdafkkasm96075gp7yys78h7eq97selp97lh0";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#F7931A";
            fontColor      = "#000000";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 3;
            enabled        = true;
        },
        {
            id             = "NL-BOLCOM";
            countryId      = "NL";
            methodName     = "Bol.com";
            link           = "https://www.bol.com/nl/nl/p/the-gospel-of-poetic-frolic-softcover-boek-gesigneerd-engelstalig-gedichten/9300000258914105/";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#0000A4";
            fontColor      = "#FFFFFF";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 4;
            enabled        = true;
        },
        {
            id             = "NL-VINTED";
            countryId      = "NL";
            methodName     = "Vinted";
            link           = "https://www.vinted.nl/items/7695780909-book-the-gospel-of-poetic-frolic";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#09B1BA";
            fontColor      = "#FFFFFF";
            buzzingEnabled = false;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 5;
            enabled        = true;
        },
        {
            id             = "NL-REVOLUT";
            countryId      = "NL";
            methodName     = "Revolut";
            link           = "https://revolut.me/meliciosergio";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#000000";
            fontColor      = "#FFFFFF";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 6;
            enabled        = true;
        },
    ];

    // ── Default Bitcoin option template (applied to every country) ───────────
    func _defaultBitcoinOption(countryId : Text) : Types.PaymentOption {
        {
            id             = countryId # "-BITCOIN";
            countryId;
            methodName     = "Bitcoin";
            link           = "";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#F7931A";
            fontColor      = "#FFFFFF";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 99;
            enabled        = true;
        }
    };

    /// Returns true if the given country already has a Bitcoin payment option.
    /// Checks BOTH the canonical option ID key AND a full methodName scan so that
    /// no existing entry is ever overwritten, regardless of how the option was added.
    func _hasBitcoin(paymentOptions : Map.Map<Text, Types.PaymentOption>, countryId : Text) : Bool {
        // Fast path: check the canonical key that this code would insert.
        switch (paymentOptions.get(countryId # "-BITCOIN")) {
            case (?_) { return true };
            case null {};
        };
        // Defensive scan: also check by methodName in case admin used a different ID.
        for ((_, opt) in paymentOptions.entries()) {
            if (opt.countryId == countryId and opt.methodName == "Bitcoin") {
                return true;
            };
        };
        false
    };

    /// Seed default countries and NL payment options on first deploy,
    /// then ensure every country has a Bitcoin option.
    public func seedDefaults(
        paymentCountries : Map.Map<Text, Types.PaymentCountry>,
        paymentOptions   : Map.Map<Text, Types.PaymentOption>,
    ) {
        if (paymentCountries.size() == 0) {
            for (country in defaultCountries.vals()) {
                paymentCountries.add(country.id, country);
            };
        };
        if (paymentOptions.size() == 0) {
            for (option in defaultOptions.vals()) {
                paymentOptions.add(option.id, option);
            };
        };
        // Ensure every country has a Bitcoin option (idempotent).
        ensureBitcoinForAllCountries(paymentCountries, paymentOptions);
    };

    /// Public utility: loops through all countries and adds a Bitcoin payment
    /// option to any country that does not already have one. Idempotent.
    public func ensureBitcoinForAllCountries(
        paymentCountries : Map.Map<Text, Types.PaymentCountry>,
        paymentOptions   : Map.Map<Text, Types.PaymentOption>,
    ) {
        for ((_, country) in paymentCountries.entries()) {
            if (not _hasBitcoin(paymentOptions, country.id)) {
                let opt = _defaultBitcoinOption(country.id);
                paymentOptions.add(opt.id, opt);
            };
        };
    };

    // ── Default Ethereum option template (applied to every country) ─────────
    func _defaultEthereumOption(countryId : Text) : Types.PaymentOption {
        {
            id             = countryId # "-ETHEREUM";
            countryId;
            methodName     = "Ethereum";
            link           = "";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#627EEA";
            fontColor      = "#FFFFFF";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 98;
            enabled        = true;
        }
    };

    /// Returns true if the given country already has an Ethereum payment option.
    /// Checks BOTH the canonical option ID key AND a full methodName scan so that
    /// no existing entry is ever overwritten, regardless of how the option was added.
    func _hasEthereum(paymentOptions : Map.Map<Text, Types.PaymentOption>, countryId : Text) : Bool {
        // Fast path: check the canonical key that this code would insert.
        switch (paymentOptions.get(countryId # "-ETHEREUM")) {
            case (?_) { return true };
            case null {};
        };
        // Defensive scan: also check by methodName in case admin used a different ID.
        for ((_, opt) in paymentOptions.entries()) {
            if (opt.countryId == countryId and opt.methodName == "Ethereum") {
                return true;
            };
        };
        false
    };

    // ── Default ICP option template (applied to every country) ───────────────
    func _defaultIcpOption(countryId : Text) : Types.PaymentOption {
        {
            id             = countryId # "-ICP";
            countryId;
            methodName     = "ICP";
            link           = "";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#29ABE2";
            fontColor      = "#FFFFFF";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "+ €4.95 shipping";
            sortOrder      = 97;
            enabled        = true;
        }
    };

    /// Returns true if the given country already has an ICP payment option.
    /// Checks BOTH the canonical option ID key AND a full methodName scan so that
    /// no existing entry is ever overwritten, regardless of how the option was added.
    func _hasIcp(paymentOptions : Map.Map<Text, Types.PaymentOption>, countryId : Text) : Bool {
        // Fast path: check the canonical key that this code would insert.
        switch (paymentOptions.get(countryId # "-ICP")) {
            case (?_) { return true };
            case null {};
        };
        // Defensive scan: also check by methodName in case admin used a different ID.
        for ((_, opt) in paymentOptions.entries()) {
            if (opt.countryId == countryId and opt.methodName == "ICP") {
                return true;
            };
        };
        false
    };

    /// Public utility: loops through all countries and adds an Ethereum payment
    /// option to any country that does not already have one. Idempotent.
    public func ensureEthereumForAllCountries(
        paymentCountries : Map.Map<Text, Types.PaymentCountry>,
        paymentOptions   : Map.Map<Text, Types.PaymentOption>,
    ) {
        for ((_, country) in paymentCountries.entries()) {
            if (not _hasEthereum(paymentOptions, country.id)) {
                let opt = _defaultEthereumOption(country.id);
                paymentOptions.add(opt.id, opt);
            };
        };
    };

    /// Public utility: loops through all countries and adds an ICP payment
    /// option to any country that does not already have one. Idempotent.
    public func ensureIcpForAllCountries(
        paymentCountries : Map.Map<Text, Types.PaymentCountry>,
        paymentOptions   : Map.Map<Text, Types.PaymentOption>,
    ) {
        for ((_, country) in paymentCountries.entries()) {
            if (not _hasIcp(paymentOptions, country.id)) {
                let opt = _defaultIcpOption(country.id);
                paymentOptions.add(opt.id, opt);
            };
        };
    };

    // ── Default Creditcard option template (applied to every country) ────────
    func _defaultCreditcardOption(countryId : Text) : Types.PaymentOption {
        {
            id             = countryId # "-CREDITCARD";
            countryId;
            methodName     = "Creditcard";
            link           = "https://payment-links.mollie.com/payment/LuQNwLdn4JoBgHRBsupHD";
            logoUrl        = "";
            logoStorageKey = "";
            buttonColor    = "#1a1a1a";
            fontColor      = "#ffffff";
            buzzingEnabled = true;
            priceEuro      = "€39.39";
            shippingEuro   = "€0.00";
            sortOrder      = 96;
            enabled        = true;
        }
    };

    /// Returns true if the given country already has a Creditcard payment option.
    /// Checks BOTH the canonical option ID key AND a full methodName scan so that
    /// no existing entry is ever overwritten, regardless of how the option was added.
    func _hasCreditcard(paymentOptions : Map.Map<Text, Types.PaymentOption>, countryId : Text) : Bool {
        // Fast path: check the canonical key that this code would insert.
        switch (paymentOptions.get(countryId # "-CREDITCARD")) {
            case (?_) { return true };
            case null {};
        };
        // Defensive scan: also check by methodName in case admin used a different ID.
        for ((_, opt) in paymentOptions.entries()) {
            if (opt.countryId == countryId and opt.methodName == "Creditcard") {
                return true;
            };
        };
        false
    };

    /// Public utility: loops through all countries and adds a Creditcard payment
    /// option to any country that does not already have one. Idempotent.
    public func ensureCreditcardForAllCountries(
        paymentCountries : Map.Map<Text, Types.PaymentCountry>,
        paymentOptions   : Map.Map<Text, Types.PaymentOption>,
    ) {
        for ((_, country) in paymentCountries.entries()) {
            if (not _hasCreditcard(paymentOptions, country.id)) {
                let opt = _defaultCreditcardOption(country.id);
                paymentOptions.add(opt.id, opt);
            };
        };
    };

    // ── Default shared payment logos ─────────────────────────────────────────
    let defaultSharedLogos : [Types.SharedPaymentLogo] = [
        { id = "bitcoin";      name = "Bitcoin (BTC)";      logoUrl = "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg";                                                      logoStorageKey = "" },
        { id = "ethereum";     name = "Ethereum (ETH)";     logoUrl = "https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg";                                            logoStorageKey = "" },
        { id = "icp";          name = "ICP";                logoUrl = "https://upload.wikimedia.org/wikipedia/commons/5/58/Internet_Computer_%28ICP%29_logo.svg";                              logoStorageKey = "" },
        { id = "ideal";        name = "iDEAL";              logoUrl = "https://upload.wikimedia.org/wikipedia/commons/b/b0/IDeal_Logo.svg";                                                    logoStorageKey = "" },
        { id = "creditcard";   name = "Creditcard / Visa";  logoUrl = "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg";                                               logoStorageKey = "" },
        { id = "paypal";       name = "PayPal";             logoUrl = "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg";                                                        logoStorageKey = "" },
        { id = "revolut";      name = "Revolut";            logoUrl = "https://upload.wikimedia.org/wikipedia/commons/8/86/Revolut_logo.svg";                                                  logoStorageKey = "" },
        { id = "vinted";       name = "Vinted";             logoUrl = "https://upload.wikimedia.org/wikipedia/commons/2/2a/Vinted_logo.svg";                                                   logoStorageKey = "" },
        { id = "bolcom";       name = "Bol.com";            logoUrl = "https://upload.wikimedia.org/wikipedia/commons/8/8a/Bol.com_Logo.svg";                                                  logoStorageKey = "" },
        { id = "bancontact";   name = "Bancontact";         logoUrl = "https://upload.wikimedia.org/wikipedia/commons/6/62/Bancontact_logo.png";                                               logoStorageKey = "" },
        { id = "eps";          name = "EPS";                logoUrl = "https://upload.wikimedia.org/wikipedia/commons/5/52/EPS_%28Electronic_Payment_Standard%29.png";                         logoStorageKey = "" },
        { id = "przelewy24";   name = "Przelewy24";         logoUrl = "https://upload.wikimedia.org/wikipedia/commons/c/c4/Logo_Przelewy24.svg";                                               logoStorageKey = "" },
        { id = "kbc";          name = "KBC/CBC";            logoUrl = "https://upload.wikimedia.org/wikipedia/commons/a/a9/KBC_Bank_logo.svg";                                                 logoStorageKey = "" },
        { id = "belfius";      name = "Belfius";            logoUrl = "https://upload.wikimedia.org/wikipedia/commons/6/64/Belfius_logo.svg";                                                  logoStorageKey = "" },
        { id = "sepa";         name = "SEPA";               logoUrl = "https://upload.wikimedia.org/wikipedia/commons/1/19/SEPA_logo.svg";                                                     logoStorageKey = "" },
        { id = "satispay";     name = "Satispay";           logoUrl = "https://upload.wikimedia.org/wikipedia/commons/f/f0/Satispay_logo.svg";                                                 logoStorageKey = "" },
        { id = "mbway";        name = "MB Way";             logoUrl = "https://upload.wikimedia.org/wikipedia/commons/7/71/MB_Way_logo.png";                                                   logoStorageKey = "" },
        { id = "multibanco";   name = "Multibanco";         logoUrl = "https://upload.wikimedia.org/wikipedia/commons/1/14/Multibanco.svg";                                                    logoStorageKey = "" },
        { id = "trustly";      name = "Trustly";            logoUrl = "https://upload.wikimedia.org/wikipedia/commons/5/5e/Trustly_logo.svg";                                                  logoStorageKey = "" },
    ];

    /// Seed shared payment logos on first deploy (idempotent).
    public func seedSharedLogos(sharedLogos : Map.Map<Text, Types.SharedPaymentLogo>) {
        if (sharedLogos.size() == 0) {
            for (logo in defaultSharedLogos.vals()) {
                sharedLogos.add(logo.id, logo);
            };
        };
    };
};
