import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Registry "registry";
import Runtime "mo:core/Runtime";

mixin(storage : Registry.Registry) {
  type _CaffeineStorageRefillInformation = {
    proposed_top_up_amount : ?Nat;
  };

  type _CaffeineStorageRefillResult = {
    success : ?Bool;
    topped_up_amount : ?Nat;
  };

  type _CaffeineStorageCreateCertificateResult = {
    method : Text;
    blob_hash : Text;
  };

  public shared ({ caller }) func _caffeineStorageRefillCashier(refillInformation : ?_CaffeineStorageRefillInformation) : async _CaffeineStorageRefillResult {
    let cashier = await Registry.getCashierPrincipal();
    if (cashier != caller) {
      Runtime.trap("Unauthorized access");
    };
    await Registry.refillCashier(storage, cashier, refillInformation);
  };

  public shared ({ caller }) func _caffeineStorageUpdateGatewayPrincipals() : async () {
    await Registry.updateGatewayPrincipals(storage);
  };

  public query ({ caller }) func _caffeineStorageBlobsToDelete() : async [Text] {
    if (not Registry.isAuthorized(storage, caller)) {
      Runtime.trap("Unauthorized access");
    };
    let deadBlobs = Registry.getBlobsToRemove(storage);
    let limit = Nat.min(10000, deadBlobs.size());
    deadBlobs.sliceToArray(0, limit);
  };

  public shared ({ caller }) func _caffeineStorageConfirmBlobDeletion(blobs : [Text]) : async () {
    if (not Registry.isAuthorized(storage, caller)) {
      Runtime.trap("Unauthorized access");
    };
    ignore Registry.clearBlobsRemoved(storage, blobs);
  };

  public shared ({ caller }) func _caffeineStorageCreateCertificate(blob_hash : Text) : async _CaffeineStorageCreateCertificateResult {
    {
      method = "upload";
      blob_hash;
    };
  };
};
