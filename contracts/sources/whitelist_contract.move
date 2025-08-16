

module whitelist::moveWhitelistContract {

use sui::object::{Self, UID, ID};
use sui::tx_context::{Self, TxContext};
use sui::table::{Self, Table};
use sui::transfer;
use std::vector;

const ENoAccess: u64 = 1;
const EInvalidCap: u64 = 2;
const EDuplicate: u64 = 3;
const ENotInWhitelist: u64 = 4;

/// Represents a whitelist of addresses
public struct Whitelist has key {
    id: UID,
    addresses: Table<address, bool>,
}

/// Admin capability for a whitelist
public struct Cap has key {
    id: UID,
    wl_id: ID,
}

//////////////////////////////////////////
/////// Simple whitelist with an admin cap

/// Create a whitelist with an admin cap.
/// The associated key-ids are [pkg id][whitelist id][nonce] for any nonce (thus
/// many key-ids can be created for the same whitelist).
public fun create_whitelist(ctx: &mut TxContext): (Cap, Whitelist) {
    let wl = Whitelist {
        id: object::new(ctx),
        addresses: table::new(ctx),
    };
    let cap = Cap {
        id: object::new(ctx),
        wl_id: object::id(&wl),
    };
    (cap, wl)
}

/// Helper function for creating a whitelist and send it back to sender.
entry fun create_whitelist_entry(ctx: &mut TxContext) {
    let (cap, wl) = create_whitelist(ctx);
    transfer::share_object(wl);
    transfer::transfer(cap, tx_context::sender(ctx));
}

/// Add an address to the whitelist
public fun add(wl: &mut Whitelist, cap: &Cap, account: address) {
    assert!(cap.wl_id == object::id(wl), EInvalidCap);
    assert!(!table::contains(&wl.addresses, account), EDuplicate);
    table::add(&mut wl.addresses, account, true);
}

/// Remove an address from the whitelist
public fun remove(wl: &mut Whitelist, cap: &Cap, account: address) {
    assert!(cap.wl_id == object::id(wl), EInvalidCap);
    assert!(table::contains(&wl.addresses, account), ENotInWhitelist);
    table::remove(&mut wl.addresses, account);
}

//////////////////////////////////////////////////////////
/// Access control functions

/// Check if a user has access to a specific ID
/// key format: [pkg id][whitelist id][random nonce]
/// (Alternative key format: [pkg id][creator address][random nonce] - see private_data.move)
///
/// All whitelisted addresses can access all IDs with the prefix of the whitelist
fun check_policy(caller: address, id: vector<u8>, wl: &Whitelist): bool {
    // Check if the id has the right prefix
    let prefix = object::uid_to_bytes(&wl.id);
    let mut i = 0;
    if (vector::length(&prefix) > vector::length(&id)) {
        return false
    };
    while (i < vector::length(&prefix)) {
        if (*vector::borrow(&prefix, i) != *vector::borrow(&id, i)) {
            return false
        };
        i = i + 1;
    };

    // Check if user is in the whitelist
    table::contains(&wl.addresses, caller)
}

/// Entry function to check if caller has access to an ID
entry fun seal_approve(id: vector<u8>, wl: &Whitelist, ctx: &TxContext) {
    assert!(check_policy(tx_context::sender(ctx), id, wl), ENoAccess);
}


}
