/// Identity implicit instance: `OQL.Value -> OQL.Value`.
///
/// The OQL `.payload` builder takes an implicit `V -> Value` per field
/// type. Several entity declarations in `main.mo` extract a field already
/// shaped as an `OQL.Value` (e.g. `#text r.id`, or via the
/// `_optTextToValue` / `_optNatToValue` helpers), so `V = Value` and the
/// required implicit is the identity conversion. The compiler walks
/// imported module fields when resolving implicits, so importing this
/// module into `main.mo` makes the identity instance available without
/// any per-call annotation. Mirrors the `TextValue.mo` pattern in
/// `caffeineai-oql` (a top-level `module { public func _toRow ... }`).

import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : OQL.Value) : OQL.Value = self;
};
