import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "PredictaPool — Yield-Backed Prediction Markets",
  description:
    "Predict FIFA World Cup 2026 outcomes on Uniswap V4. Earn yield while you wait. Powered by X Layer.",
  keywords: ["prediction market", "DeFi", "Uniswap V4", "FIFA 2026", "X Layer"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${mono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          Swallow the benign "Cannot redefine property: ethereum" error thrown
          when two EVM wallet extensions both try to inject window.ethereum.
          It's a browser-extension collision, not an app fault, but it would
          otherwise trip Next's dev error overlay.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window==='undefined')return;var isWalletErr=function(m){m=String(m||'');return m.indexOf('Cannot redefine property: ethereum')!==-1||m.indexOf('Cannot set property ethereum')!==-1||(m.indexOf('ethereum')!==-1&&m.indexOf('which has only a getter')!==-1);};var h=function(e){var m=e&&(e.message||(e.reason&&(e.reason.message||e.reason)));if(isWalletErr(m)){if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();return false;}};window.addEventListener('error',h,true);window.addEventListener('unhandledrejection',h,true);})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
