import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { prisma } from "@/lib/prisma";

interface CrosscastButtonProps {
  userId: string | undefined;
  tweetText: string;
  tweetUrl?: string;
  signerUuid?: string;
}

export function CrosscastButton({
  userId,
  tweetText,
  tweetUrl,
  signerUuid,
}: CrosscastButtonProps) {
  const [isCrosscasting, setIsCrosscasting] = useState(false);

  const handleCrosscast = async () => {
    if (tweetText === "") {
      alert("No content provided!");
      return;
    }
    setIsCrosscasting(true);
    try {
      if (!userId) throw new Error("userId is not provided");
      // 1. Post to Farcaster
      const farcasterResponse = await fetch("/api/farcaster/crosscast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signerUuid,
          text: tweetText,
          ...(tweetUrl && { embeds: [tweetUrl] }),
        }),
      });
      const farcasterResult = await farcasterResponse.json();

      // 2. Post to Twitter
      const twitterResponse = await fetch("/api/twitter/tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tweetText }),
      });
      const twitterResult = await twitterResponse.json();
      console.log("tweety: ", twitterResult);

      if (!farcasterResult.success || !twitterResult.success) {
        throw new Error(
          "Failed to crosspost to " +
            [
              !farcasterResult.success && "Farcaster",
              !twitterResult.success && "Twitter",
            ]
              .filter(Boolean)
              .join(" and ")
        );
      }

      const post = await prisma.post.create({
        data: {
          userId: userId,
          tweetId: twitterResult.tweet.id,
          tweetText: tweetText,
          farcasterHash: farcasterResult.cast.hash ?? null,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          lastTweetId: twitterResult.id,
          lastTweetTimestamp: post.createdAt,
        },
      });

      toast.success("Successfully crossposted to Farcaster and Twitter!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to crosspost"
      );
    } finally {
      setIsCrosscasting(false);
    }
  };

  return (
    <Button
      onClick={handleCrosscast}
      disabled={isCrosscasting || !signerUuid}
      variant="outline"
      size="sm"
      className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-full shadow-lg shadow-purple-600/20"
    >
      {isCrosscasting ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Crossposting...
        </>
      ) : (
        <div className="flex items-center gap-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 250 250"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-purple-500"
          >
            <path
              d="M244.553 89.3347C238.637 58.6438 223.517 31.8955 199.358 17.3598C184.468 8.69625 167.933 5.01346 150.537 5.01346C132.006 5.01346 114.724 9.14885 99.7243 17.1396C74.5715 31.2263 58.6574 58.6438 52.7415 89.3347C42.5232 142.461 66.2372 191.263 110.424 206.909C116.34 208.891 122.476 209.784 128.612 209.784C134.748 209.784 141.104 208.891 147.02 206.909C155.575 204.037 163.91 199.022 171.585 192.377C174.677 189.505 174.677 184.71 171.585 181.838C168.493 178.966 163.47 178.966 160.378 181.838C154.242 187.142 147.466 191.043 140.214 193.474C129.556 197.238 117.452 197.238 106.794 193.474C69.7573 180.505 49.4299 138.918 58.2168 93.3189C63.2535 67.0225 76.7961 44.2012 97.6715 32.7871C110.204 25.9209 124.529 22.5978 139.073 22.5978C153.618 22.5978 167.943 25.9209 180.475 32.7871C201.351 44.2012 214.893 67.0225 219.93 93.3189C228.717 138.918 208.389 180.505 171.353 193.474C169.52 194.147 167.687 193.033 167.687 191.042V139.147C167.687 113.732 155.595 100.983 134.499 100.983C123.841 100.983 115.506 103.634 109.37 108.87C103.233 114.105 100.142 121.192 100.142 130.347C100.142 138.326 102.793 144.673 107.83 149.468C113.087 154.483 120.339 156.914 128.894 156.914C133.042 156.914 136.574 156.472 139.666 155.579C138.774 161.034 135.462 165.388 130.205 168.26C124.949 171.132 118.812 172.466 112.016 172.466C104.544 172.466 98.1878 170.255 93.1511 166.051C88.1144 161.847 85.4633 156.251 85.4633 149.468H67.8225C67.8225 161.847 72.4188 171.573 81.6515 178.577C90.8842 185.582 100.777 189.084 112.457 189.084C123.115 189.084 132.789 186.213 141.141 180.537C149.274 174.861 153.84 166.713 154.732 156.251C158.926 157.144 163.339 157.585 168.156 157.585C179.916 157.585 189.252 154.262 196.064 147.616C202.875 140.971 206.187 131.461 206.187 118.712V115.399L205.747 115.619C199.17 118.932 191.937 120.578 184.043 120.578C175.148 120.578 167.374 118.049 160.562 112.813C153.75 107.577 150.124 100.542 149.672 91.6077C149.672 91.3875 149.672 91.1673 149.672 90.9471C149.672 90.7268 149.672 90.5066 149.672 90.2864C150.124 81.3519 153.75 74.5369 160.562 69.301C167.374 64.0651 175.148 61.5356 184.043 61.5356C192.718 61.5356 200.052 64.0651 206.187 69.301V67.0939C206.187 54.7843 202.875 45.0948 196.064 38.2286C189.252 31.3624 179.916 28.0394 168.156 28.0394C158.164 28.0394 150.124 30.3479 143.753 34.9862C141.101 37.1935 140.881 41.1069 143.313 43.5351C145.745 45.9633 149.893 45.7431 152.545 43.5351C156.739 40.6633 162.115 39.1219 168.156 39.1219C175.849 39.1219 181.82 41.2099 186.196 45.4765C189.969 49.0812 192.116 54.3526 192.718 61.3153C186.141 57.7812 178.883 55.8975 170.649 55.8975C158.889 55.8975 148.794 59.3219 140.461 66.1708C132.128 73.0197 127.501 82.4255 126.389 94.2124C126.389 94.4327 126.389 94.6529 126.389 94.8732C126.389 95.0934 126.389 95.3136 126.389 95.5339C127.501 107.321 132.128 116.726 140.461 123.575C148.794 130.424 158.889 133.848 170.649 133.848C180.215 133.848 188.676 131.329 196.064 126.447V139.147C196.064 151.171 193.173 160.734 187.529 167.836C181.884 174.937 173.847 178.525 163.409 178.525C157.713 178.525 152.676 177.852 148.262 176.518C148.042 176.518 147.811 176.297 147.591 176.297C146.699 176.077 145.807 175.856 144.915 175.636L144.695 175.415C143.803 175.195 142.911 174.754 142.019 174.533C141.798 174.533 141.578 174.312 141.358 174.312C139.073 173.419 137.009 172.305 135.176 170.984C135.176 170.984 134.956 170.984 134.956 170.764C133.783 169.871 132.611 168.977 131.659 167.863C130.486 166.529 130.927 164.547 132.38 163.654C138.297 160.341 142.911 156.147 146.223 150.911C149.535 145.676 151.202 139.809 151.202 133.186C151.202 121.925 147.669 112.833 140.602 105.984C133.535 99.1355 124.025 95.7539 111.933 95.7539C100.614 95.7539 91.4965 99.3973 84.4295 106.646C77.3625 113.894 73.8289 123.354 73.8289 134.741C73.8289 147.175 78.4251 157.585 87.6578 165.82C96.8905 174.055 108.036 178.084 121.137 178.084C130.59 178.084 139.383 175.856 147.37 171.132C155.357 166.408 160.799 159.841 163.671 151.421C181.762 151.421 196.284 146.186 207.163 135.927C218.041 125.669 223.517 111.72 223.517 94.2124V89.3347H244.553V89.3347Z"
              fill="currentColor"
            />
          </svg>
          Crosspost
        </div>
      )}
    </Button>
  );
}
