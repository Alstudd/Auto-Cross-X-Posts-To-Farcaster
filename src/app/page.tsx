/* eslint-disable react-hooks/exhaustive-deps */
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
  Loader2,
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
  const [showModal, setShowModal] = useState(false);

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

  type SettingsToggleProps = {
    label: string;
    enabled: boolean;
    onChange: (val: boolean) => void;
  };
  function SettingsToggle({ label, enabled, onChange }: SettingsToggleProps) {
    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-white">{label}</span>
        <button
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-blue-500" : "bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  }

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
    <Card className=" border-0 shadow-none rounded-2xl p-0 w-full max-w-8xl  mt-8">
      <div className="flex justify-between items-center px-8 pt-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#202938]">
            {platform === "twitter" ? (
              <Twitter className="w-7 h-7 text-[#8CA3C7]" />
            ) : (
              <MessageCircle className="w-7 h-7 text-[#8CA3C7]" />
            )}
          </div>
          <div>
            <div className="text-lg font-semibold text-black">
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </div>
            <div className="text-sm text-[#8CA3C7]">Connected</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onDisconnect(platform)}
          className="bg-[#202938] text-[#B6C6E3] px-8 py-2 rounded-full font-semibold text-base hover:bg-[#2A3446] hover:text-white"
        >
          Disconnect
        </Button>
      </div>
      <div className="flex flex-row  mt-8 px-8">
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
          className="w-40 h-40 rounded-full border-4 border-[#202938] object-cover shadow-lg"
        />
        <div className="ml-10 text-3xl font-bold text-black flex items-center">
          @{user.username || user.screen_name || user.farcasterUsername}
        </div>
        <div className="mt-2 text-lg text-[#8CA3C7]">
          {user.followers_count ? user.followers_count.toLocaleString() : ""}
          {user.followers_count && user.friends_count ? " followers · " : ""}
          {user.friends_count
            ? user.friends_count.toLocaleString() + " following"
            : ""}
        </div>
      </div>
    </Card>
  );

  const StatCard = ({
    icon: Icon,
    label,
    value,
    sublabel,

    changeColor,
    iconBg,
  }: {
    icon: any;
    label: string;
    value: string | number;
    sublabel?: string;

    changeColor?: string;
    iconBg?: string;
  }) => (
    <Card className="relative p-6 bg-[#181A2A] border-0 shadow-lg rounded-xl min-h-[140px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            iconBg || "bg-blue-600"
          }`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-extrabold text-white leading-tight">
          {value}
        </div>
        <div className="text-base font-semibold text-white/80 mt-1">
          {label}
        </div>
        {sublabel && (
          <div className="text-xs text-white/50 mt-1">{sublabel}</div>
        )}
      </div>
    </Card>
  );

  const ActivityItem = ({ item }: { item: RecentActivity }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-black text-white hover:shadow-md transition-shadow"
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

      <p className="text-white mb-3 leading-relaxed">{item.content}</p>

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

  // Add this handler to connect the toggle to the crosspost logic
  const onToggleCrosspost = async (val: boolean) => {
    // Only toggle if the value is different
    if (!!userData?.crosspostEnabled !== val) {
      await toggleCrosspost();
    }
  };

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
      <>
        <div className="w-full bg-[#F3F0ED] h-screen relative flex flex-col justify-center items-center text-center px-4">
          {/* Top Left Logo */}
          <div className="absolute top-14 left-14 text-2xl font-semibold tracking-widest text-black z-50">
            CROSSPOST
          </div>
          {/* Top Right Get Started Button */}
          <div className="absolute top-14 right-14 text-lg text-gray-700 text-right z-50">
            <button
              onClick={() => setShowModal(true)}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Get Started
            </button>
            <div
              className="mt-1 w-full h-[2px] bg-no-repeat bg-center bg-contain"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='6' viewBox='0 0 60 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 3 Q15 0 30 3 T60 3' fill='transparent' stroke='black' stroke-width='1.2'/%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>
          {/* Main Message */}
          <div className="z-50">
            <h1 className="text-5xl mb-2 text-black">Noice Crosspost</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-10 text-2xl">
              Sync your tweets to Farcaster automatically
            </p>
            <div className="text-2xl animate-bounce text-gray-700">↓</div>
          </div>
          {/* Bottom Wave Image */}
          <img
            src="https://cdn.prod.website-files.com/56d8a8f1100bc1bb7928eebd/58458c90a39ccfdb4c175922_HECO_LINE_ANIMATION_v04-poster-00001.jpg"
            alt="Wave pattern"
            className="absolute bottom-0 left-0 w-full object-cover"
          />
        </div>
        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-opacity-50 backdrop-blur-3xl flex items-center justify-center z-[1000]"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center"
              >
                <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
                  Let&apos;s Get You Started
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Connect your Twitter and Farcaster accounts to begin
                  crossposting.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">Farcaster</h3>
                        <p className="text-sm text-muted-foreground">
                          {isFarcasterAuthenticated
                            ? "Connected"
                            : "Not connected"}
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
                {/* Success Message */}
                {isFarcasterAuthenticated && twitterUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      🎉 Both accounts connected! You can now close this modal.
                    </p>
                  </motion.div>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-6 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold bg-black bg-clip-text text-transparent mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {userData?.crosspostEnabled
              ? "Your cross-posting is active and running smoothly"
              : "Cross-posting is currently disabled"}
          </p>
        </div>
        <div className="md:mt-0 mt-4 flex items-center space-x-3">
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
          {/* <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button> */}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <StatCard
          icon={BarChart3}
          label="Total Posts"
          value={userStats?.totalPosts || 0}
          sublabel="This month"
          changeColor="text-green-400"
          iconBg="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Success Rate"
          value={userStats ? `${userStats.engagementRate || 0}%` : "0%"}
          changeColor="text-green-400"
          iconBg="bg-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Engagement"
          value={userStats?.todayEngagement || 0}
          sublabel="Likes, shares, comments"
          changeColor="text-green-400"
          iconBg="bg-purple-500"
        />
        <StatCard
          icon={Activity}
          label="Avg. Engagement Rate"
          value={userStats ? `${userStats.engagementRate || 0}%` : "0%"}
          sublabel="Per post"
          changeColor="text-red-400"
          iconBg="bg-orange-500"
        />
      </motion.div>

      {/* Connected Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 mb-20 "
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

      <motion.div
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
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
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

      {/* Tabs */}
      {/* <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
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
      </div> */}

      {/* Tab Content */}
      {/* <AnimatePresence mode="wait">
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
                    <span className="text-sm font-medium">
                      Twitter Followers
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {userStats?.twitterFollowers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <span className="text-sm font-medium">
                      Farcaster Followers
                    </span>
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
      </AnimatePresence> */}

      <div className="mb-8 mt-20">
        <h2 className="text-xl font-semibold mb-6">Settings</h2>
        <div className="bg-black rounded-xl border border-slate-700 p-6">
          <SettingsToggle
            label="Cross-post all tweets automatically"
            enabled={userData?.crosspostEnabled || false}
            onChange={onToggleCrosspost}
          />
        </div>
      </div>
    </div>
  );
}
