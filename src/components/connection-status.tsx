import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
      <Button
        variant={isConnected ? "destructive" : "default"}
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isConnected ? (
          "Disconnect"
        ) : (
          "Connect"
        )}
      </Button>
    </div>
  );
} 