import SteamTradeOfferManager from "steam-tradeoffer-manager";
import { acceptOffer, loadInv, sendOffer } from "./helperFunctions/promisedFunctions";
import { doubleRawItem, proxyLoadInv } from "./helperFunctions/proxyLoadInv";




export class Tools {
    public pureNames = [
        "Scrap Metal",
        "Reclaimed Metal",
        "Refined Metal",
        "Mann Co. Supply Crate Key"
    ]

    constructor() {}

    filterForItemName(
        name: string,
        items: doubleRawItem[],
        maxAmount: number
    ) {
        let returnLst = []
        for (let i in items) {
            if (returnLst.length >= maxAmount) {
                return returnLst
            }

            if (items[i].market_name == name) {
                returnLst.push(items[i])
            }
        }

        return returnLst
    }

    convertdoubleRawItemsToTradeOfferItems(items: doubleRawItem[]): SteamTradeOfferManager.TradeOfferItem[] {
        return items.map((item) => ({
            assetid: item.assetid,
            appid: 440,
            contextid: item.contextid,
            id: item.assetid,
            amount: 1
        }))
    }

    reverseObject(obj: object) {
        return Object.entries(obj).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});
    }

    isObjectEmpty(obj: object) {
        return Object.keys(obj).length ? false : true
    }

    async proxyLoadInv(steamId: string) {
        return await proxyLoadInv(steamId)
    }

    async loadInv(manager: SteamTradeOfferManager, steam_id: any) {
        return await loadInv(manager, steam_id)
    }
    
    async acceptOffer(community: any, offer: any) {
        return await acceptOffer(community, offer)
    }

    async sendOffer(offer: any) {
        return await sendOffer(offer)
    }

    filterItemsToPureOnly(items: doubleRawItem[]) {
        return {
            scrap: items.filter(item => item.name == "Scrap Metal"),
            rec: items.filter(item => item.name == "Reclaimed Metal"),
            refined: items.filter(item => item.name == "Refined Metal"),
            keys: items.filter(item => item.name == "Mann Co. Supply Crate Key")
        } // fix ? 
    }

    //async pureOnlyLoadInv(manager: SteamTradeOfferManager, steam_id: any) {
    //    let items = await this.loadInv(manager, steam_id)
    //    return this.filterItemsToPureOnly(items)
    //}

    async pureOnlyProxyLoadInv(steam_id: any) {
        return this.filterItemsToPureOnly(await this.proxyLoadInv(steam_id))
    }
}