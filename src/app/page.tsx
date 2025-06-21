/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
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
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { CrosscastButton } from "@/components/CrosscastButton";
import ScrollSections from "@/components/scroll-section";

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
  const {
    user: farcasterUser,
    isAuthenticated: isFarcasterAuthenticated,
    logoutUser: logoutFarcasterUser,
  } = useNeynarContext();
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [isTwitterLoading, setIsTwitterLoading] = useState(false);
  const [crosscastText, setCrosscastText] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  useEffect(() => {
    // Smooth scrolling
    const handleScroll = () => {
      document.documentElement.style.scrollBehavior = "smooth";
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        setUserData(null);
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
      logoutFarcasterUser();
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
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
      <div className="flex items-center space-x-3">
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
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h4 className="font-semibold text-white">
            {user.display_name ||
              user.name ||
              user.farcasterDisplayName ||
              user.displayName}
          </h4>
          <p className="text-sm text-gray-400">
            @{user.username || user.screen_name || user.farcasterUsername}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {platform === "farcaster" ? (
          <MessageCircle className="w-5 h-5 text-purple-400" />
        ) : (
          <Twitter className="w-5 h-5 text-blue-400" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDisconnect(platform)}
          className="cursor-pointer text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full p-2"
        >
          <Unlink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, change, color }: any) => {
    const colorClasses = {
      blue: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
      },
      purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
      },
      green: {
        bg: "bg-green-500/10",
        text: "text-green-400",
      },
      orange: {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
      },
    };
    const colors =
      colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
      </div>
    );
  };

  const ActivityItem = ({ item }: { item: RecentActivity }) => (
    <motion.div
      // initial={{ opacity: 0, y: 20 }}
      // animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 transition-all hover:border-gray-700"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            {item.platforms.includes("twitter") && (
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border-2 border-gray-800">
                <Twitter className="w-4 h-4 text-blue-400" />
              </div>
            )}
            {item.platforms.includes("farcaster") && (
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center border-2 border-gray-800">
                <MessageCircle className="w-4 h-4 text-purple-400" />
              </div>
            )}
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
              item.status === "success"
                ? "bg-green-500/10 text-green-400"
                : item.status === "error"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {item.status}
          </span>
        </div>
        <span className="text-xs text-gray-500 flex items-center">
          <Clock className="w-3 h-3 mr-1.5" />
          {item.timestamp}
        </span>
      </div>

      <p className="text-gray-300 mb-4 leading-relaxed">{item.content}</p>

      {item.status === "error" && item.errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 rounded-lg text-sm text-red-400">
          {item.errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-5 text-sm text-gray-400">
          <span className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <Heart className="w-4 h-4" />
            <span>
              {(item.stats.twitterLikes || 0) +
                (item.stats.farcasterLikes || 0)}
            </span>
          </span>
          <span className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <Repeat2 className="w-4 h-4" />
            <span>
              {(item.stats.twitterRetweets || 0) +
                (item.stats.farcasterRecasts || 0)}
            </span>
          </span>
          <span className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>
              {(item.stats.twitterReplies || 0) +
                (item.stats.farcasterReplies || 0)}
            </span>
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {item.tweetUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 w-8 h-8"
              onClick={() => window.open(item.tweetUrl, "_blank")}
            >
              <Twitter className="w-4 h-4" />
            </Button>
          )}
          {item.farcasterUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 w-8 h-8"
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
      <>
        {/* Hero Section */}
        <div className="w-full bg-[#F5F2EE] min-h-screen relative overflow-hidden">
          {/* Parallax Background Elements */}
          <motion.div
            style={{ y: y1 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black/10 rounded-full"></div>
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-black/5 rounded-full"></div>
          </motion.div>

          {/* Header */}
          <motion.header
            style={{ opacity }}
            className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-14"
          >
            <div className="text-2xl font-bold tracking-[0.2em] text-black">
              CROSSPOST
            </div>
            <div className="text-right">
              <button
                onClick={() => setShowModal(true)}
                className="text-lg text-gray-700 hover:text-black transition-colors cursor-pointer relative group"
              >
                Get Started
                <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left">
                  <svg
                    width="100%"
                    height="2"
                    viewBox="0 0 100 2"
                    className="absolute top-0 left-0"
                  >
                    <path
                      d="M0 1 Q25 0 50 1 T100 1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </motion.header>

          {/* Main Content */}
          <div className="flex flex-col justify-center items-center min-h-screen text-center px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ y: y2 }}
              className="max-w-4xl"
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-light text-black mb-8 leading-tight">
                We auto sync your tweets to
                <br />
                <span className="font-normal">Farcaster</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                Create dynamic cross-platform presence that helps your content
                reach new audiences.
              </p>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="absolute bottom-20 text-2xl text-gray-400"
            >
              ↓
            </motion.div>
          </div>

          {/* Animated Wave Graphics */}
          <motion.div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
            <svg
              className="absolute bottom-0 w-full h-full"
              viewBox="0 0 1200 600"
              preserveAspectRatio="none"
            >
              {/* Main flowing waves */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: 0.5 }}
                d="M0 400 Q300 300 600 400 T1200 400 L1200 600 L0 600 Z"
                fill="black"
                opacity="0.9"
              />
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: 0.7 }}
                d="M0 450 Q200 350 400 450 Q600 550 800 450 Q1000 350 1200 450 L1200 600 L0 600 Z"
                fill="black"
                opacity="0.7"
              />
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: 0.9 }}
                d="M0 500 Q150 400 300 500 Q450 600 600 500 Q750 400 900 500 Q1050 600 1200 500 L1200 600 L0 600 Z"
                fill="black"
                opacity="0.5"
              />
            </svg>
          </motion.div>
        </div>

        <ScrollSections />

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1000]"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <h2 className="text-3xl font-light mb-2 text-black text-center">
                  Let&apos;s Get Started
                </h2>
                <p className="text-gray-600 mb-8 text-center leading-relaxed">
                  Connect your accounts to begin seamless crossposting between
                  platforms.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-purple-100">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-black">Farcaster</h3>
                        <p className="text-sm text-gray-500">
                          {isFarcasterAuthenticated
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {!isFarcasterAuthenticated && (
                      <NeynarAuthButton
                        label="Connect"
                        icon={<div key="#"></div>}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 pr-3 pl-2 bg-black text-white hover:bg-gray-800 cursor-pointer"
                      />
                    )}
                    {isFarcasterAuthenticated && (
                      <div className="flex items-center text-green-600">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-blue-100">
                        <Twitter className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-black">Twitter</h3>
                        <p className="text-sm text-gray-500">
                          {twitterUser ? "Connected" : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {!twitterUser && (
                      <Button
                        onClick={handleTwitterConnect}
                        disabled={isTwitterLoading}
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800 cursor-pointer"
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
                    className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100"
                  >
                    <p className="text-green-700 text-sm text-center">
                      🎉 Both accounts connected! Youre ready to start
                      crossposting.
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={() => setShowModal(false)}
                  className="mt-8 w-full py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
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
    <div className="bg-gray-950 text-gray-200 min-h-screen font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-screen-2xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="sticky top-6 z-50 mb-8"
        >
          <div className="bg-gray-950/70 backdrop-blur-xl border border-gray-800 rounded-2xl flex items-center justify-between p-3.5 shadow-lg shadow-black/20">
            {/* Left side: User Info */}
            <div className="flex items-center space-x-3">
              <img
                src={farcasterUser?.pfp_url}
                alt={farcasterUser?.display_name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h1 className="font-semibold text-white">
                  {farcasterUser?.display_name}
                </h1>
                <p className="text-xs text-gray-500">
                  Welcome to your Dashboard
                </p>
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshData}
                disabled={isRefreshing}
                className="cursor-pointer text-gray-400 hover:text-white hover:bg-gray-800 w-10 h-10 rounded-full"
              >
                <RefreshCw
                  className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>

              <Button
                onClick={() => setShowCreatePostModal(true)}
                className="cursor-pointer bg-white text-gray-900 hover:bg-gray-200 font-bold py-2 px-4 rounded-full flex items-center space-x-0 sm:space-x-2 shadow-lg shadow-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="!hidden sm:!inline">Create</span>
              </Button>
            </div>
          </div>
        </motion.header>

        <div className="space-y-8">
          {/* Top Row: Controls & Connected Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="lg:col-span-1 bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-white">
                  Automatic Crossposting
                </h3>
                <p className="text-purple-200/80 mt-1">
                  {userData?.crosspostEnabled
                    ? "Your new tweets will be posted to Farcaster."
                    : "Turn on to sync your new tweets automatically."}
                </p>
              </div>
              <div className="flex items-center justify-center mt-6">
                <button
                  onClick={toggleCrosspost}
                  className={`cursor-pointer relative inline-flex items-center h-14 rounded-full w-28 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-purple-500 ${
                    userData?.crosspostEnabled
                      ? "bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30"
                      : "bg-gray-700/50"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className={`inline-flex items-center justify-center w-12 h-12 transform bg-white rounded-full m-1 transition-transform ${
                      userData?.crosspostEnabled
                        ? "translate-x-14"
                        : "translate-x-0"
                    }`}
                  >
                    {userData?.crosspostEnabled ? (
                      <Check className="w-6 h-6 text-purple-600" />
                    ) : (
                      <Zap className="w-6 h-6 text-gray-400" />
                    )}
                  </motion.span>
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-2xl p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">
                Connected Accounts
              </h3>
              <div className="space-y-4">
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
              </div>
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              User Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Activity}
                label="Total Posts"
                value={userStats?.totalPosts || 0}
                color="blue"
              />
              <StatCard
                icon={Zap}
                label="Cross-Posts"
                value={userStats?.crossPosts || 0}
                color="purple"
              />
              <StatCard
                icon={TrendingUp}
                label="Engagement"
                value={`0%`}
                color="green"
              />
              <StatCard
                icon={Users}
                label="Followers"
                value={(userStats?.totalFollowers || 0).toLocaleString()}
                color="orange"
              />
            </div>
          </motion.div>

          {/* Post Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
            className="lg:col-span-8 space-y-4"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Post Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <ActivityItem key={item.id} item={item} />
                ))
              ) : (
                <div className="text-center py-16 bg-gray-900/80 border border-gray-800 rounded-2xl">
                  <Activity className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No recent activity found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start tweeting to see your cross-posting activity here
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreatePostModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreatePostModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[1000]"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-xl w-full mx-4 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    Create Crosspost
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm bg-gray-800 px-3 py-1 rounded-full">
                      <Twitter className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Twitter</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm bg-gray-800 px-3 py-1 rounded-full">
                      <MessageCircle className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">Farcaster</span>
                    </div>
                  </div>
                </div>

                <textarea
                  placeholder="What's happening?"
                  className="w-full bg-gray-800 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 border border-gray-700"
                  rows={6}
                  value={crosscastText}
                  onChange={(e) => setCrosscastText(e.target.value)}
                  required
                />

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    280 characters remaining
                  </div>
                  <CrosscastButton
                    userId={userData?.id}
                    tweetText={crosscastText}
                    // tweetUrl="Optional tweet URL"
                    signerUuid={farcasterUser?.signer_uuid}
                    onSuccess={() => {
                      setCrosscastText("");
                      setShowCreatePostModal(false);
                      refreshData();
                    }}
                  />
                  {/* <Button className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-full shadow-lg shadow-purple-600/20">
                    Post
                  </Button> */}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
