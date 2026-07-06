interface RedditPost {
  data: {
    title: string;
    selftext: string;
    permalink: string;
  };
}

interface RedditListing {
  data: { children: RedditPost[] };
}

async function getRedditAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "asd-guide-scraper/0.1",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function fetchSubredditTopPosts(subreddit: string, limit = 10): Promise<RedditPost[]> {
  const token = await getRedditAccessToken();
  if (!token) return [];

  const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/top?limit=${limit}&t=month`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "asd-guide-scraper/0.1",
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as RedditListing;
  return json.data.children;
}

export function mapRedditPostToRemedyCandidate(post: RedditPost): { text: string; sourceUrl: string } {
  return {
    text: post.data.title,
    sourceUrl: `https://www.reddit.com${post.data.permalink}`,
  };
}
