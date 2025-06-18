import { useState, useEffect } from "react";

interface FarcasterUser {
  fid: string;
  username: string;
  displayName: string;
  avatar: string;
}

export function useFarcasterAuth() {
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("farcasterUser");
    if (storedUser) {
      setFarcasterUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const connectFarcaster = async () => {
    try {
      // TODO: Implement actual Farcaster authentication
      // This is a placeholder for demonstration
      const mockUser: FarcasterUser = {
        fid: "12345",
        username: "alice",
        displayName: "Alice",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      };

      localStorage.setItem("farcasterUser", JSON.stringify(mockUser));
      setFarcasterUser(mockUser);
    } catch (error) {
      console.error("Failed to connect to Farcaster:", error);
      throw error;
    }
  };

  const disconnectFarcaster = () => {
    localStorage.removeItem("farcasterUser");
    setFarcasterUser(null);
  };

  return {
    farcasterUser,
    isLoading,
    connectFarcaster,
    disconnectFarcaster,
  };
} 