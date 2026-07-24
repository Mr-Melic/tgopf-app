import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import OrderedMap "mo:base/OrderedMap";

module {
  public func migrateOrderedMap<K, V>(old : OrderedMap.Map<K, V>, compare : (K, K) -> Order.Order) : Map.Map<K, V> {
    let ops = OrderedMap.Make(compare);
    let new = Map.empty<K, V>();
    for ((k, v) in ops.entries(old)) {
      new.add(k, v);
    };
    new;
  };

  // Access control state migration
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  public type OldAccessControlState = {
    var adminAssigned : Bool;
    var userRoles : OrderedMap.Map<Principal, UserRole>;
  };

  public type NewAccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  public func migrateAccessControlState(old : OldAccessControlState) : NewAccessControlState {
    {
      var adminAssigned = old.adminAssigned;
      userRoles = migrateOrderedMap<Principal, UserRole>(old.userRoles, Principal.compare);
    };
  };
};
