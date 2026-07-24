import Map "mo:core/Map";
import Types "../types/amazon-regions";

module {
    let defaultRegions : [Types.AmazonRegion] = [
        {
            id = "AU"; country = "Australia"; domain = "www.amazon.com.au";
            kindleLink    = "https://www.amazon.com.au/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.com.au/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.com.au/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "AUD"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "BE"; country = "Belgium"; domain = "www.amazon.com.be";
            kindleLink    = "https://www.amazon.com.be/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.com.be/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.com.be/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "EUR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "BR"; country = "Brazil"; domain = "www.amazon.com.br";
            kindleLink    = "https://www.amazon.com.br/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.com.br/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.com.br/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "BRL"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "CA"; country = "Canada"; domain = "www.amazon.ca";
            kindleLink    = "https://www.amazon.ca/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.ca/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.ca/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "CAD"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "CN"; country = "China"; domain = "www.amazon.cn";
            kindleLink    = "https://www.amazon.cn/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.cn/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.cn/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "CNY"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "EG"; country = "Egypt"; domain = "www.amazon.eg";
            kindleLink    = "https://www.amazon.eg/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.eg/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.eg/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "EGP"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "FR"; country = "France"; domain = "www.amazon.fr";
            kindleLink    = "https://www.amazon.fr/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.fr/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.fr/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "EUR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "DE"; country = "Germany"; domain = "www.amazon.de";
            kindleLink    = "https://www.amazon.de/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.de/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.de/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "EUR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "IN"; country = "India"; domain = "www.amazon.in";
            kindleLink    = "https://www.amazon.in/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.in/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.in/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "INR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "IT"; country = "Italy"; domain = "www.amazon.it";
            kindleLink    = "https://www.amazon.it/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.it/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.it/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "EUR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "JP"; country = "Japan"; domain = "www.amazon.co.jp";
            kindleLink    = "https://www.amazon.co.jp/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.co.jp/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.co.jp/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "JPY"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "MX"; country = "Mexico"; domain = "www.amazon.com.mx";
            kindleLink    = "https://www.amazon.com.mx/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.com.mx/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.com.mx/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "MXN"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "NL"; country = "Netherlands"; domain = "www.amazon.nl";
            kindleLink    = "https://www.amazon.co.uk/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.nl/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.com/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "EUR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "PL"; country = "Poland"; domain = "www.amazon.pl";
            kindleLink    = "https://www.amazon.pl/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.pl/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.pl/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "PLN"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "SA"; country = "Saudi Arabia"; domain = "www.amazon.sa";
            kindleLink    = "https://www.amazon.sa/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.sa/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.sa/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "SAR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "SG"; country = "Singapore"; domain = "www.amazon.sg";
            kindleLink    = "https://www.amazon.sg/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.sg/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.sg/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "SGD"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "ES"; country = "Spain"; domain = "www.amazon.es";
            kindleLink    = "https://www.amazon.es/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.es/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.es/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "EUR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "SE"; country = "Sweden"; domain = "www.amazon.se";
            kindleLink    = "https://www.amazon.se/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.se/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.se/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "EUR"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "TR"; country = "Turkey"; domain = "www.amazon.com.tr";
            kindleLink    = "https://www.amazon.com.tr/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.com.tr/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.com.tr/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "TRY"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "AE"; country = "United Arab Emirates"; domain = "www.amazon.ae";
            kindleLink    = "https://www.amazon.ae/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.ae/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.ae/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = false;
            currencySymbol = "AED"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "GB"; country = "United Kingdom"; domain = "www.amazon.co.uk";
            kindleLink    = "https://www.amazon.co.uk/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.co.uk/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.co.uk/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "GBP"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
        {
            id = "US"; country = "United States"; domain = "www.amazon.com";
            kindleLink    = "https://www.amazon.com/dp/B0GNN2N55K";
            paperbackLink = "https://www.amazon.com/dp/B0GNJ1MMW4";
            hardcoverLink = "https://www.amazon.com/dp/B0GQ372WBH";
            kindleButtonText = "Kindle e-Book"; paperbackButtonText = "AMZ Paperback"; hardcoverButtonText = "Special Ilustr. Hardcover";
            kindleButtonColor = "#FF9900"; paperbackButtonColor = "#FF9900"; hardcoverButtonColor = "#1a1a1a";
            kindleFontColor = "#000000"; paperbackFontColor = "#000000"; hardcoverFontColor = "#ffffff";
            showKindleUnlimited = true;
            currencySymbol = "USD"; kindlePrice = "4.99"; paperbackPrice = "10.99"; hardcoverPrice = "69.99";
            enabled = true;
        },
    ];

    // Seed the map with defaults if it is empty (first deploy only).
    public func seedDefaults(amazonRegions : Map.Map<Text, Types.AmazonRegion>) {
        if (amazonRegions.size() == 0) {
            for (region in defaultRegions.vals()) {
                amazonRegions.add(region.id, region);
            };
        };
    };
};
