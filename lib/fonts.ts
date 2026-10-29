import { Figtree, Geist, Geist_Mono, IBM_Plex_Sans, Inter, Nunito_Sans, Source_Sans_3 } from "next/font/google"

// Fonts offered by the theme customizer. Each sets a CSS variable on <html>;
// `--font-sans` in globals.css points at one of them.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false })
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", preload: false })
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  preload: false,
})
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans", preload: false })
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans-3", preload: false })

export const fontVariables = [geist, geistMono, inter, figtree, ibmPlexSans, nunitoSans, sourceSans3]
  .map((font) => font.variable)
  .join(" ")
