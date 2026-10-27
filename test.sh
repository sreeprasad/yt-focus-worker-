#!/usr/bin/env bash
# Usage: ./test.sh https://yt-focus-worker.<you>.workers.dev YOUR_APP_KEY
# Prints one line per video: expected verdict, Clef's topic, and its "other" probability.
URL="$1"
KEY="$2"

curl -s -X POST "$URL/classify" \
  -H "Content-Type: application/json" \
  -H "X-YT-Focus-Key: $KEY" \
  -d '{
    "videos": [
      { "id": "keep: system design", "title": "News Feed System Design (Twitter, Facebook)", "channel": "The Unhappy Architect" },
      { "id": "keep: competitive programming", "title": "He Solved 100 LeetCode Problems… But Can He Build a Calculator?", "channel": "James Peralta" },
      { "id": "keep: dev tools", "title": "CLI-Anything: Turn ANY App into a CLI for Claude Code & Codex (GIMP, Blender, LibreOffice & More!)", "channel": "" },
      { "id": "keep: open source", "title": "Top Open-Source GitHub Projects : VoxCPM, ElyOffice, pandacode, Snitch, PageIndex & net-merge #304", "channel": "" },
      { "id": "hide: politics", "title": "Byron Donalds calls out FRAUD Dem opponent as governor race tightens", "channel": "Fox News Clips" },
      { "id": "hide: consumer AI app", "title": "This FREE AI Makes UNLIMITED Viral Stick Animations | FREE & UNLIMITED", "channel": "" },
      { "id": "hide: robotaxi vlog", "title": "Amazon robotaxi is here (and it is free)", "channel": "Singh in USA" }
    ]
  }' | python3 -c '
import json, sys
for r in json.load(sys.stdin)["results"]:
    rid = r["id"]
    if "error" in r:
        err = r["error"]
        print(f"{rid:32} ERROR {err}")
        continue
    topic, other = r["topic"], r["other"]
    best = r["probabilities"][topic]
    print(f"{rid:32} -> {topic:24} {best:5.0%}   other {other:5.0%}")
'
