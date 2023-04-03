import request from 'request';
import { settings } from '../settings';
import { writeFile } from 'fs/promises';


import SteamTradeOfferManager from "steam-tradeoffer-manager";
export interface invResponse {
    assets:                Asset[];
    descriptions:          rawItem[];
    total_inventory_count: number;
    success:               number;
    rwgrsn:                number;
}

export interface doubleRawItem {
    appid:                         number;
    classid:                       string;
    instanceid:                    string;
    currency:                      number;
    background_color:              string;
    icon_url:                      string;
    icon_url_large:                string;
    descriptions?:                 DescriptionDescription[];
    tradable:                      number;
    actions:                       Action[];
    name:                          string;
    name_color:                    string;
    type:                          string;
    market_name:                   string;
    market_hash_name:              string;
    market_actions?:               Action[];
    commodity:                     number;
    market_tradable_restriction:   number;
    market_marketable_restriction: number;
    marketable:                    number;
    tags:                          Tag[];
    fraudwarnings?:                string[];

    contextid:  string;
    assetid:    string;

    amount:     string;
}

export interface Asset  {
    appid:      number;
    contextid:  string;
    assetid:    string;
    classid:    string;
    instanceid: string;
    amount:     string;
}

export interface rawItem {
    appid:                         number;
    classid:                       string;
    instanceid:                    string;
    currency:                      number;
    background_color:              string;
    icon_url:                      string;
    icon_url_large:                string;
    descriptions?:                 DescriptionDescription[];
    tradable:                      number;
    actions:                       Action[];
    name:                          string;
    name_color:                    string;
    type:                          string;
    market_name:                   string;
    market_hash_name:              string;
    market_actions?:               Action[];
    commodity:                     number;
    market_tradable_restriction:   number;
    market_marketable_restriction: number;
    marketable:                    number;
    tags:                          Tag[];
    fraudwarnings?:                string[];
}

export interface Action {
    link: string;
    name: Name;
}

export enum Name {
    InspectInGame = "Inspect in Game...",
    ItemWikiPage = "Item Wiki Page...",
}



export interface DescriptionDescription {
    value:  string;
    color?: string;
    type?:  string;
}



export interface Tag {
    category:                Category;
    internal_name:           string;
    localized_category_name: Category;
    localized_tag_name:      string;
    color?:                  string;
}

export enum Category {
    Class = "Class",
    Collection = "Collection",
    Grade = "Grade",
    Quality = "Quality",
    Rarity = "Rarity",
    Type = "Type",
}

function parseInvResponse(invApiResponse: invResponse): doubleRawItem[] {
    let returnItems: doubleRawItem[] = []
    for (let asset of invApiResponse.assets) {
        let description = invApiResponse.descriptions.filter(item => (
            item.instanceid == asset.instanceid
            && item.classid == asset.classid
        ))[0]
        if (!description) {
            throw "why is there no description"    
        }
        if (description.tradable != 0) {
            returnItems.push({
                ...description,
                assetid: asset.assetid,
                amount: asset.amount,
                contextid: "2"
            })
        }
    }
    return returnItems
}


export async function proxyLoadInv(steamId: string): Promise<doubleRawItem[]> {
    const requestOptions = {
        url: "https://steamcommunity.com/inventory/" + steamId + "/440/2?count=5000",
        proxy: settings.proxyUrl,
        json: true
    };

    const resp = await new Promise<request.Response>((resolve, reject) => {
        request.get(requestOptions, (error, response, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      

    if (resp.statusCode != 200) {
        console.log("Proxy inv Request Failed, for steamid " + steamId + " " + resp.statusCode)
        return await proxyLoadInv(steamId)
    }

    return parseInvResponse(resp.body)
}