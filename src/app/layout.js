import { Geist, Geist_Mono, Plus_Jakarta_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

const plusSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

const robotoSans = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: 'swap',
});

export const metadata = {
  title: "Trade Guru — AI-Powered Forex Intelligence",
  description:
    "Trade Guru delivers AI-powered Forex analysis, chart reading, trade signals, and strategy generation built around MT5 and the Newera brokerage stack.",
  keywords: ["forex", "trading", "AI", "trade analysis", "MT5", "trade signals", "FX Guru"],
  authors: [{ name: "Trade Guru" }],
  openGraph: {
    title: "Trade Guru — AI-Powered Forex Intelligence",
    description:
      "AI-powered Forex intelligence for serious traders. Chart reading, trade analysis, and strategy generation.",
    siteName: "Trade Guru",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trade Guru — AI-Powered Forex Intelligence",
    description:
      "AI-powered Forex intelligence for serious traders. Chart reading, trade analysis, and strategy generation.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${robotoSans.variable} ${plusSans.variable}`}>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
