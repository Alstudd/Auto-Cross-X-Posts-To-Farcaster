import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Twitter, MessageCircle } from "lucide-react";

interface Post {
  id: string;
  content: string;
  timestamp: string;
  platforms: ("twitter" | "farcaster")[];
}

export function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual data fetching
    // This is a placeholder for demonstration
    const mockPosts: Post[] = [
      {
        id: "1",
        content: "Just launched my new project! 🚀",
        timestamp: "2024-03-20T10:00:00Z",
        platforms: ["twitter", "farcaster"],
      },
      {
        id: "2",
        content: "Excited to share some updates...",
        timestamp: "2024-03-19T15:30:00Z",
        platforms: ["twitter", "farcaster"],
      },
    ];

    setTimeout(() => {
      setPosts(mockPosts);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent posts to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          <p className="mb-3">{post.content}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <time dateTime={post.timestamp}>
              {new Date(post.timestamp).toLocaleDateString()}
            </time>
            <div className="flex items-center space-x-2">
              {post.platforms.includes("twitter") && (
                <Twitter className="w-4 h-4" />
              )}
              {post.platforms.includes("farcaster") && (
                <MessageCircle className="w-4 h-4" />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 