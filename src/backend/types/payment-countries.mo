module {
    public type PaymentCountry = {
        id        : Text;
        name      : Text;
        enabled   : Bool;
        sortOrder : Nat;
        continent : Text;   // e.g. "Europe", "Americas", "Asia", "Africa", "Oceania", "Middle East"
    };

    public type PaymentOption = {
        id              : Text;
        countryId       : Text;
        methodName      : Text;
        link            : Text;
        logoUrl         : Text;
        logoStorageKey  : Text;
        buttonColor     : Text;
        fontColor       : Text;
        buzzingEnabled  : Bool;
        priceEuro       : Text;
        shippingEuro    : Text;
        sortOrder       : Nat;
        enabled         : Bool;
    };

    /// A reusable logo entry stored in a central registry so the same
    /// logo can be referenced across multiple payment options.
    public type SharedPaymentLogo = {
        id             : Text;   // unique key, e.g. "bitcoin", "ideal", "paypal"
        name           : Text;   // display name, e.g. "Bitcoin (BTC)"
        logoUrl        : Text;   // remote URL or empty if stored in blob storage
        logoStorageKey : Text;   // blob-storage key (may be empty)
    };
};
