import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { SentryProvider } from "@/components/sentry-provider"
import Navbar from "@/components/navbar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Restaurant Notebook",
  description: "Track your restaurant experiences with friends",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SentryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light">
              <Navbar />
              <main className="container mx-auto px-4 py-6">{children}</main>
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </SentryProvider>
      </body>
    </html>
  )
}


import './globals.css'