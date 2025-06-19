import 'dotenv/config';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';
import axios from 'axios';
// import fs from 'fs';
// import { TwitterApi } from 'twitter-api-v2';

// Load users from a JSON file (replace with DB in production)
// const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const users = [
  {
    twitterUsername: "Alstudd17",
    twitterUserId: "1746238274237272064",
    //   "twitterAccessToken": "MVRSMThVamlLVVI3bm5BUmJUWmFoTGhxbDV3bFVBZ1g0bEtfa0YyTWNCV041OjE3NTAzNDA0MjI0NTU6MToxOmF0OjE",
    farcasterSignerUuid: "cc9bcf76-8427-4347-9f38-0ae40fba595a",
    lastTweetId: "1921834759899975938",
    crosspostEnabled: true,
  },
];

async function fetchLatestTweet(user) {
  const url = `https://twitter241.p.rapidapi.com/user-tweets?user=${user.twitterUserId}&count=1`;
  const headers = {
    "x-rapidapi-host": "twitter241.p.rapidapi.com",
    "x-rapidapi-key": process.env.RAPID_API_KEY,
  };
  const response = await axios.get(url, { headers });
  // Parse the response as in your Python code
  const instructions = response.data.result.timeline.instructions;
  for (const instruction of instructions) {
    if (instruction.type === "TimelineAddEntries") {
      for (const entry of instruction.entries) {
        const content = entry.content?.itemContent?.tweet_results?.result;
        if (content) {
          const tweetId = content.rest_id;
          const tweetText = content.legacy?.full_text;
          return { tweetId, tweetText };
        }
      }
    }
  }
  return null;
}

async function crosspostForUser(user) {
  try {
    // const twitterClient = new TwitterApi({
    //   appKey: process.env.TWITTER_API_KEY,
    //   appSecret: process.env.TWITTER_API_SECRET,
    //   accessToken: process.env.TWITTER_ACCESS_TOKEN,
    //   accessSecret: process.env.TWITTER_ACCESS_SECRET,
    // });
    // // const twitterClient = new TwitterApi(user.twitterAccessToken);
    // const tweets = await twitterClient.v2.userTimeline(user.twitterUserId, {
    //   exclude: "replies",
    //   max_results: 5,
    // });
    // const latestTweet = tweets.data?.data?.[0];

    // if (!latestTweet || latestTweet.id === user.lastTweetId) return;

    const latest = await fetchLatestTweet(user);
    console.log(latest)
    if (!latest || latest.tweetId === user.lastTweetId) return;

    // Post to Farcaster
    const neynarClient = new NeynarAPIClient(
      new Configuration({ apiKey: process.env.NEYNAR_API_KEY })
    );
    await neynarClient.publishCast({
      signerUuid: user.farcasterSignerUuid,
      text: latest.tweetText,
    });

    // Update last seen tweet
    user.lastTweetId = latest.tweetId;
    console.log(
      `Crossposted tweet for user ${user.twitterUsername}: ${latest.tweetText}`
    );
  } catch (err) {
    console.error(`Error for user ${user.twitterUsername}:`, err);
  }
}

async function main() {
  console.log("Main Func")
  for (const user of users) {
    if (user.crosspostEnabled) {
      await crosspostForUser(user);
    }
  }
  // Save updated lastTweetId
  return users;
  //   fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
}

main();
