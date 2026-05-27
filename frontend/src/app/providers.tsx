"use client";

import { Web3Provider } from "@/context/Web3Context";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </Web3Provider>
  );
}
