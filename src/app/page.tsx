/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Twitter,
  MessageCircle,
  Check,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  Hash,
  XCircle,
  X,
  TrendingUp,
  Share2,
  Calendar,
  BarChart3,
  Zap,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";


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
  mediaEnabled: boolean;
}

export default function Hero() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: farcasterUser, isAuthenticated: isFarcasterAuthenticated } =
    useNeynarContext();
  const [showModal, setShowModal] = useState(false);
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [isTwitterLoading, setIsTwitterLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- AUTH LOGIC FROM PROPER PAGE ---
  // Remove the old useEffect for checkTwitterAuth and the checkTwitterAuth function

  // Show toast on Farcaster connect
  useEffect(() => {
    if (isFarcasterAuthenticated) {
      toast({
        title: "Farcaster Connected!",
        description: "Your Farcaster account has been connected successfully.",
      });
    }
  }, [isFarcasterAuthenticated, toast]);

  const checkAuthStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const response = await fetch("/api/auth/twitter/status");
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && !twitterUser) {
          setTwitterUser(data.user);
          toast({
            title: "Twitter Connected!",
            description: "Your Twitter account has been connected successfully.",
          });
        } else if (data.authenticated) {
          setTwitterUser(data.user);
        } else {
          setTwitterUser(null);
        }
      } else {
        setTwitterUser(null);
      }
    } catch (error) {
      console.error("Error checking Twitter auth:", error);
      setTwitterUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- END AUTH LOGIC FROM PROPER PAGE ---

  const initializeUser = async () => {
    if (!farcasterUser || !twitterUser) return;
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
    }
  };

  const loadUserData = async (userId?: string) => {
    try {
      const userIdToUse = userId || userData?.id;
      if (!userIdToUse) return;
      // Load user stats
      const statsResponse = await fetch(`/api/user/stats?userId=${userIdToUse}`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setUserStats(stats);
      }
      // Load recent activity
      const activityResponse = await fetch(`/api/posts/recent?userId=${userIdToUse}`);
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
        description: "Failed to connect Twitter. Please try again.",
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
          description: "Your Twitter account has been disconnected successfully.",
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
      setUserData(null);
      toast({
        title: "Disconnected from Farcaster",
        description: "Your Farcaster account has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Error disconnecting Farcaster:", error);
    }
  };

  const toggleMedia = () => {
    if (!userData) {
      setUserData({
        id: '',
        twitterUsername: '',
        crosspostEnabled: false,
        mediaEnabled: true,
      });
      return;
    }
    setUserData({ ...userData, mediaEnabled: !userData.mediaEnabled });
  };

  const toggleCrosspost = async () => {
    if (!userData) return;
    try {
      const response = await fetch("/api/user/toggle-crosspost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !userData.crosspostEnabled, userId: userData.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setUserData({ ...userData, crosspostEnabled: data.enabled });
        toast({
          title: data.enabled ? "Crossposting Enabled" : "Crossposting Disabled",
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

  const isFullyAuthenticated = isFarcasterAuthenticated && twitterUser;
  const isConnected = isFullyAuthenticated;

  if (isCheckingAuth) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
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
                  {/* Farcaster Connection */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="flex items-center space-x-3 text-black dark:text-white">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Farcaster</span>
                    </span>
                    {isFarcasterAuthenticated ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="text-sm">Connected</span>
                      </div>
                    ) : (
                      <NeynarAuthButton className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" />
                    )}
                  </div>
                  {/* Twitter Connection */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="flex items-center space-x-3 text-black dark:text-white">
                      <Twitter className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Twitter</span>
                    </span>
                    {twitterUser ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="text-sm">Connected</span>
                      </div>
                    ) : (
                      <Button
                        onClick={handleTwitterConnect}
                        disabled={isTwitterLoading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {isTwitterLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
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

  // --- Dashboard ---
  return (
    <ConnectedPage
      farcasterUser={farcasterUser}
      twitterUser={twitterUser}
      userData={userData}
      userStats={userStats}
      recentActivity={recentActivity}
      isRefreshing={isRefreshing}
      onRefresh={refreshData}
      onToggleCrosspost={toggleCrosspost}
      onToggleMedia={toggleMedia}
      onTwitterDisconnect={handleTwitterDisconnect}
      onFarcasterDisconnect={handleFarcasterDisconnect}
    />
  );
}

// --- Dashboard Components ---

type ConnectedAccountProps = {
  platform: "twitter" | "farcaster";
  user: any;
  onDisconnect: (platform: string) => void;
};

function ConnectedAccount({
  platform,
  user,
  onDisconnect,
}: ConnectedAccountProps) {
  const PlatformIcon = platform === "twitter" ? Twitter : Hash;
  const platformName = platform === "twitter" ? "Twitter" : "Farcaster";
  return (
    <div className="flex items-center justify-between p-4 mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg ">
            <PlatformIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-black font-medium">{platformName}</h3>
            <p className="text-gray-900 text-sm">Connected</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <img
            src={user.avatar || user.pfp_url || user.profile_image_url || user.farcasterPfpUrl}
            alt={user.username || user.screen_name || user.farcasterUsername}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h4 className="text-black font-medium text-lg">
              @{user.username || user.screen_name || user.farcasterUsername}
            </h4>
          </div>
        </div>
      </div>
      <button
        className="px-4 py-2 bg-black hover:bg-gray-600 text-white rounded-lg transition-colors"
        onClick={() => onDisconnect(platform)}
      >
        Disconnect
      </button>
    </div>
  );
}

type TweetItemProps = { item: RecentActivity };
function TweetItem({ item }: TweetItemProps) {
  return (
    <div className="flex items-start space-x-4 p-4 border-b border-slate-700 last:border-b-0">
      <div className="p-2 rounded-lg bg-black-700 flex-shrink-0">
        {item.platforms.includes("twitter") ? (
          <Twitter className="w-4 h-4 text-blue-400" />
        ) : (
          <MessageCircle className="w-4 h-4 text-purple-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white mb-3 leading-relaxed">{item.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {item.status === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">Synced</span>
                </>
              ) : item.status === "error" ? (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">Error</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm">Pending</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-1 text-slate-400 text-sm">
              <Clock className="w-3 h-3" />
              <span>{item.timestamp}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-2">
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
        {item.status === "error" && item.errorMessage && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm text-red-600">
            {item.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

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

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="bg-black rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 text-sm ${
              trend > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            <TrendingUp
              className={`w-4 h-4 ${trend < 0 ? "rotate-180" : ""}`}
            />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-slate-400 text-sm">{title}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function PlatformDonut({ twitter, farcaster }:any) {
    const total = twitter + farcaster;
    const twitterPct = total ? (twitter / total) * 100 : 0;
    const farcasterPct = total ? (farcaster / total) * 100 : 0;
    // SVG circle math
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const twitterOffset = circumference * (1 - twitterPct / 100);
  
    return (
      <div className="flex flex-col items-center">
        <svg width="100" height="100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={0}
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={twitterOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="flex space-x-4 mt-2">
          <span className="flex items-center text-blue-400">
            <Twitter className="w-4 h-4 mr-1" /> {twitter} ({twitterPct.toFixed(1)}%)
          </span>
          <span className="flex items-center text-purple-400">
            <Hash className="w-4 h-4 mr-1" /> {farcaster} ({farcasterPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    );
  }

function WeeklyChart({ data }: any) {
  const maxPosts = Math.max(...data.map((d: any) => d.posts), 1);
  return (
    <div className="bg-black rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Weekly Posting Trend</h3>
      </div>
      <div className="flex items-end space-x-4 h-40">
        {data.map((day: { day: string; posts: number }, index: number) => (
          <div key={day.day} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center mb-2">
              <div
                className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-500"
                style={{ height: `${(day.posts / maxPosts) * 100 || 4}px`, minHeight: '4px' }}
              ></div>
              <span className="text-xs text-slate-400 mt-2">{day.posts}</span>
            </div>
            <span className="text-xs text-slate-400 mt-1">{day.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}



type ConnectedPageProps = {
  farcasterUser: any;
  twitterUser: any;
  userData: UserData | null;
  userStats: UserStats | null;
  recentActivity: RecentActivity[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onToggleCrosspost: () => void;
  onToggleMedia?: () => void;
  onTwitterDisconnect: () => void;
  onFarcasterDisconnect: () => void;
};
function ConnectedPage({
  farcasterUser,
  twitterUser,
  userData,
  userStats,
  recentActivity,
  isRefreshing,
  onRefresh,
  onToggleCrosspost,
  onToggleMedia = () => {}, // Optional handler for media toggle
  onTwitterDisconnect,
  onFarcasterDisconnect,
}: ConnectedPageProps) {
  return (
    <div className="min-h-screen bg-[#F3F0ED] text-black  [&::-webkit-scrollbar]:hidden">
      <div className="max-w-6xl mx-auto p-6  ">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold  mb-2">Dashboard</h1>
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
            <Button variant="outline" size="sm" onClick={onToggleCrosspost} className="bg-white text-black">
              {userData?.crosspostEnabled ? "Disable" : "Enable"} Crosspost
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-white text-black"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Total Posts"
            value={userStats?.totalPosts || 0}
            subtitle="This month"
            icon={Share2}
            trend={undefined}
            color="blue"
          />
          <MetricCard
            title="Cross-Posts"
            value={userStats?.crossPosts || 0}
            subtitle="Synced to Farcaster"
            icon={CheckCircle}
            trend={undefined}
            color="green"
          />
          <MetricCard
            title="Engagement Rate"
            value={`${userStats?.engagementRate || 0}%`}
            subtitle="Per post"
            icon={TrendingUp}
            trend={undefined}
            color="orange"
          />
          <MetricCard
            title="Total Followers"
            value={(userStats?.totalFollowers || 0).toLocaleString()}
            subtitle="Across platforms"
            icon={Activity}
            trend={undefined}
            color="purple"
          />
        </div>

        {/* Performance Overview */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  {/* Today's Performance */}
  <div className="bg-black text-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold ">Today's Performance</h3>
      <Calendar className="w-5 h-5 text-gray-400" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <div className="text-xl font-bold text-blue-600">{userStats?.todayPosts || 0}</div>
        <div className="text-xs text-gray-600">Posts</div>
      </div>
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <div className="text-xl font-bold text-green-600">{userStats?.todayEngagement || 0}%</div>
        <div className="text-xs text-gray-600">Engagement</div>
      </div>
      <div className="text-center p-3 bg-purple-50 rounded-lg">
        <div className="text-xl font-bold text-purple-600">+{userStats?.newFollowersToday || 0}</div>
        <div className="text-xs text-gray-600">Followers</div>
      </div>
    </div>
  </div>

  {/* Sync Status */}
  <div className="bg-black text-white rounded-xl border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold ">Sync Status</h3>
      <Activity className="w-5 h-5 text-gray-400" />
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span >Successful</span>
        </div>
        <span className="font-semibold text-green-600">
          {recentActivity.filter(item => item.status === 'success').length}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-yellow-500" />
          <span >Pending</span>
        </div>
        <span className="font-semibold text-yellow-600">
          {recentActivity.filter(item => item.status === 'pending').length}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span >Failed</span>
        </div>
        <span className="font-semibold text-red-600">
          {recentActivity.filter(item => item.status === 'error').length}
        </span>
      </div>
    </div>
  </div>
</div>
        {/* Connection Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-6">
            Connection Status
          </h2>
          <ConnectedAccount platform="twitter" user={twitterUser} onDisconnect={onTwitterDisconnect} />
          <ConnectedAccount platform="farcaster" user={farcasterUser} onDisconnect={onFarcasterDisconnect} />
        </div>
        {/* Recent Tweets/Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold  mb-6">Recent Activity</h2>
          <div className="bg-black rounded-xl border border-slate-700">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <TweetItem key={item.id} item={item} />
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
        </div>
        {/* Settings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Settings</h2>
          <div className="bg-black rounded-xl border border-slate-700 p-6">
            <SettingsToggle
              label="Cross-post all tweets automatically"
              enabled={userData?.crosspostEnabled || false}
              onChange={onToggleCrosspost}
            />
            <SettingsToggle
              label="Allow media files"
              enabled={Boolean(userData?.mediaEnabled)}
              onChange={onToggleMedia}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

