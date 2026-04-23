"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { OrderLookup } from "@/components/order-lookup"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72">
      <div className="container flex h-14 items-center max-w-6xl mx-auto px-4">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-4 sm:mr-6 flex items-center space-x-2">
            <span className="theme-icon-badge flex h-9 w-9 items-center justify-center rounded-xl">
              <ShoppingBag className="h-4.5 w-4.5" />
            </span>
            <span className="font-bold inline-block text-sm sm:text-base tracking-tight">
              AI数字资源站
            </span>
          </Link>
          <nav className="flex items-center space-x-3 sm:space-x-6 text-xs sm:text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
              首页
            </Link>
            <Link href="/pages" className="transition-colors hover:text-foreground/80 text-muted-foreground">
              使用指南
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <OrderLookup />
          </nav>
        </div>
      </div>
    </header>
  )
}
