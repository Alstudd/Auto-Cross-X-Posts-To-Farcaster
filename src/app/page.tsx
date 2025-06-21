/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
  const { user: farcasterUser, isAuthenticated: isFarcasterAuthenticated, logoutUser: logoutFarcasterUser } =
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


  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, -200])
  const y2 = useTransform(scrollY, [0, 1000], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  useEffect(() => {
    // Smooth scrolling
    const handleScroll = () => {
      document.documentElement.style.scrollBehavior = "smooth"
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
      <>
        {/* Hero Section */}
        <div className="w-full bg-[#F5F2EE] min-h-screen relative overflow-hidden">
          {/* Parallax Background Elements */}
          <motion.div style={{ y: y1 }} className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black/10 rounded-full"></div>
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-black/5 rounded-full"></div>
          </motion.div>

          {/* Header */}
          <motion.header
            style={{ opacity }}
            className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-14"
          >
            <div className="text-2xl font-bold tracking-[0.2em] text-black">CROSSPOST</div>
            <div className="text-right">
              <button
                onClick={() => setShowModal(true)}
                className="text-lg text-gray-700 hover:text-black transition-colors cursor-pointer relative group"
              >
                Get Started
                <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left">
                  <svg width="100%" height="2" viewBox="0 0 100 2" className="absolute top-0 left-0">
                    <path d="M0 1 Q25 0 50 1 T100 1" fill="none" stroke="currentColor" strokeWidth="1.5" />
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
                We sync your tweets to
                <br />
                <span className="font-normal">Farcaster automatically</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                Create dynamic cross-platform presence that helps your content reach new audiences.
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
          <motion.div style={{ y: y1 }} className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
              <defs>
                <pattern id="wavePattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 20 Q10 10 20 20 T40 20" fill="none" stroke="black" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>

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

              {/* Detailed line work */}
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.path
                  key={i}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.2 }}
                  transition={{ duration: 2, delay: 1 + i * 0.1 }}
                  d={`M${i * 60} ${420 + Math.sin(i) * 20} Q${i * 60 + 30} ${400 + Math.sin(i + 1) * 20} ${i * 60 + 60} ${420 + Math.sin(i + 2) * 20}`}
                  fill="none"
                  stroke="black"
                  strokeWidth="1"
                />
              ))}
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
              <h2 className="text-3xl font-light mb-2 text-black text-center">Let Get Started</h2>
              <p className="text-gray-600 mb-8 text-center leading-relaxed">
                Connect your accounts to begin seamless crossposting between platforms.
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
                        {isFarcasterAuthenticated ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  {!isFarcasterAuthenticated && <NeynarAuthButton className="text-white bg-black rounded-xl px-2 cursor-pointer" />}
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
                      <p className="text-sm text-gray-500">{twitterUser ? "Connected" : "Not connected"}</p>
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
                    🎉 Both accounts connected! Youre ready to start crossposting.
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:flex items-center justify-between mb-8"
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
      </AnimatePresence>
    </div>
  );
}
