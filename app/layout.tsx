import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { CustomerService } from "@/components/customer-service";
import { getSiteThemeClassName, getSiteThemeVariables } from "@/lib/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI数字资源站 - 提示词 / 工作流 / 数字权益自动发货",
  description: "专注销售 AI 提示词、自动化工作流、数字会员与虚拟资源，支付后自动发货。",
};

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
    <html lang="en" className={`dark ${siteTheme}`} style={siteThemeVariables}>
      <body className={inter.className}>
        {children}
        <CustomerService crispId={crispId} />
      </body>
    </html>
  );
}
