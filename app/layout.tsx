import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { CustomerService } from "@/components/customer-service";
import { AttributionTracker } from "@/components/attribution-tracker";
import { getSiteThemeClassName, getSiteThemeVariables } from "@/lib/themes";
import { getPublicSiteConfig } from "@/lib/site-config";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteConfig()

  return {
    metadataBase: new URL(site.url),
    title: site.title,
    description: site.description,
    keywords: site.keywords,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: site.title,
      description: site.description,
      url: site.url,
      siteName: site.title,
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description,
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let crispId = undefined;
  let siteTheme = "theme-default";
  let siteThemeVariables = getSiteThemeVariables("default");
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ["crisp_id", "site_theme"],
        },
      },
    });
    crispId = settings.find((item) => item.key === "crisp_id")?.value;
    const currentTheme = settings.find((item) => item.key === "site_theme")?.value;
    siteTheme = getSiteThemeClassName(currentTheme);
    siteThemeVariables = getSiteThemeVariables(currentTheme);
  } catch (error) {
    // Suppress errors during build time or if DB is unreachable
    // This allows the build to pass even if DATABASE_URL is missing in the build environment
    console.warn("Failed to fetch layout settings (likely during build):", error);
  }

  return (
    <html lang="zh-CN" className={`dark ${siteTheme}`} style={siteThemeVariables}>
      <body className={inter.className}>
        <AttributionTracker />
        {children}
        <CustomerService crispId={crispId} />
      </body>
    </html>
  );
}
