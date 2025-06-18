"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Twitter, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useFarcasterAuth } from "@/lib/hooks/use-farcaster-auth";
import { useTwitterAuth } from "@/lib/hooks/use-twitter-auth";
import { RecentPosts } from "@/components/recent-posts";
import { ConnectionStatus } from "@/components/connection-status";

export default function Home() {
  const { toast } = useToast();
  const { farcasterUser, connectFarcaster, disconnectFarcaster } = useFarcasterAuth();
  const { twitterUser, connectTwitter, disconnectTwitter } = useTwitterAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectFarcaster = async () => {
    try {
      setIsLoading(true);
      await connectFarcaster();
      toast({
        title: "Connected to Farcaster",
        description: "Your account has been successfully connected.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Farcaster. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectTwitter = async () => {
    try {
      setIsLoading(true);
      await connectTwitter();
      toast({
        title: "Connected to Twitter",
        description: "Your account has been successfully connected.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Twitter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Noice
        </h1>
        <p className="text-xl text-muted-foreground">
          Cross-post your tweets to Farcaster automatically
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Accounts</h2>
            <div className="space-y-4">
              <ConnectionStatus
                platform="Farcaster"
                isConnected={!!farcasterUser}
                onConnect={handleConnectFarcaster}
                onDisconnect={disconnectFarcaster}
                isLoading={isLoading}
                icon={<MessageCircle className="w-5 h-5" />}
              />
              <ConnectionStatus
                platform="Twitter"
                isConnected={!!twitterUser}
                onConnect={handleConnectTwitter}
                onDisconnect={disconnectTwitter}
                isLoading={isLoading}
                icon={<Twitter className="w-5 h-5" />}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Recent Cross-Posts</h2>
            <RecentPosts />
          </Card>
        </motion.div>
      </div>

      {farcasterUser && twitterUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <h2 className="text-2xl font-semibold mb-4">Ready to Go!</h2>
            <p className="text-muted-foreground mb-6">
              Your tweets will be automatically cross-posted to Farcaster.
              Start tweeting to see your content appear on both platforms!
            </p>
            <Button
              size="lg"
              className="group"
              onClick={() => window.open("https://twitter.com", "_blank")}
            >
              Start Tweeting
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
