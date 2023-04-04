# node-tf2-metal-distributor
Distributes Metal

Installation Guide
```
git clone https://github.com/sang-san/tf2-metal-distributor
npm install
npm run build 

nano settings.json
node build/index.js
```
The Type for the settings.json file that you need to create is : 
```
{
    backpackTfAccessToken: string
    steamAccountName: string
    steamAccountPassword: string
    steamAccountSharedSecret: string
    steamAccountIdentitySecret: string
    steamAccountId: string
    mongoConnection: string
    proxyUrl: string
    ownerSteamId: string
    activeBots: {
        steamId: string
        tradeUrl: string
        minRef: number
        maxRef: number
        minKeys: number
        maxKeys: number
    }[]
    minutesBetweenBotChecks: number
    distributorMinRef: number
    stnKey: string
}
```

Sangria#6425 on Discord, if you have any questions / improvements 
