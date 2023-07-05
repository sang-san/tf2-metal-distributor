import * as FS from 'fs';
export const settings: {
    backpackTfAccessToken: string
    steamAccountName: string
    steamAccountPassword: string
    steamAccountSharedSecret: string
    steamAccountIdentitySecret: string
    steamAccountId: string
    proxyUrl: string
    ownerSteamId: string
    preportApiKey: string
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
} = JSON.parse(FS.readFileSync("settings.json", 'utf8'))
export type Bot = typeof settings.activeBots[0]