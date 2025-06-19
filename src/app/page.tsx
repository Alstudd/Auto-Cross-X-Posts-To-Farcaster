/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Twitter,
  MessageCircle,
  ArrowRight,
  Check,
  Settings,
  Activity,
  Users,
  TrendingUp,
  Zap,
  Unlink,
  Bell,
  BarChart3,
  Calendar,
  Eye,
  Heart,
  Repeat2,
  MessageSquare,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { CrosscastButton } from "@/components/CrosscastButton";

// Mock data for demonstration
const mockStats = {
  totalPosts: 127,
  crossPosts: 89,
  engagement: 2.4,
  followers: 1250,
};

const mockRecentActivity = [
  {
    id: 1,
    content:
      "Just launched a new feature! 🚀 Excited to see how the community responds.",
    timestamp: "2 hours ago",
    platforms: ["twitter", "farcaster"],
    stats: { likes: 24, reposts: 8, replies: 5 },
    status: "success",
  },
  {
    id: 2,
    content: "Working on some exciting updates for the weekend...",
    timestamp: "5 hours ago",
    platforms: ["twitter", "farcaster"],
    stats: { likes: 12, reposts: 3, replies: 2 },
    status: "success",
  },
  {
    id: 3,
    content: "Failed to post to Farcaster - API rate limit exceeded",
    timestamp: "1 day ago",
    platforms: ["twitter"],
    stats: { likes: 18, reposts: 4, replies: 7 },
    status: "error",
  },
];

export default function Home() {
  const { toast } = useToast();
  const { user: farcasterUser, isAuthenticated: isFarcasterAuthenticated } =
    useNeynarContext();
  const [twitterUser, setTwitterUser] = useState(null);
  const [isTwitterLoading, setIsTwitterLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Check Twitter authentication status on component mount
  useEffect(() => {
    checkTwitterAuth();
  }, []);

  const checkTwitterAuth = async () => {
    try {
      const response = await fetch("/api/auth/twitter/status");
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setTwitterUser(data.user);
        }
      }
    } catch (error) {
      console.error("Error checking Twitter auth:", error);
    }
  };

  const handleTwitterConnect = async () => {
    setIsTwitterLoading(true);
    try {
      const response = await fetch("/api/auth/twitter/login");
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error connecting Twitter:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Twitter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTwitterLoading(false);
    }
  };

  const handleTwitterDisconnect = async () => {
    try {
      const response = await fetch("/api/auth/twitter/logout", {
        method: "POST",
      });

      if (response.ok) {
        setTwitterUser(null);
        toast({
          title: "Disconnected from Twitter",
          description:
            "Your Twitter account has been disconnected successfully.",
        });
      }
    } catch (error) {
      console.error("Error disconnecting Twitter:", error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from Twitter. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFarcasterDisconnect = () => {
    // Neynar handles disconnect internally
    toast({
      title: "Disconnected from Farcaster",
      description: "Your Farcaster account has been disconnected successfully.",
    });
  };

  const isConnected = isFarcasterAuthenticated && twitterUser;

  const ConnectedAccountCard = ({ platform, user, onDisconnect }: any) => (
    <motion.div
      layout
      className="flex items-center justify-between p-4 rounded-xl border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={user.pfp_url || user.profile_image_url || user.avatar}
            alt={user.display_name || user.name || user.displayName}
            className="w-12 h-12 rounded-full border-2 border-green-400"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            {platform === "farcaster" ? (
              <MessageCircle className="w-4 h-4 text-purple-600" />
            ) : (
              <Twitter className="w-4 h-4 text-blue-500" />
            )}
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {user.display_name || user.name || user.displayName}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{user.username || user.screen_name}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDisconnect(platform)}
        className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <Unlink className="w-4 h-4" />
      </Button>
    </motion.div>
  );

  const StatCard = ({ icon: Icon, label, value, change, color }: any) => (
    <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
          {change && (
            <p
              className={`text-sm mt-1 flex items-center ${
                change > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {change > 0 ? "+" : ""}
              {change}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );

  const ActivityItem = ({ item }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {item.platforms.includes("twitter") && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Twitter className="w-3 h-3 text-white" />
              </div>
            )}
            {item.platforms.includes("farcaster") && (
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div
            className={`p-1 rounded-full ${
              item.status === "success"
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {item.status === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {item.timestamp}
        </span>
      </div>

      <p className="text-gray-900 dark:text-gray-100 mb-3 leading-relaxed">
        {item.content}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            {item.stats.likes}
          </span>
          <span className="flex items-center">
            <Repeat2 className="w-4 h-4 mr-1" />
            {item.stats.reposts}
          </span>
          <span className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-1" />
            {item.stats.replies}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-600"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Noice
            </h1>
            <p className="text-xl text-muted-foreground">
              Cross-post your tweets to Farcaster automatically
            </p>
          </div>
        </motion.div>

        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Connect Your Accounts
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Farcaster</h3>
                    <p className="text-sm text-muted-foreground">
                      {isFarcasterAuthenticated ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {!isFarcasterAuthenticated && <NeynarAuthButton />}
                {isFarcasterAuthenticated && (
                  <div className="flex items-center text-green-600">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-500">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Twitter</h3>
                    <p className="text-sm text-muted-foreground">
                      {twitterUser ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {!twitterUser && (
                  <Button
                    onClick={handleTwitterConnect}
                    disabled={isTwitterLoading}
                    size="sm"
                  >
                    {isTwitterLoading ? "Connecting..." : "Connect"}
                  </Button>
                )}
                {twitterUser && (
                  <div className="flex items-center text-green-600">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your cross-posting is active and running smoothly
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Active
            </span>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <CrosscastButton
            tweetText="Test tweet"
            // tweetUrl="Optional tweet URL"
            signerUuid={farcasterUser?.signer_uuid}
          />
        </div>
      </motion.div>

      {/* Connected Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        {isFarcasterAuthenticated && (
          <ConnectedAccountCard
            platform="farcaster"
            user={farcasterUser}
            onDisconnect={handleFarcasterDisconnect}
          />
        )}
        {twitterUser && (
          <ConnectedAccountCard
            platform="twitter"
            user={twitterUser}
            onDisconnect={handleTwitterDisconnect}
          />
        )}
      </motion.div>

      {/* Rest of the component remains the same... */}
      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <StatCard
          icon={Activity}
          label="Total Posts"
          value={mockStats.totalPosts}
          change={12}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Zap}
          label="Cross-Posts"
          value={mockStats.crossPosts}
          change={8}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Engagement Rate"
          value={`${mockStats.engagement}%`}
          change={5}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard
          icon={Users}
          label="Total Followers"
          value={mockStats.followers.toLocaleString()}
          change={15}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
        />
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "activity", label: "Recent Activity", icon: Activity },
          { id: "schedule", label: "Schedule", icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="h-24 flex-col space-y-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    onClick={() =>
                      window.open("https://twitter.com/compose/tweet", "_blank")
                    }
                  >
                    <Twitter className="w-6 h-6" />
                    <span>Create Tweet</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-24 flex-col space-y-2 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span>View Farcaster</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-24 flex-col space-y-2"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span>Analytics</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-24 flex-col space-y-2"
                  >
                    <Calendar className="w-6 h-6" />
                    <span>Schedule Post</span>
                  </Button>
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Today Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <span className="text-sm font-medium">Posts Synced</span>
                    <span className="text-lg font-bold text-blue-600">5</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <span className="text-sm font-medium">Engagement</span>
                    <span className="text-lg font-bold text-green-600">
                      127
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <span className="text-sm font-medium">New Followers</span>
                    <span className="text-lg font-bold text-purple-600">
                      12
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Recent Activity</h3>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {mockRecentActivity.map((item) => (
                  <ActivityItem key={item.id} item={item} />
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "schedule" && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Schedule Posts</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Plan and schedule your cross-posts in advance
              </p>
              <Button size="lg">
                <Calendar className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
