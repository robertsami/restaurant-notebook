"use client"

import type React from "react"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
    })
  }, [])

  return <>{children}</>
}
