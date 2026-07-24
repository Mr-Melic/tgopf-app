module {
    /// A single donation entry displayed in the footer.
    /// column: 1 = left, 2 = middle, 3 = right.
    /// position: 1–6 (row within the column).
    public type DonationEntry = {
        id       : Text;
        name     : Text;   // method / name, e.g. "Ethereum"
        address  : Text;   // wallet address or payment link
        column   : Nat;    // 1 | 2 | 3
        position : Nat;    // 1 – 6
    };
};
