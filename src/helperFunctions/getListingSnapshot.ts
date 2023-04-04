const axios = require('axios');
import { settings } from '../settings';
import  { AxiosError } from 'axios';
export declare type Intent = 'buy' | 'sell';

export declare type Attributes = {
    float_value?: number;
    defindex: number;
    value?: number | string;
};

export declare type ParsedSnapshotData = {
    worked: boolean
    buy_listings: SnapshotListing[];
    sell_listings: SnapshotListing[]
}

export declare type Currencies = {
    keys: number;
    metal: number;
    usd?: number;
};

export declare type SnapshotResponse = {
    id: null;
    listings?: SnapshotListing[];
    appid: 440;
    sku: string;
    createdAt: number;
};
export declare type SnapshotListing = {
    steamid: string;
    offers: 0 | 1;
    buyout: 0 | 1;
    details: string;
    intent: Intent;
    timestamp: number;
    bump: number;
    price: number;
    item: SnapshotItem;
    currencies: Partial<Currencies>;
    userAgent?: {
        lastPulse: number;
        client: string | '-';
    };
};
export declare type SnapshotItem = {
    id: number;
    original_id: number;
    defindex: number;
    level: number;
    quality: number;
    inventory: number;
    quantity: number;
    origin: number;
    attributes: Attributes[];
};

export var paints = [
    'Indubitably Green',
    "Zepheniah's Greed",
    "Noble Hatter's Violet",
    'Color No. 216-190-216',
    'A Deep Commitment to Purple',
    'Mann Co. Orange',
    'Muskelmannbraun',
    'Peculiarly Drab Tincture',
    'Radigan Conagher Brown',
    'Ye Olde Rustic Colour',
    'Australium Gold',
    'Aged Moustache Grey',
    'An Extraordinary Abundance of Tinge',
    'A Distinctive Lack of Hue',
    'Team Spirit',
    'Pink as Hell',
    'A Color Similar to Slate',
    'Drably Olive',
    'The Bitter Taste of Defeat and Lime',
    "The Color of a Gentlemann's Business Pants",
    'Dark Salmon Injustice',
    "Operator's Overalls",
    'Waterlogged Lab Coat',
    'Balaclavas Are Forever',
    'An Air of Debonair',
    'The Value of Teamwork',
    'Cream Spirit',
    "A Mann's Mint",
    'After Eight',
    'Balaclavas Are Forever',
]

function isSpecialListing (requiredIntent: "buy" | "sell", listing: SnapshotListing, itemName: string) {
    if (
        listing.intent != requiredIntent
        || !listing.userAgent
    ) {
        return false
    }

    if (
        [
            "76561199111029051",
            "76561199059780855"
        ].includes(listing.steamid)
    ) {
        console.log("firing")
        return false
    }

    if (Math.round(Date.now() / 1000) - listing.userAgent.lastPulse > 420) {
        return false
    }

    for (let attributeIndex in listing.item.attributes) {
        if (
            (
                listing.item.attributes[attributeIndex].defindex == 142 // paints
                && !paints.includes(itemName)
            ) || [1004, 1005, 1006, 1007, 1008, 1009].includes(
                listing.item.attributes[attributeIndex].defindex // spells 
            ) || (
                listing.item.attributes[attributeIndex].defindex == 380 // parts
            )
        ) {
            return false
        }
    }

    return true
}

export async function getListingSnapshot(
    itemName: string
): Promise<ParsedSnapshotData> {
    var url = encodeURI("https://backpack.tf/api/classifieds/listings/snapshot?sku=" + itemName + "&appid=440&token=" + settings.backpackTfAccessToken)
    console.log(url)
    try {
        var data: SnapshotResponse = (await axios.get(url)).data

        return data.listings ? {
            worked: true,
            buy_listings: data.listings.filter((listing) => isSpecialListing("buy", listing, itemName)),
            sell_listings: data.listings.filter((listing) => isSpecialListing("sell", listing, itemName))
        } : {
            worked: false,
            buy_listings: [],
            sell_listings: []
        }
    }
    catch (error) {
        const err = error as AxiosError
        console.log("Request had code: " + err.response?.status)
        console.log("Request for " + itemName + " failed backpack snapshot request" )
        return {
            worked: false,
            buy_listings: [],
            sell_listings: []
        }
    }
}

