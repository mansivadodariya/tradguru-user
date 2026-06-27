import { Geist, Geist_Mono, Plus_Jakarta_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";
import WhatsappButton from "@/components/whatsappButton";

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
  title: "Trader Master — AI-Powered Forex Intelligence",
  description:
    "Trader Master delivers AI-powered Forex analysis, chart reading, trade signals, and strategy generation built around MT5 and the Newera brokerage stack.",
  keywords: ["forex", "trading", "AI", "trade analysis", "MT5", "trade signals", "Trader Master"],
  authors: [{ name: "Trader Master" }],
  openGraph: {
    title: "Trader Master — AI-Powered Forex Intelligence",
    description:
      "AI-powered Forex intelligence for serious traders. Chart reading, trade analysis, and strategy generation.",
    siteName: "Trader Master",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trader Master — AI-Powered Forex Intelligence",
    description:
      "AI-powered Forex intelligence for serious traders. Chart reading, trade analysis, and strategy generation.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${robotoSans.variable} ${plusSans.variable}`}>
      <body>
        <ToastProvider>
          {children}
          <WhatsappButton />
        </ToastProvider>
      </body>
    </html>
  );
}
