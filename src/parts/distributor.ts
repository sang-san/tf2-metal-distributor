import { doubleRawItem } from "../helperFunctions/proxyLoadInv";
import { Bot, settings } from "../settings";
import { Tools } from "../tools";




export class Distributor extends Tools {
    public activeBotLoadTimes: {
        [index: string]: number
    } = {}

    constructor() {
        super()
        if (!settings.activeBots.length) {
            throw "Can't run with no active Bots"
        }
        for (let bot of settings.activeBots) {
            this.activeBotLoadTimes[bot.steamId] = 0
        }
    }



    getDistributorBotSideOfExchangeWithBot(
        bot: Bot,
        botItems : doubleRawItem[]
    ): {
        chosenBotItems: doubleRawItem[],
        ourNameAmounts: {[index: string]: number},
        botNameAmounts: {[index: string]: number}
    } {
        let theirPure = this.filterItemsToPureOnly(botItems)

        let ourNameAmounts: {[index: string]: number} = {}
        
        let botNameAmounts: {[index: string]: number} = {}
        let chosenBotItems: doubleRawItem[] = []

        if (bot.minRef > theirPure.refined.length) {
            //ourNameAmounts["Mann Co. Supply Crate Key"] = 
            ourNameAmounts["Refined Metal"] = bot.minRef - theirPure.refined.length + 50 // as balance
        }
        if (bot.maxRef < theirPure.refined.length) {
            //ourNameAmounts["Mann Co. Supply Crate Key"] = 
            let amount = theirPure.refined.length - bot.maxRef + 50
            chosenBotItems.push(...this.filterForItemName(
                "Refined Metal",
                botItems,
                amount  // puffer
            ))
            botNameAmounts["Refined Metal"] = amount 
        }

        if (bot.minKeys > theirPure.keys.length) {
            ourNameAmounts["Mann Co. Supply Crate Key"] = bot.minKeys - theirPure.keys.length + 25 // as balance
        }
        if (bot.maxKeys < theirPure.keys.length) {
            //ourNameAmounts["Mann Co. Supply Crate Key"] = 
            let amount = theirPure.keys.length - bot.maxKeys + 5
            chosenBotItems.push(...this.filterForItemName(
                "Mann Co. Supply Crate Key",
                botItems,
                amount  // puffer
            ))
            botNameAmounts["Mann Co. Supply Crate Key"] = amount 
        }


        return {
            chosenBotItems: chosenBotItems,
            ourNameAmounts: ourNameAmounts,
            botNameAmounts: botNameAmounts
        }
    }

    getLongestUnCheckedBot(): Bot {
        let reversed: {
            [index: number]: string
        } = this.reverseObject(this.activeBotLoadTimes)
        let correctSteamId = reversed[Math.min(
            ...Object.keys(reversed).map(str => Number(str))
        )]
        return settings.activeBots.filter(bot => bot.steamId == correctSteamId)[0]
    }

    updateLastCheckedForSteamId(steamId: string) {
        if (Object.keys(this.activeBotLoadTimes).includes(steamId)) {
            this.activeBotLoadTimes[steamId] = Math.floor(Date.now() / 1000);
        }
    }
    // prob want to implement
}