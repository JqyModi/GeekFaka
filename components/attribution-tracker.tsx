"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ATTRIBUTION_KEY = "faka_attribution"
const VISITOR_KEY = "faka_visitor_id"
const SESSION_KEY = "faka_session_id"
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const

function createId(prefix: string) {
  const randomId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}_${randomId}`
}

function getIdentity() {
  let visitorId = localStorage.getItem(VISITOR_KEY)
  if (!visitorId) {
    visitorId = createId("v")
    localStorage.setItem(VISITOR_KEY, visitorId)
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = createId("s")
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }

  return { visitorId, sessionId }
}

function getCurrentAttribution() {
  const params = new URLSearchParams(window.location.search)
  const hasUtm = UTM_KEYS.some((key) => params.has(key))

  if (hasUtm) {
    const attribution = {
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || "",
      landingPath: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || "",
      capturedAt: new Date().toISOString(),
    }

    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution))
    return attribution
  }

  return readAttribution()
}

function getProductSlug(pathname: string) {
  const match = pathname.match(/^\/products\/([^/?#]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : undefined
}

export function AttributionTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const attribution = getCurrentAttribution()
    const productSlug = getProductSlug(window.location.pathname)

    trackGrowthEvent("page_view", {
      title: document.title,
    }, attribution)

    if (productSlug) {
      trackGrowthEvent("product_view", {
        title: document.title,
      }, attribution)
    }
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest("a,button")
        : null
      if (!(target instanceof HTMLElement)) return

      const text = target.innerText?.trim().slice(0, 160) || target.getAttribute("aria-label") || ""
      const href = target instanceof HTMLAnchorElement ? target.href : ""
      const eventType = target.dataset.growthEvent
        || (href.includes("/?buy=") ? "checkout_open" : "")
        || (href.includes("/products/") ? "product_link_click" : "")

      if (!eventType) return

      trackGrowthEvent(eventType, {
        label: target.dataset.growthLabel || text,
        href,
      })
    }

    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  return null
}

export function readAttribution() {
  if (typeof window === "undefined") return null

  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY)
    return {
      ...(raw ? JSON.parse(raw) : {}),
      ...getIdentity(),
    }
  } catch {
    return null
  }
}

export function trackGrowthEvent(
  type: string,
  metadata: Record<string, unknown> = {},
  attribution = readAttribution()
) {
  if (typeof window === "undefined") return

  try {
    const identity = getIdentity()
    const payload = {
      type,
      path: `${window.location.pathname}${window.location.search}`,
      productSlug: getProductSlug(window.location.pathname),
      referrer: document.referrer || "",
      attribution: attribution || {},
      metadata,
      ...identity,
    }
    const body = JSON.stringify(payload)

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" })
      navigator.sendBeacon("/api/growth/events", blob)
      return
    }

    fetch("/api/growth/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // Tracking must never block storefront behavior.
  }
}
