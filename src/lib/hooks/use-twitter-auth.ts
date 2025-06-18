import { useState, useEffect } from "react";

interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

export function useTwitterAuth() {
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("twitterUser");
    if (storedUser) {
      setTwitterUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const connectTwitter = async () => {
    try {
      // TODO: Implement actual Twitter authentication
      // This is a placeholder for demonstration
      const mockUser: TwitterUser = {
        id: "12345",
        username: "bob",
        displayName: "Bob",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      };

      localStorage.setItem("twitterUser", JSON.stringify(mockUser));
      setTwitterUser(mockUser);
    } catch (error) {
      console.error("Failed to connect to Twitter:", error);
      throw error;
    }
  };

  const disconnectTwitter = () => {
    localStorage.removeItem("twitterUser");
    setTwitterUser(null);
  };

  return {
    twitterUser,
    isLoading,
    connectTwitter,
    disconnectTwitter,
  };
} 