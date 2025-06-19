"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Loader2, MessageCircle, Twitter } from "lucide-react";
// import { NeynarButton } from "@/components/NeynarButton"; // for Twitter example if needed
import { NeynarAuthButton } from "@neynar/react";

interface ConnectionStatusProps {
  platform: string;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading: boolean;
  icon: React.ReactNode;
}

export function ConnectionStatus({
  platform,
  isConnected,
  onConnect,
  onDisconnect,
  isLoading,
  icon,
}: ConnectionStatusProps) {
  const renderButton = () => {
    if (platform === "Farcaster") {
      return <NeynarAuthButton />;
    }

    // You can extend this for other platforms
    // if (platform === "Twitter") {
    //   return <NeynarButton />;
    // }

    // fallback default button
    return (
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isLoading}
        className={`px-4 py-2 rounded text-white ${
          isConnected ? "bg-red-600" : "bg-blue-600"
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isConnected ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="font-medium">{platform}</h3>
          <p className="text-sm text-muted-foreground">
            {isConnected ? "Connected" : "Not connected"}
          </p>
        </div>
      </div>
      {renderButton()}
    </div>
  );
}
