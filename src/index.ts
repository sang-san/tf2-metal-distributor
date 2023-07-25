
import { exit, listenerCount } from 'process';



import PricesTF, {RequestOptions, parsePrice} from "prices-tf-wrapper";
import { Parts } from './parts/parts';
import { Tools } from "./tools";
import { settings, Bot } from './settings';
const SchemaManager = require("tf2-schema");
const SteamUser = require("steam-user")
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const TeamFortress2 = require('tf2');

import SteamTradeOfferManager from "steam-tradeoffer-manager";
import { getListingSnapshot } from './helperFunctions/getListingSnapshot';
import { doubleRawItem, proxyLoadInv } from './helperFunctions/proxyLoadInv';
import { doListing } from './helperFunctions/doListing';


const api = new PricesTF();
const FS = require('fs');




let client = new SteamUser();
let tf2 = new TeamFortress2(client)


let manager = new SteamTradeOfferManager({
	"steam": client, // Polling every 30 seconds is fine since we get notifications from Steam
	"domain": "example.com", // Our domain is example.com
	"language": "en" // We want English item descriptions
});
let community = new SteamCommunity();

if (FS.existsSync('polldata.json')) {
	manager.pollData = JSON.parse(FS.readFileSync('polldata.json').toString('utf8'));
	
}



function delay(time: any) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}


client.on('loggedOn', async function() {
	console.log("Logged into Steam");
});

client.on('webSession', async function(_sessionID: any, cookies: any) {
	manager.setCookies(cookies, function(err: any) {
		if (err) {
			console.log(err);
			process.exit(1); // Fatal error since we couldn't get our API key
			return;
		}

		console.log("Got API key: " + manager.apiKey);
		client.gamesPlayed([440]);
	});

	community.setCookies(cookies);
	//let listings = await getListingSnapshot("Mann Co. Supply Crate Key")
	//console.log(listings)
});


tf2.once("connectedToGC", function(smth: any) {
	return
})

tf2.on("craftingComplete", function(recipe: number, itemsGained: string[]) {
	console.log('itemsGained', itemsGained);
})

client.on('friendMessage', function(steamID: any, message: string) {
	console.log("Friend message from " + steamID.getSteam3RenderedID() + ": " + message);
	
});

manager.on('newOffer', async function(offer: SteamTradeOfferManager.TradeOffer) {
	console.log("New offer #" + offer.id + " from " + offer.partner.getSteamID64());


	if (
		settings.ownerSteamId == String(offer.partner.getSteamID64())
		|| !offer.itemsToGive.length
	) {
		console.log("accepting offer ")
		offer.accept(async function(err: any, status: any ) {
			
			if (err) {
				console.log("Unable to accept offer: " + err.message);
			} else {
				if (status == "pending") {
					community.acceptConfirmationForObject(settings.steamAccountIdentitySecret, offer.id, async function(err: any) {
						if (err) {
							console.log("Can't confirm trade offer: " + err.message);
						} else {
							console.log("Trade offer " + offer.id + " confirmed");
						}
					});
				}
			}
		})
	}
	return
});

manager.on('receivedOfferChanged', async function(offer: any, oldState: any) {
	console.log(`Offer #${offer.id} changed: ${SteamTradeOfferManager.ETradeOfferState[oldState]} -> ${SteamTradeOfferManager.ETradeOfferState[offer.state]}`);

	if (offer.state == SteamTradeOfferManager.ETradeOfferState.Accepted) {
		offer.getExchangeDetails((err: any, status: any, tradeInitTime: any, receivedItems: any[], sentItems: any[]) => {
			if (err) {
				console.log(`Error ${err}`);
				return;
			}
			
			// Create arrays of just the new assetids using Array.prototype.map and arrow functions
			//let newReceivedItems = receivedItems.map(item => item.market_hash_name);
			//let newSentItems = sentItems.map(item => item.market_hash_name);
			//console.log(`Received items ${newReceivedItems.join(',')} Sent Items ${newSentItems.join(',')} - status ${TradeOfferManager.ETradeOfferState[status]}`)
		})
		//await checkCrafter(tf2, option_dct);
	}
});

manager.on('sentOfferChanged', async function(offer: any, oldState: any) {
	//trades[offer.id] = offer.state;
	console.log(`Offer #${offer.id} changed: ${SteamTradeOfferManager.ETradeOfferState[oldState]} -> ${SteamTradeOfferManager.ETradeOfferState[offer.state]}`);
	//if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
		//await checkCrafter(tf2, option_dct);
	//}
});




class MetalDistributor extends Tools{
  public parts = new Parts()
  
  constructor(
    public manager: SteamTradeOfferManager,
    public client: any,
    public tf2: any,
    public community: any
  ) {
    super()
  }

  isItTimeToSellAKey(inv: doubleRawItem[]) {
	let filtered = this.filterItemsToPureOnly(inv)
	if (
		filtered.refined.length < settings.distributorMinRef
		&& filtered.keys.length
	) {
		return true;
	}

	return false;
  }

  async checkForKeySale() {
	let distributorInv = await proxyLoadInv(settings.steamAccountId)
	if (this.isItTimeToSellAKey(distributorInv)) {
		let refRate = parsePrice(await api.getPrice('5021;6')).buy.metal - 2;
		let snapShotResponse = await getListingSnapshot("Mann Co. Supply Crate Key")
		if (!snapShotResponse.buy_listings) {
			console.log("no buy listings")
			return null
		}
		let bestBuyRefRate = snapShotResponse.buy_listings[0].currencies.metal ? snapShotResponse.buy_listings[0].currencies.metal : 0
		
		console.log("Best Ref Rate in the buy Listings was " + bestBuyRefRate + " pricestf rate " + refRate)
		if (bestBuyRefRate >= refRate) {
			let goodBuyListings = snapShotResponse.buy_listings.filter(listing => (listing.currencies.metal ? listing.currencies.metal : 0) >= refRate)
			console.log("Got " + goodBuyListings.length + " good buy listings for keys")

			let botInv = await proxyLoadInv(settings.steamAccountId)
			await doListing(
				"Mann Co. Supply Crate Key",
				true,
				goodBuyListings[Math.floor(Math.random() * goodBuyListings.length)],
				this.manager,
				this.community,
				botInv
			)
		}
	} else {
		console.log("Not Doing Key Sale")
	}
  }

  async checkSteamId(bot: Bot) {
	let possibleOfferContent: {
		distributorItems: doubleRawItem[],
		botItems: doubleRawItem[]
	} = {
		distributorItems: [],
		botItems: []
	}
	
	let theirInv = await this.proxyLoadInv(bot.steamId)
	
	let theirDistributorRes = this.parts.distributor.getDistributorBotSideOfExchangeWithBot(bot, theirInv)
	if (!this.isObjectEmpty(theirDistributorRes.botNameAmounts)) {
		possibleOfferContent.botItems = theirDistributorRes.chosenBotItems
		console.log(bot.steamId + " added " + theirDistributorRes.chosenBotItems.length + " of the Items of the active Bot, Name Amounts: " + JSON.stringify(theirDistributorRes.botNameAmounts))
	} else {
		console.log(bot.steamId + " check did not select any Items from the active Bot in question")
	}
	
	if (!this.isObjectEmpty(theirDistributorRes.ourNameAmounts)) {
		let ourInv = await this.proxyLoadInv(settings.steamAccountId) // avoids loading inv if no items are needed

		for (let name of Object.keys(theirDistributorRes.ourNameAmounts)) {
			let selectedItemsForName = this.filterForItemName(
				name,
				ourInv,
				theirDistributorRes.ourNameAmounts[name]
			)

			if (selectedItemsForName.length) {
				console.log("Selected " + selectedItemsForName.length + " Items from Distributor Inv for Name " + name + " , Matched Amounts " + (theirDistributorRes.ourNameAmounts[name] == selectedItemsForName.length) ? true : false + " Desired Amount Of Items: " + theirDistributorRes.ourNameAmounts)
				possibleOfferContent.distributorItems.push(...selectedItemsForName)
			} else {
				console.log("Was not able to select any Items from the Distributor Inv for Name: " + name + " Desired Amount Of Items: " + JSON.stringify(theirDistributorRes.ourNameAmounts))
			}
		}
		console.log("Done selecting Items from the Distributor Inv for Names")
	} else {
		console.log(bot.steamId + " check did not select any Items from the Distributor Bot in question")
	}

	console.log("Ended Up with " + possibleOfferContent.distributorItems.length + " Items coming from the Distributor and " + possibleOfferContent.botItems.length + "Items from the Bot: " + bot.steamId)

	if (
		possibleOfferContent.distributorItems.length
		|| possibleOfferContent.botItems.length
	) {
		console.log("Constructing Offer")
		//console.log(bot.steamId, bot.tradeUrl, possibleOfferContent.distributorItems.map(item => item.market_name))
		let offer = this.manager.createOffer(bot.tradeUrl)

		if (possibleOfferContent.distributorItems.length) {
			let lst = this.convertdoubleRawItemsToTradeOfferItems(possibleOfferContent.distributorItems)
			//console.log(lst)
			offer.addMyItems(lst)
		}
		if (possibleOfferContent.botItems.length) {
			let lst = this.convertdoubleRawItemsToTradeOfferItems(possibleOfferContent.botItems)
			offer.addTheirItems(lst)
		}

		offer.setMessage("dip dup knack gift")
		
		var status = await this.sendOffer(offer)

		if (status == 'pending') {
			// We need to confirm it
			console.log(`Offer #${offer.id} sent, but requires confirmation`);
			
			var err_of_confirmation = await this.acceptOffer(this.community, offer)
			
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
	}
	console.log("Done with Steam Id Check")
	//console.log(bot.steamId + " check is not fine, has " + theirPure.keys.length + " Keys and " + theirPure.keys.length + " Ref, Min Ref " + bot.minRef)

	//console.log(bot.steamId + " check was fine, has " + theirPure.keys.length + " Keys and " + theirPure.keys.length + " Ref, Desired Ref " + bot.minRef)


	this.parts.distributor.updateLastCheckedForSteamId(bot.steamId)
	return
	let item = {
		assetid: theirInv[0].assetid,
		appid: 440,
		contextid: theirInv[0].contextid,
		id: theirInv[0].assetid,
		amount: 1
	}
	
	let offer = manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=451000290&token=6w98fuf0");	
	offer.addTheirItems([item]);
	console.log(theirInv[0].name, item)
	
	
	var status = await this.sendOffer(offer)
	console.log(status)

  }
  
  async checkOldestUnCheckedSteamId() {
	return await this.checkSteamId(this.parts.distributor.getLongestUnCheckedBot())
  }
}


(async () => {
  client.logOn({
	"accountName": settings.steamAccountName,
	"password": settings.steamAccountPassword,
	"twoFactorCode": SteamTotp.getAuthCode(settings.steamAccountSharedSecret)
  });
  console.log("good")
  let distributor = new MetalDistributor(
    manager,
    client,
    tf2,
    community
  )
  await delay(10000)
  
  console.log("Running Loop")
  while (true) {
	await distributor.checkOldestUnCheckedSteamId()
	console.log("sleeping")
	await delay(settings.minutesBetweenBotChecks * 60000 * 0.5)
	await distributor.checkForKeySale()
	await delay(settings.minutesBetweenBotChecks * 60000 * 0.5)
  } 
})();