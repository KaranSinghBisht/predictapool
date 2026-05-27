"use client";

import { useWeb3 } from "@/context/Web3Context";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  const { address, prediction, eventData, balances } = useWeb3();

  return (
    <Dashboard
      address={address}
      prediction={prediction}
      eventData={eventData}
      balances={balances}
    />
  );
}
