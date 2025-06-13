"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isPermanentlyDismissed = localStorage.getItem("pwa-install-dismissed") === "true";
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isPermanentlyDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
  };

  const handlePermanentDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm",
      "bg-white border border-gray-200 rounded-lg shadow-lg p-4",
      "animate-in slide-in-from-bottom-4 duration-300"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900">
            Installer l&apos;application
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Accédez plus rapidement à FIS Inscriptions
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2 mt-3">
        <div className="flex gap-2">
          <Button
            onClick={handleInstallClick}
            size="sm"
            className="flex-1 h-8 text-xs cursor-pointer"
          >
            <Download className="h-3 w-3 mr-1" />
            Installer
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            size="sm"
            className="h-8 text-xs cursor-pointer"
          >
            Plus tard
          </Button>
        </div>
        <Button
          variant="ghost"
          onClick={handlePermanentDismiss}
          size="sm"
          className="h-6 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Ne plus afficher
        </Button>
      </div>
    </div>
  );
}