import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Prim "mo:prim";
import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:core/Nat";

module {
  public type FileReference = {
    path : Text;
    hash : Text;
  };

  public type Registry = {
    references : Map.Map<Text, FileReference>;
    blobsToRemove : Map.Map<Text, Bool>;
    var authorizedPrincipals : [Principal];
  };

  public func new() : Registry {
    {
      references = Map.empty();
      blobsToRemove = Map.empty();
      var authorizedPrincipals = [];
    };
  };

  public func add(registry : Registry, path : Text, hash : Text) {
    let fileReference = { path; hash };
    registry.references.add(path, fileReference);
  };

  public func get(registry : Registry, path : Text) : FileReference {
    switch (registry.references.get(path)) {
      case (null) { Runtime.trap("Inexistent file reference") };
      case (?fileReference) { fileReference };
    };
  };

  // Safe variant — returns null instead of trapping when the path is missing.
  public func tryGet(registry : Registry, path : Text) : ?FileReference {
    registry.references.get(path);
  };

  public func list(registry : Registry) : [FileReference] {
    registry.references.values().toArray();
  };

  public func remove(registry : Registry, path : Text) {
    switch (registry.references.get(path)) {
      case (null) { /* File doesn't exist, nothing to remove */ };
      case (?fileReference) {
        registry.blobsToRemove.add(fileReference.hash, true);
        registry.references.remove(path);
      };
    };
  };

  public func getBlobsToRemove(registry : Registry) : [Text] {
    registry.blobsToRemove.keys().toArray();
  };

  public func clearBlobsRemoved(registry : Registry, hashesToClear : [Text]) : Nat {
    var clearedCount : Nat = 0;
    for (hash in hashesToClear.vals()) {
      let existed = registry.blobsToRemove.get(hash) != null;
      registry.blobsToRemove.remove(hash);
      if (existed) {
        clearedCount += 1;
      };
    };
    clearedCount;
  };

  public func getCashierPrincipal() : async Principal {
    switch (Prim.envVar<system>("CAFFFEINE_STORAGE_CASHIER_PRINCIPAL")) {
      case (null) {
        Runtime.trap("CAFFFEINE_STORAGE_CASHIER_PRINCIPAL environment variable is not set");
      };
      case (?cashierPrincipal) {
        Principal.fromText(cashierPrincipal);
      };
    };
  };

  // Authorization functions
  public func updateGatewayPrincipals(registry : Registry) : async () {
    let cashierPrincipal = await getCashierPrincipal();
    let cashierActor = actor (cashierPrincipal.toText()) : actor {
      storage_gateway_principal_list_v1 : () -> async [Principal];
    };
    registry.authorizedPrincipals := await cashierActor.storage_gateway_principal_list_v1();
  };

  public func isAuthorized(registry : Registry, caller : Principal) : Bool {
    registry.authorizedPrincipals.find(func(p : Principal) : Bool {
      Principal.equal(p, caller);
    }) != null;
  };

  public func refillCashier(
    _registry : Registry,
    cashier : Principal,
    refillInformation : ?{
      proposed_top_up_amount : ?Nat;
    }
  ) : async {
    success : ?Bool;
    topped_up_amount : ?Nat;
  } {
    let currentBalance = Cycles.balance();
    let reservedCycles : Nat = 400_000_000_000;
    let currentFreeCyclesCount : Nat = Nat.sub(currentBalance, reservedCycles);

    let cyclesToSend : Nat = switch (refillInformation) {
      case (null) { currentFreeCyclesCount };
      case (?info) {
        switch (info.proposed_top_up_amount) {
          case (null) { currentFreeCyclesCount };
          case (?proposed) { Nat.min(proposed, currentFreeCyclesCount) };
        };
      };
    };

    let targetCanister = actor (cashier.toText()) : actor {
      account_top_up_v1 : ({ account : Principal }) -> async ();
    };

    await (with cycles = cyclesToSend) targetCanister.account_top_up_v1({ account = Prim.getSelfPrincipal<system>() });

    {
      success = ?true;
      topped_up_amount = ?cyclesToSend;
    };
  };
};
