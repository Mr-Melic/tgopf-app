/**
 * Canonical list of book titles used across the site.
 *
 * Shared by the public review filter bar, the admin review dropdown, and the
 * products manager. Order is significant — it matches the canonical product
 * order returned by the backend `getProducts()` endpoint.
 *
 * Keep this array in sync with the backend's book-title list. Do NOT inline
 * these strings in components; import `BOOK_TITLES` instead so a future rename
 * only touches one place.
 */
export const BOOK_TITLES: readonly string[] = [
  "The Gospel of Poetic Frolic",
  "Amazon TGOPF Editions",
  "Emilie and the Ruins of Azoth",
  "Emilie en de Ruïne van Azoth",
  "Het Lied van Zeemeermin Anna",
  "The Song of Anna the Mermaid",
] as const;
