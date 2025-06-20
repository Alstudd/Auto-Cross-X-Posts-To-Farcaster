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
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { CrosscastButton } from "@/components/CrosscastButton";

interface TwitterUser {
  id: string;
  id_str?: string;
  screen_name?: string;
  username?: string;
}

interface UserStats {
  totalPosts: number;
  crossPosts: number;
  engagementRate: number;
  twitterFollowers: number;
  farcasterFollowers: number;
  totalFollowers: number;
  todayPosts: number;
  todayEngagement: number;
  newFollowersToday: number;
}

interface RecentActivity {
  id: string;
  content: string;
  timestamp: string;
  platforms: string[];
  tweetUrl?: string;
  farcasterUrl?: string;
  stats: {
    twitterLikes?: number;
    twitterRetweets?: number;
    twitterReplies?: number;
    farcasterLikes?: number;
    farcasterRecasts?: number;
    farcasterReplies?: number;
  };
  status: "success" | "error" | "pending";
  errorMessage?: string;
}

interface UserData {
  id: string;
  twitterUsername: string;
  farcasterUsername?: string;
  farcasterDisplayName?: string;
  farcasterPfpUrl?: string;
  crosspostEnabled: boolean;
}

export default function Home() {
  const { toast } = useToast();
  const { user: farcasterUser, isAuthenticated: isFarcasterAuthenticated } =
    useNeynarContext();
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [isTwitterLoading, setIsTwitterLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize user when both accounts are connected
  useEffect(() => {
    if (isFarcasterAuthenticated && farcasterUser && twitterUser) {
      initializeUser();
    }
  }, [isFarcasterAuthenticated, farcasterUser, twitterUser]);

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

  const initializeUser = async () => {
    if (!farcasterUser || !twitterUser) return;

    setIsLoading(true);
    try {
      // Update or create user with both Farcaster and Twitter data
      const response = await fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farcasterSignerUuid: farcasterUser.signer_uuid,
          farcasterFid: farcasterUser.fid?.toString(),
          farcasterUsername: farcasterUser.username,
          farcasterDisplayName: farcasterUser.display_name,
          farcasterPfpUrl: farcasterUser.pfp_url,
          farcasterCustodyAddress: farcasterUser.custody_address,
          farcasterProfileBio: farcasterUser.profile?.bio?.text,
          twitterUserId: twitterUser.id_str || twitterUser.id,
          twitterUsername: twitterUser.screen_name || twitterUser.username,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        await loadUserData(data.user.id);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
      toast({
        title: "Error",
        description: "Failed to initialize user data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId?: string) => {
    try {
      const userIdToUse = userId || userData?.id;
      if (!userIdToUse) return;

      // Load user stats
      const statsResponse = await fetch(
        `/api/user/stats?userId=${userIdToUse}`
      );
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      }

      // Load recent activity
      const activityResponse = await fetch(
        `/api/posts/recent?userId=${userIdToUse}`
      );
      if (activityResponse.ok) {
        const activity = await activityResponse.json();
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
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
        // Update user in database to remove Twitter connection
        // await fetch("/api/user/disconnect-twitter", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ userId: userData?.id }),
        // });

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

  const handleFarcasterDisconnect = async () => {
    try {
      // Update user in database to remove Farcaster connection
      // await fetch("/api/user/disconnect-farcaster", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId: userData?.id }),
      // });

      setUserData(null);
      toast({
        title: "Disconnected from Farcaster",
        description:
          "Your Farcaster account has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Error disconnecting Farcaster:", error);
    }
  };

  const toggleCrosspost = async () => {
    if (!userData) return;

    try {
      const response = await fetch("/api/user/toggle-crosspost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: !userData.crosspostEnabled,
          userId: userData.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData({ ...userData, crosspostEnabled: data.enabled });
        toast({
          title: data.enabled
            ? "Crossposting Enabled"
            : "Crossposting Disabled",
          description: data.enabled
            ? "Your tweets will now be automatically posted to Farcaster"
            : "Automatic crossposting has been disabled",
        });
      }
    } catch (error) {
      console.error("Error toggling crosspost:", error);
      toast({
        title: "Error",
        description: "Failed to update crosspost settings",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      if (userData) {
        await loadUserData(userData.id);
      }
      toast({
        title: "Data Refreshed",
        description: "Your stats and activity have been updated",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
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
            src={
              user.pfp_url ||
              user.profile_image_url ||
              user.farcasterPfpUrl ||
              user.avatar
            }
            alt={
              user.display_name ||
              user.name ||
              user.farcasterDisplayName ||
              user.displayName
            }
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
              {user.display_name ||
                user.name ||
                user.farcasterDisplayName ||
                user.displayName}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{user.username || user.screen_name || user.farcasterUsername}
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
          {change !== undefined && (
            <p
              className={`text-sm mt-1 flex items-center ${
                change > 0
                  ? "text-green-600"
                  : change < 0
                  ? "text-red-600"
                  : "text-gray-600"
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

  const ActivityItem = ({ item }: { item: RecentActivity }) => (
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
                : item.status === "error"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-600"
            }`}
          >
            {item.status === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : item.status === "error" ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
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

      {item.status === "error" && item.errorMessage && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600">
          {item.errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            {(item.stats.twitterLikes || 0) + (item.stats.farcasterLikes || 0)}
          </span>
          <span className="flex items-center">
            <Repeat2 className="w-4 h-4 mr-1" />
            {(item.stats.twitterRetweets || 0) +
              (item.stats.farcasterRecasts || 0)}
          </span>
          <span className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-1" />
            {(item.stats.twitterReplies || 0) +
              (item.stats.farcasterReplies || 0)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {item.tweetUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-blue-500"
              onClick={() => window.open(item.tweetUrl, "_blank")}
            >
              <Twitter className="w-4 h-4" />
            </Button>
          )}
          {item.farcasterUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-purple-500"
              onClick={() => window.open(item.farcasterUrl, "_blank")}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

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
              Noice Crosspost
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
            {userData?.crosspostEnabled
              ? "Your cross-posting is active and running smoothly"
              : "Cross-posting is currently disabled"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
              userData?.crosspostEnabled
                ? "bg-green-100 dark:bg-green-900/20"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                userData?.crosspostEnabled
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                userData?.crosspostEnabled
                  ? "text-green-700 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {userData?.crosspostEnabled ? "Active" : "Inactive"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={toggleCrosspost}>
            {userData?.crosspostEnabled ? "Disable" : "Enable"} Crosspost
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </motion.div>

      {/* Connected Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        {isFarcasterAuthenticated && farcasterUser && (
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
          value={userStats?.totalPosts || 0}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Zap}
          label="Cross-Posts"
          value={userStats?.crossPosts || 0}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Engagement Rate"
          // value={`${userStats?.engagementRate || 0}%`}
          value={`0%`}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatCard
          icon={Users}
          label="Total Followers"
          value={(userStats?.totalFollowers || 0).toLocaleString()}
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
                    onClick={() =>
                      window.open("https://warpcast.com/", "_blank")
                    }
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span>View Farcaster</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-24 flex-col space-y-2"
                    onClick={() => setActiveTab("activity")}
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span>Analytics</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-24 flex-col space-y-2"
                    onClick={() => setActiveTab("schedule")}
                  >
                    <Calendar className="w-6 h-6" />
                    <span>Schedule Post</span>
                  </Button>
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">User Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <span className="text-sm font-medium">Posts Synced</span>
                    <span className="text-lg font-bold text-blue-600">
                      {userStats?.crossPosts || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <span className="text-sm font-medium">Twitter Followers</span>
                    <span className="text-lg font-bold text-green-600">
                      {userStats?.twitterFollowers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <span className="text-sm font-medium">Farcaster Followers</span>
                    <span className="text-lg font-bold text-purple-600">
                      {userStats?.farcasterFollowers || 0}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <ActivityItem key={item.id} item={item} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No recent activity found
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Start tweeting to see your cross-posting activity here
                    </p>
                  </div>
                )}
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
              <Button size="lg" disabled>
                <Calendar className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
