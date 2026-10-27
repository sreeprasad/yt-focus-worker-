// yt-focus-worker: asks Cloudflare Clef which topic each YouTube video is about.

// Your allow list. Anything that matches none of these should land in "other".
const TOPICS = {
  math: "Mathematics: proofs, calculus, linear algebra, probability, math explanations",
  competitive_programming: "Competitive programming: Codeforces, AtCoder, LeetCode contests, ICPC, contest problem solving",
  machine_learning:
    "Teaching or explaining machine learning, deep learning or LLMs: tutorials, paper walkthroughs, AI engineering how-tos (not tech news, consumer AI app promos, or products that merely use AI)",
  hackathons: "Hackathons: hackathon projects, vlogs, demos or tips",
  algorithms: "Algorithms and data structures",
  lectures: "Technical or STEM lectures: university courses or conference talks on CS, math or engineering",
  system_design: "System design, software architecture and distributed systems",
  interview_prep: "Software engineering interview preparation (coding, system design or behavioral interviews)",
  open_source:
    "Open-source and GitHub projects: trending GitHub repos, open-source project roundups, walkthroughs of open-source tools or codebases",
  dev_tools:
    "Developer tools and AI coding agents: Claude Code, Codex, Cursor, CLIs, terminal tools, coding workflows and automation for programmers",
  other:
    "Anything else: news, politics, business and finance, tech news and company announcements, consumer AI apps (free image, video or animation generators, 'make viral content' tools), product reviews, gadgets, cars and self-driving cars, travel or personal vlogs, entertainment",
};

const MAX_VIDEOS = 50;

const CORS = {
  "Access-Control-Allow-Origin": "https://www.youtube.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-YT-Focus-Key",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

async function classify(env, video) {
  const out = await env.AI.run("@cf/cloudflare/clef-flash", {
    model: "clef-flash",
    state: { title: video.title || "", channel: video.channel || "" },
    questions: {
      topic: {
        type: "choice",
        instructions:
          "Which topic is this YouTube video mainly about? Judge from `title` and `channel`.",
        criteria: TOPICS,
      },
    },
  });

  const answer = out.answers.topic;
  return {
    id: video.id,
    topic: answer.choice,
    confidence: answer.confidence,
    other: answer.probabilities?.other ?? null, // the number the extension's hide rule uses
    probabilities: answer.probabilities,
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/classify") {
      return json({ error: "POST /classify only" }, 404);
    }

    // Simple shared key so random people can't spend your Workers AI allowance.
    if (!env.APP_KEY || request.headers.get("X-YT-Focus-Key") !== env.APP_KEY) {
      return json({ error: "bad or missing key" }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }

    const videos = Array.isArray(body.videos) ? body.videos.slice(0, MAX_VIDEOS) : [];
    if (videos.length === 0) return json({ error: "send { videos: [{ id, title, channel }] }" }, 400);

    const results = await Promise.all(
      videos.map((v) =>
        classify(env, v).catch((err) => ({ id: v.id, error: String(err) }))
      )
    );
    return json({ results });
  },
};
