// Fits a "lost songs" mood: heat/energy, love, grief/nostalgia, and
// rock-and-roll appreciation.
export const REACTION_EMOJI = ["🔥", "❤️", "😢", "🤘"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJI)[number];
