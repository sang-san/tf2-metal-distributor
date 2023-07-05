import { settings } from '../settings';

const axios = require('axios');
const fs = require("fs");
import { JSDOM } from 'jsdom';

function generate(n: number): string {
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   
    
    if ( n > max ) {
            return generate(max) + generate(n - max);
    }
    
    max = Math.pow(10, n+add);
    var min = max/10; // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;
    
    return ("" + number).substring(add); 
}
export async function getTradeUrl(
    steamid: string,
    useOldBackpack: boolean = true
): Promise<{
    got_it: boolean,
    url: string
}> {
    var url = ""

    const data = await axios.get("https://listings.perport.net/v1/tradeurl?steamid=" + steamid, {
        headers: {
            "Authorization": "Bearer " + settings.preportApiKey
        }
    })
    
    return {
        got_it: data.status == 200 ? true : false,
        url: JSON.stringify(data.data).replace('"', "")
    }

    if (!useOldBackpack) {
        try {
            const data = await axios.get("https://next.backpack.tf/profiles/" + steamid, {
                headers: {
                    'Cookie': "user-id=" + generate(20),
                    'Referer': 'backpack.tf',
                    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0",
                }
            })
            const { document } = (new JSDOM(data.data)).window;
            document.querySelectorAll("a").forEach(element => {
                let href = element.getAttribute("href")
                if (href && href.includes("https://steamcommunity.com/tradeoffer/new/?partner=")) {
                    url = href
                }
            });
        
            return {
                got_it: url != "",
                url: url
            }
            
        } catch(error: any) {
            console.log(error)
            console.log("getting trade link failed useOldBackpack: " + useOldBackpack)
            return {
                got_it: false,
                url: ""
            }
        }
    } else {
        try {
            const data = await axios.get("https://backpack.tf/profiles/" + steamid, {
                headers: {
                    'Cookie': "user-id=" + generate(20),
                    'Referer': 'backpack.tf',
                    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0",
                }
            })
            fs.writeFileSync('index.html', data.data);
            const { document } = (new JSDOM(data.data)).window;
            document.querySelectorAll(".user-link").forEach((element: any) => {
                let href = element.getAttribute("data-offers-params")
                if (href && href.includes("?partner=")) { 
                    url = "https://steamcommunity.com/tradeoffer/new/" + href
                }
            });
            
            return {
                got_it: url != "",
                url: url
            }
            
        } catch(error: any) {
            console.log(error)
            console.log("getting trade link failed useOldBackpack: " + useOldBackpack)
            return {
                got_it: false,
                url: ""
            }
        }
    }
}
