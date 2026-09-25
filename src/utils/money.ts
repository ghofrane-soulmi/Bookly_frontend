export interface Money {
  amount: number
  currency: string
}

/**
 * Number of decimal digits a currency uses (e.g. 2 for USD/EUR, 3 for TND, 0
 * for JPY) — derived from the same ICU/CLDR data the backend's brick/money
 * package uses, so it stays in sync without a hardcoded duplicate list.
 */
export function currencyDecimals(currency: string, locale = 'en-US'): number {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
}

/**
 * Formats a {amount, currency} value (amount in minor units, e.g. 3500 =
 * $35.00) as a localized currency string.
 */
export function formatMoney(money: Money | null | undefined, locale = 'en-US'): string {
  if (!money)
    return ''

  const decimals = currencyDecimals(money.currency, locale)

  return new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency })
    .format(money.amount / 10 ** decimals)
}

/**
 * Converts a Money value's minor-unit amount to the major-unit decimal number
 * a form input should display/edit (e.g. 3500 => 35).
 */
export function toMajorUnits(money: Money, locale = 'en-US'): number {
  return money.amount / 10 ** currencyDecimals(money.currency, locale)
}
