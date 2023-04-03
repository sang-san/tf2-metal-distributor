import { EconItem } from "steam-tradeoffer-manager";
import { Currency } from "tf2-currency";
import { get_pure_item_count } from "./tools";

function getLocaleSeparators() {
    const testNumber = 1000.1.toLocaleString()
    return [testNumber.substring(1,2), testNumber.substring(5,6)]
}

function splitFloatString(number: number) {
    const numberString = number.toString()
    const [thousandSeparator, decimalSeparator] = getLocaleSeparators()
    let [wholePart, fractionPart] = numberString.replace(new RegExp(thousandSeparator, 'g'), '').split(decimalSeparator)
    wholePart = wholePart || "0"
    fractionPart = fractionPart || "0"
    return {
        wholePart: wholePart,
        fractionPart: fractionPart
    }
}

export function alternativeCurrencyExchange(
    pureCount: ReturnType<typeof get_pure_item_count>,
    currencies: Currency
): {
    [index: string]:  number
} {   
    return {"a": 2}
}