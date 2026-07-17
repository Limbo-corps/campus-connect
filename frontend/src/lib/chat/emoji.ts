// @/lib/chat/emoji.ts
// Lightweight, dependency-free emoji + sticker data used by the composer's
// picker and reaction tray. Curated (not exhaustive) to keep the bundle small.

export interface EmojiCategory {
  key: string;
  label: string;
  icon: string; // the emoji shown on the category tab
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    key: "smileys",
    label: "Smileys",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
      "🤐", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌",
      "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🥵", "🥶",
      "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁",
      "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥",
      "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱",
      "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "💩", "🤡", "👻",
    ],
  },
  {
    key: "gestures",
    label: "People",
    icon: "👍",
    emojis: [
      "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘",
      "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐️", "✋",
      "🖖", "👏", "🙌", "🤲", "🙏", "🤝", "💪", "🦾", "✍️", "💅",
      "👀", "🧠", "🫀", "👂", "👃", "👄", "🫂", "👶", "🧒", "🧑",
      "👨", "👩", "🧓", "👮", "🕵️", "💂", "👷", "🤴", "👸", "🥷",
    ],
  },
  {
    key: "hearts",
    label: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️",
      "💌", "💋", "🔥", "✨", "⭐", "🌟", "💫", "💥", "💯", "🎉",
    ],
  },
  {
    key: "animals",
    label: "Animals",
    icon: "🐶",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
      "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐔", "🐧",
      "🐦", "🐤", "🦆", "🦅", "🦉", "🦄", "🐝", "🦋", "🐌", "🐞",
      "🐢", "🐍", "🐙", "🦑", "🦐", "🐬", "🐳", "🐋", "🦈", "🐊",
      "🐘", "🦒", "🦓", "🐎", "🐖", "🐇", "🐕", "🦮", "🐈", "🐉",
    ],
  },
  {
    key: "food",
    label: "Food",
    icon: "🍕",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑", "🍆", "🌽",
      "🥕", "🥔", "🍠", "🥐", "🍞", "🥖", "🧀", "🥚", "🍳", "🥓",
      "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🥙", "🍜", "🍲",
      "🍛", "🍣", "🍱", "🍦", "🍩", "🍪", "🎂", "🍰", "🍫", "🍿",
      "☕", "🍵", "🧋", "🥤", "🍺", "🍻", "🥂", "🍷", "🍸", "🍹",
    ],
  },
  {
    key: "activities",
    label: "Activities",
    icon: "⚽",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓",
      "🏸", "🥅", "🏒", "🏑", "🥍", "🏏", "⛳", "🏹", "🎣", "🥊",
      "🥋", "🎽", "🛹", "🛼", "🎿", "⛷️", "🏂", "🏋️", "🤼", "🤸",
      "🎯", "🎮", "🕹️", "🎲", "🎰", "🧩", "♟️", "🎨", "🎬", "🎤",
      "🎧", "🎸", "🎹", "🥁", "🎺", "🎻", "🏆", "🥇", "🥈", "🥉",
    ],
  },
  {
    key: "travel",
    label: "Travel",
    icon: "🚀",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚚", "🚲",
      "🛵", "🏍️", "✈️", "🚀", "🛸", "🚁", "⛵", "🚤", "🛳️", "⚓",
      "🌍", "🌎", "🌏", "🗺️", "🏔️", "⛰️", "🌋", "🏕️", "🏖️", "🏜️",
      "🎡", "🎢", "🎠", "🗽", "🗼", "🏰", "🏯", "🌃", "🌆", "🌇",
      "🌈", "☀️", "🌙", "⭐", "☁️", "⛅", "🌧️", "⛈️", "❄️", "☃️",
    ],
  },
  {
    key: "symbols",
    label: "Symbols",
    icon: "💡",
    emojis: [
      "💡", "🔔", "🎵", "🎶", "💬", "💭", "🗯️", "♻️", "✅", "❌",
      "❓", "❗", "‼️", "⁉️", "⚠️", "🚫", "💤", "🆗", "🆒", "🆕",
      "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔶",
      "⌛", "⏰", "🔒", "🔑", "🔗", "📌", "📎", "✂️", "🖊️", "📚",
      "💰", "💎", "🎁", "🎈", "🎀", "🏁", "🚩", "🏳️‍🌈", "🎓", "👑",
    ],
  },
];

// Big, expressive "stickers" — sending one posts an emoji-only message that
// renders jumbo (see isEmojiOnly + MessageItem).
export const STICKERS: string[] = [
  "🎉", "🔥", "💯", "👏", "🙌", "😂", "😍", "🥳", "😎", "🤩",
  "😭", "🥺", "😴", "🤔", "🤯", "👀", "💀", "🫶", "❤️", "💔",
  "👍", "👎", "🙏", "🤝", "💪", "🚀", "🌈", "⭐", "🍕", "☕",
  "🎂", "🏆", "🎮", "📚", "🎓", "🐶", "🐱", "🦄", "👻", "🤡",
];

// Extended pictographs, plus ZWJ (200D), variation selector (FE0F) and
// skin-tone modifiers (1F3FB-1F3FF) that combine into a single displayed
// emoji, plus whitespace.
const EMOJI_ONLY_RE = new RegExp(
  "^[\\p{Extended_Pictographic}\\u200D\\uFE0F\\u{1F3FB}-\\u{1F3FF}\\s]+$",
  "u",
);

/**
 * True when a message is nothing but emoji (and whitespace) — used to render it
 * "jumbo", the way Discord enlarges emoji-only messages.
 */
export function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!EMOJI_ONLY_RE.test(trimmed)) return false;
  // Only jumbo-ify short bursts (a handful of emoji), not long emoji walls.
  const segments = [...segmenter(trimmed)].filter((s) => s.trim().length > 0);
  return segments.length > 0 && segments.length <= 8;
}

/** Count grapheme clusters when Intl.Segmenter is available, else fall back. */
function segmenter(text: string): Iterable<string> {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter })
    .Segmenter;
  if (Seg) {
    const seg = new Seg(undefined, { granularity: "grapheme" });
    return [...seg.segment(text)].map((s) => s.segment);
  }
  return [...text];
}
