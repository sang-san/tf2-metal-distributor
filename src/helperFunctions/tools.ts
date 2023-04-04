import SteamTradeOfferManager, { EconItem } from "steam-tradeoffer-manager";
import { doubleRawItem } from "./proxyLoadInv";

export var itemIsCraftable = (item: doubleRawItem) => {
    if (!item.descriptions) { 
        return true
    }
    for (let i = 0; i < item.descriptions.length; i++) {
        if (item.descriptions[i].value == '( Not Usable in Crafting )') {
            return false;
        }
    }

    return true;
}

export var get_pure_item_count = (inv: doubleRawItem[]) => {
    let returnObj = {
        "keys": 0,
        "ref": 0,
        "rec": 0,
        "scrap": 0
    }
    
    for (const item of inv) {
        switch (item.market_name) {
            case "Mann Co. Supply Crate Key":
                returnObj["keys"] ++
                break;
            case "Refined Metal":
                returnObj["ref"] ++
                break;
            case "Reclaimed Metal":
                returnObj["rec"] ++
                break;
            case "Scrap Metal":
                returnObj["scrap"] ++
                break;
        }
    }
    
    return returnObj
}

export function itemListToString (itemList: doubleRawItem[]): string {
    var returnString = ""
    var itemDict: {
        [index: string]: number
    } = {}
    
    for (let index in itemList) {
        if (itemList[index].market_name in itemDict) {
            itemDict[itemList[index].market_name] += 1
        } else {
            itemDict[itemList[index].market_name] = 1
        }
    }

    for (let key in itemDict) {
        returnString += " " + key + " : " + itemDict[key]
    }

    return returnString

}

export function itemIsSpell(item: EconItem): boolean {
    for (const description of item.descriptions) {
        if (description.value.includes("(spell only active during event)")) {
            return true;
        }
    }

    return false;
}

export function getOfferMessage() {
    return ""
}