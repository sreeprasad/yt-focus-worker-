# YouTube Focus Filter

A Chrome extension that cleans up your YouTube homepage. It uses
[Cloudflare Clef](https://blog.cloudflare.com/clef-decision-models/) to look at every video
and keeps only the topics you care about. Everything else is hidden.


<img width="3456" height="2066" alt="Screenshot 2026-10-26 at 20 24 24" src="https://github.com/user-attachments/assets/3975f5af-2362-4b76-8262-7a42f641d841" />



Videos that are close calls are blurred instead of hidden, so you can click to see them.
A **Peek** button shows you everything that was hidden.

## How to make it work

You need a free Cloudflare account, Node.js, and Chrome.

### 1. Deploy the Worker

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

This prints your Worker URL, something like `https://yt-focus-worker.<you>.workers.dev`.

### 2. Create your API key

```bash
openssl rand -hex 16
npx wrangler secret put APP_KEY
```

Paste the key from the first command when the second one asks for it.

### 3. Test it

```bash
./test.sh https://yt-focus-worker.<you>.workers.dev <your-key>
```

You should see each sample video with the topic Clef picked.

### 4. Add the extension to Chrome

```bash
cp extension/config.example.js extension/config.js
```

Open `extension/config.js` and fill in your Worker URL and key.

Then go to `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**,
and choose the `extension` folder. Open YouTube and the filter starts working.

## About API keys

- **You don't need a Cloudflare API token.** The Worker talks to Clef directly through
  Cloudflare, so no token is stored anywhere.
- **The key you create is your own password** between the extension and your Worker.
  It stops other people from using your Worker and spending your Cloudflare usage.
- **Never commit `config.js`.** It holds your key and is already in `.gitignore`.
  Only `config.example.js`, which has placeholders, goes to GitHub.
- **If your key leaks,** make a new one with the same two commands from step 2,
  then update `config.js` and reload the extension.

## Changing your topics

Edit the topic list in the Worker and run `npx wrangler deploy` again.
