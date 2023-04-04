import { settings } from "../settings";
import { loadInv, sendOffer, acceptOffer } from "./promisedFunctions";
import { SnapshotListing } from "./getListingSnapshot";
import { getOfferMessage, get_pure_item_count, itemIsCraftable, itemListToString } from "./tools";


import { Currency } from "tf2-currency"
import TradeOfferManager from 'steam-tradeoffer-manager';
import SteamTradeOfferManager from "steam-tradeoffer-manager";
import PricesTF, {RequestOptions, parsePrice} from "prices-tf-wrapper";
import {CurrencyExchange} from 'tf2-currency-exchange';
import { getTradeUrl } from "./getTradeUrl";
import { doubleRawItem, proxyLoadInv } from "./proxyLoadInv";

const SteamCommunity = require('steamcommunity');

const api = new PricesTF();

export interface items_to_pick {
    [index: string]: {
        amount: number,
        is_craftable: boolean
    }
}

function convertDoubleRawItemsToTradeOfferItems(items: doubleRawItem[]): SteamTradeOfferManager.TradeOfferItem[] {
	return items.map((item) => ({
		assetid: item.assetid,
		appid: 440,
		contextid: item.contextid,
		id: item.assetid,
		amount: 1
	}))
}

function actually_pick_items(
	inv: Array<doubleRawItem>,
	items_to_pick: items_to_pick
): {
	worked: boolean,
	items: Array<doubleRawItem>
} {
	var items_to_return: Array<doubleRawItem> = []
	for (let key in items_to_pick) {
		var items = inv.filter(item => item.market_name == key && itemIsCraftable(item) == items_to_pick[key].is_craftable)
		if (items.length < items_to_pick[key].amount) {
			return {
				worked: false,
				items: []
			}
		} else {
			items_to_return = items_to_return.concat(items.splice(0, items_to_pick[key].amount))
		}
	}

	return {
		worked: true,
		items: items_to_return
	}
}

async function pick_items(
    name: string,
    listing: SnapshotListing,
    item_buyer_inv: Array<doubleRawItem>,
	item_holder_inv: Array<doubleRawItem>,
	isCraftable: boolean,
	is_key_sell: boolean
): Promise<{
	worked: boolean,
	item_buyer_items: Array<doubleRawItem>,
	item_holder_items: Array<doubleRawItem>,
}> {
    console.log("Picking Items for " + name)
    var key_price = parsePrice(await api.getPrice('5021;6')).buy.metal;

    var items_to_pick_for_item_buyer: items_to_pick = {}
	var items_to_pick_for_item_holder: items_to_pick = {
		[name]: {
			"amount": 1,
			"is_craftable": isCraftable 
		}
	}

    var currency_exchange = new CurrencyExchange({
		"buyInventory": get_pure_item_count(item_buyer_inv),
		"sellInventory": (!is_key_sell) ? get_pure_item_count(item_holder_inv) : {
			"keys": 0,
			"ref": 0,
			"rec": 0,
			"scrap": 0
		},
		"price": new Currency({
            "keys": listing.currencies.keys,
            "metal": listing.currencies.metal
        }),
		"keyPrice": (is_key_sell) ? 1000 : key_price
	})
    var res = currency_exchange.trade()

	if (res.missing != 0) {
		return {
			worked: false,
			item_buyer_items: [],
			item_holder_items: []
		}
	}

    items_to_pick_for_item_buyer["Mann Co. Supply Crate Key"] = {"amount": res.buyer.keys, "is_craftable": true}
	items_to_pick_for_item_buyer["Refined Metal"] = {"amount": res.buyer.ref, "is_craftable": true}
	items_to_pick_for_item_buyer["Reclaimed Metal"] = {"amount": res.buyer.rec, "is_craftable": true}
	items_to_pick_for_item_buyer["Scrap Metal"] = {"amount": res.buyer.scrap, "is_craftable": true}
	
	if (!is_key_sell) {
		items_to_pick_for_item_holder["Mann Co. Supply Crate Key"] = {"amount": res.seller.keys, "is_craftable": true}
		items_to_pick_for_item_holder["Refined Metal"] = {"amount": res.seller.ref, "is_craftable": true}
		items_to_pick_for_item_holder["Reclaimed Metal"] = {"amount": res.seller.rec, "is_craftable": true}
		items_to_pick_for_item_holder["Scrap Metal"] = {"amount": res.seller.scrap, "is_craftable": true}
	}
    
	var item_buyer_res = actually_pick_items(item_buyer_inv, items_to_pick_for_item_buyer)
	var item_holder_res = actually_pick_items(item_holder_inv, items_to_pick_for_item_holder)

	return {
		worked: (item_buyer_res.worked && item_holder_res.worked) ? true : false,
		item_buyer_items: item_buyer_res.items,
		item_holder_items: item_holder_res.items
	}
}

export async function doListing(
    name: string,
    isCraftable: boolean,
    listing: SnapshotListing,
    manager: TradeOfferManager,
    community: any, //SteamCommunity
    botInv: doubleRawItem[]
): Promise<boolean> {
    var partnerInv = await proxyLoadInv(listing.steamid)

    console.log("The Bot has " + botInv.length + " Items and the Partner " + listing.steamid + " : " + partnerInv.length + " Items.")



    var picked_items = await pick_items(
		name,
        listing,
		(listing.intent == "buy") ? partnerInv: botInv,
		(listing.intent == "buy") ? botInv : partnerInv,
		isCraftable,
		name === "Mann Co. Supply Crate Key"
	)
    console.log(picked_items.worked)
    console.log("Item Buyer Items: " + itemListToString(picked_items.item_buyer_items))
    console.log("Item Holder Items: " + itemListToString(picked_items.item_holder_items))
    
	if (!picked_items.worked) {
		return false;
	}

    let urlRes = await getTradeUrl(listing.steamid)
    if (!urlRes.got_it) {
        console.log("Picking Items worked on " + name + " but failed to get trade url for " + listing.steamid)
        return false;
    }

    let offer = manager.createOffer(urlRes.url);	

	offer.addMyItems((listing.intent == "buy") ? convertDoubleRawItemsToTradeOfferItems(picked_items.item_holder_items) : convertDoubleRawItemsToTradeOfferItems(picked_items.item_buyer_items));
	offer.addTheirItems((listing.intent == "buy") ? convertDoubleRawItemsToTradeOfferItems(picked_items.item_buyer_items) : convertDoubleRawItemsToTradeOfferItems(picked_items.item_holder_items));
	
	offer.setMessage(getOfferMessage());
	var status = await sendOffer(offer)

    if (status == 'pending') {
		// We need to confirm it
		console.log(`Offer #${offer.id} sent, but requires confirmation`);
		
		var err_of_confirmation = await acceptOffer(community, offer)
        
        return true

		//console.log("Offer confirmed");
		//await waitForOfferOrTimeout(offer.id, 2*60*1000)

		//if (trades[Number(offer.id)] == 3) {
		//	client.chat.sendFriendMessage(option_dct.owner_steam, "Listing for " + listing.listing_name + "was accepted for "+ listing.currencies.keys + " Keys and " + listing.currencies.metal + " Ref "  + "The End Code Was "+ trades[Number(offer.id)]);
		//	return true;
		//} {
		//	client.chat.sendFriendMessage(option_dct.owner_steam, "Listing for " + listing.listing_name + "was not accepted for " + listing.currencies.keys + " Keys and " + listing.currencies.metal + " Ref " );
		//	return false;
		//}
			
		
	} else {
		console.log(`Offer #${offer.id} sent successfully`);
	}

    return true
}