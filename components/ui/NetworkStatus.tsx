"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg",
      "bg-orange-500 text-white text-sm font-medium",
      "animate-in slide-in-from-top-4 duration-300"
    )}>
      <WifiOff className="h-4 w-4" />
      Mode hors ligne
    </div>
  );
}