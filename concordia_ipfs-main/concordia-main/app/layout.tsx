import type React from "react"
import type { Metadata } from "next"
import { Inter, Orbitron } from "next/font/google" // Import Orbitron
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" }) // Define Inter as a CSS variable
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" }) // Define Orbitron as a CSS variable

export const metadata: Metadata = {
  title: "Concordia - Save Money Together",
  description: "Group savings dApp for friends to achieve shared goals",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable + " " + orbitron.variable + " scroll-smooth"}>
      <head>{/* RainbowKit core styles - Removed as RainbowKit is no longer used */}</head>
      <body className="font-sans">
        {" "}
        {/* Use font-sans to apply Inter by default, then override with Orbitron */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
