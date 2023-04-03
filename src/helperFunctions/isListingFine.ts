import { SnapshotListing } from "./getListingSnapshot";

import PricesTF, {RequestOptions, parsePrice} from "prices-tf-wrapper";

import { parseEconItem, toSKU} from 'tf2-item-format/static';

import TradeOfferManager, { EconItem } from 'steam-tradeoffer-manager';
import { Currencies } from "./getListingSnapshot";

export type pricesTfArray = {
    success: boolean
    items: {
        [index: string]: {
            sku: string
            name: string
            source: string
            time: number
            buy: {
                keys: number
                metal: number
            }
            sell: {
                keys: number
                metal: number
            }
        }
    }
}

const api = new PricesTF();

function getRef(currencies: any, refRate: number): number {
    let keys = (currencies.keys) ? currencies.keys : 0
    let metal = (currencies.metal) ? currencies.metal : 0
    
    return metal + (
        keys*  refRate
    )
}

const PERCENT_BELOW_PRICESTF = 0.2 
const PERCENT_BASE_ADJUSTMENT = 0.05 
const MAXIMUM_REF_DISCOUNT_TO_FIRST_LISTING = 60
 
export async function getAcceptableListings(
    item: any,
    listings: SnapshotListing[],
    jsonItemList: pricesTfArray
): Promise<SnapshotListing[]> {
    
        let refRate =  parsePrice(await api.getPrice('5021;6')).buy.metal;
        
        
        var baseListingIsAcceptable = await isBuyListingFine(
            item,
            listings[0],
            refRate,
            jsonItemList
        )
        
        if (!baseListingIsAcceptable) {
            console.log("Base Listing wasn't even acceptable")
            return [];
        }

        let refMin = getRef(listings[0].currencies, refRate) * (
            (listings[0].intent == "buy") ? (
                1 - PERCENT_BASE_ADJUSTMENT
            ) : (
                1 + PERCENT_BASE_ADJUSTMENT
            )
        )

        
        return listings.filter((listing) => {
            return (
                getRef(listing.currencies, refRate) > refMin
                && (
                    getRef(listings[0].currencies, refRate) - getRef(listing.currencies, refRate)
                ) < MAXIMUM_REF_DISCOUNT_TO_FIRST_LISTING 
            )
        })
    
}

export async function isBuyListingFine(
    item: any,
    listing: SnapshotListing,
    refRate: number,
    jsonItemList: pricesTfArray
) {
    let parsedEcon = parseEconItem(item, true, true, { useTrueDefindex: true})
    let sku = toSKU(parsedEcon)
    console.log(sku, item.market_name)


    try {
        var priceTfResponse = parsePrice(await api.getPrice(sku))
    } catch {
        console.log("choose second sku route for " + item.market_name)
        if (Object.keys(jsonItemList.items).includes(item.market_name)) {
            console.log(jsonItemList.items[item.market_name]["sku"] + " is the sku for "+ item.market_name)
            var priceTfResponse = parsePrice(await api.getPrice(
                jsonItemList.items[item.market_name]["sku"]
            ))
        } else {
            return false
        }
    }
    console.log("PriceTf Response for " + item.market_name + " is " + priceTfResponse)
    
    let listingRef = getRef(listing.currencies, refRate)
    let pricesTfRef = getRef({
        keys: priceTfResponse.buy.keys,
        metal: priceTfResponse.buy.metal 
    }, refRate) * (1 - PERCENT_BELOW_PRICESTF)

    console.log("Listing Check " + item.market_name + " ListingRef: " + getRef + " PricesTfRef: " + pricesTfRef + " Is Acceptable: " + (listingRef > pricesTfRef))
    if (listingRef < pricesTfRef) {
        return false;
    }

    return true;
}