// @/lib/chat/bot.ts
// CampusBot: a fully client-side slash-command assistant. Commands run locally
// and produce ephemeral messages (only the sender sees them, like Discord's
// ephemeral slash replies) — no backend, no persistence, no restart needed.

import type { ChatUser } from "@/types";

export const BOT_USER: ChatUser = {
  id: "campusbot",
  username: "CampusBot",
  first_name: "Campus",
  last_name: "Bot",
  avatar_url: "",
};

export interface BotCommand {
  name: string;
  usage: string;
  description: string;
}

export const BOT_COMMANDS: BotCommand[] = [
  { name: "help", usage: "/help", description: "Show everything CampusBot can do" },
  { name: "roll", usage: "/roll [sides]", description: "Roll a die (default 6)" },
  { name: "flip", usage: "/flip", description: "Flip a coin" },
  { name: "8ball", usage: "/8ball <question>", description: "Ask the magic 8-ball" },
  { name: "rps", usage: "/rps <rock|paper|scissors>", description: "Play rock-paper-scissors" },
  { name: "gif", usage: "/gif <term>", description: "Drop a playful reaction" },
  { name: "shrug", usage: "/shrug", description: "¯\\_(ツ)_/¯" },
  { name: "flip-table", usage: "/tableflip", description: "(╯°□°)╯︵ ┻━┻" },
];

export interface BotOutcome {
  /** What CampusBot says back (rendered as an ephemeral bot message). */
  reply: string;
  /** Echo of the user's command, shown as their own ephemeral bubble. */
  echo: string;
}

const EIGHT_BALL = [
  "It is certain. 🎱",
  "Without a doubt.",
  "Yes — definitely.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Don't count on it.",
  "My reply is no.",
  "Very doubtful.",
];

const GIFS: Record<string, string> = {
  party: "🎉🕺💃🎊",
  sad: "😭💧🫠",
  happy: "😄✨🌈",
  love: "😍💖🫶",
  fire: "🔥🔥🔥",
  clap: "👏👏👏",
  dance: "🕺💃🎶",
};

// Vary "randomness" deterministically without Math.random (keeps SSR/lint happy
// and is plenty for a toy bot): mix the clock with the argument text.
function pick<T>(arr: T[], seedText: string): T {
  let h = Date.now();
  for (let i = 0; i < seedText.length; i++) h = (h * 31 + seedText.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

/** True if the text is a slash command CampusBot should handle. */
export function isBotCommand(text: string): boolean {
  return /^\/[a-z0-9-]/i.test(text.trim());
}

/** Run a command; returns null if it isn't a recognized command. */
export function runBotCommand(text: string): BotOutcome | null {
  const trimmed = text.trim();
  if (!isBotCommand(trimmed)) return null;

  const [raw, ...rest] = trimmed.slice(1).split(/\s+/);
  const cmd = raw.toLowerCase();
  const arg = rest.join(" ");
  const echo = trimmed;

  switch (cmd) {
    case "help":
      return {
        echo,
        reply:
          "👋 **CampusBot** commands:\n" +
          BOT_COMMANDS.map((c) => `• \`${c.usage}\` — ${c.description}`).join("\n"),
      };

    case "roll": {
      const sides = Math.max(2, Math.min(1000, parseInt(arg, 10) || 6));
      const value = (Math.abs(hash(echo)) % sides) + 1;
      return { echo, reply: `🎲 You rolled a **${value}** (d${sides}).` };
    }

    case "flip":
      return {
        echo,
        reply: pick(["🪙 **Heads!**", "🪙 **Tails!**"], echo),
      };

    case "8ball":
      if (!arg) return { echo, reply: "🎱 Ask me a question: `/8ball will I pass?`" };
      return { echo, reply: `🎱 ${pick(EIGHT_BALL, arg)}` };

    case "rps": {
      const choices = ["rock", "paper", "scissors"] as const;
      const you = arg.toLowerCase() as (typeof choices)[number];
      if (!choices.includes(you))
        return { echo, reply: "✊ Try `/rps rock`, `/rps paper` or `/rps scissors`." };
      const bot = pick([...choices], echo);
      const emoji = { rock: "✊", paper: "✋", scissors: "✌️" } as const;
      let result = "It's a tie! 🤝";
      if (
        (you === "rock" && bot === "scissors") ||
        (you === "paper" && bot === "rock") ||
        (you === "scissors" && bot === "paper")
      )
        result = "You win! 🎉";
      else if (you !== bot) result = "I win! 🤖";
      return {
        echo,
        reply: `${emoji[you]} vs ${emoji[bot]} — ${result}`,
      };
    }

    case "gif": {
      const key = arg.toLowerCase().trim();
      const found = GIFS[key];
      return {
        echo,
        reply: found
          ? `${found}\n_(“${key}” reaction)_`
          : `Try one of: ${Object.keys(GIFS).map((k) => `\`${k}\``).join(", ")}`,
      };
    }

    case "shrug":
      return { echo, reply: "¯\\\\_(ツ)_/¯" };

    case "tableflip":
      return { echo, reply: "(╯°□°)╯︵ ┻━┻" };

    default:
      return {
        echo,
        reply: `🤖 Unknown command \`/${cmd}\`. Try \`/help\`.`,
      };
  }
}

function hash(text: string): number {
  let h = Date.now();
  for (let i = 0; i < text.length; i++) h = (h * 33 + text.charCodeAt(i)) | 0;
  return h;
}
