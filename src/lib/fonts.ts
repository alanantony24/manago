import { Erica_One, Plus_Jakarta_Sans } from "next/font/google"

export const ericaOne = Erica_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
})

/** Body / UI type — pairs with Erica One for brand marks. */
export const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})
