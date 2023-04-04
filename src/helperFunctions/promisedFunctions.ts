import TradeOfferManager from 'steam-tradeoffer-manager';
import SteamTradeOfferManager from "steam-tradeoffer-manager";
import { settings } from '../settings';

const SteamCommunity = require('steamcommunity');
const FS = require('fs');





export function loadInv(manager: TradeOfferManager, steam_id: any){
	return new Promise<SteamTradeOfferManager.EconItem[]>(resolve => {
		manager.getUserInventoryContents(steam_id, 440, "2", true, (err:any, inv: SteamTradeOfferManager.EconItem[])=>{
			if(err) {
				console.log(err)
				return resolve([]);
			} else {
				resolve(inv)
			}
		})    
	})
}



export function acceptOffer(community: any, offer:any){
	return new Promise<string>(resolve => {
		community.acceptConfirmationForObject(settings.steamAccountIdentitySecret, offer.id, (err:any)=>{
		  if(err) {
			console.log("Can't confirm trade offer: " + err.message);
			return resolve("");
		  } else {
			console.log("Trade offer " + offer.id + " confirmed");
			return resolve("")
		  }
		})
	})
}

export function sendOffer(offer:any){
	return new Promise<string>(resolve => {
	  offer.send((err:any, status:any)=>{
		  if(err)return resolve("");
		  else resolve(status)
		})
	})
}
