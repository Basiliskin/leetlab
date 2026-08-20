// Top-level grouping for the Sidebar filter. Mirrors the decoupled sub-banks
// in src/infrastructure/problemBanks/, plus a 'Generated' bucket for problems
// accepted via the LLM review gate. Add to the tuple (and tag the matching
// sub-bank in problemBanks/index.ts) when a new category is introduced.
export const CATEGORIES = [
  "Classic",
  "Async",
  "Generators",
  "React",
  "Streaming",
  "Design System",
  "Generated",
  "Backpressure",
  "Events",
  "Job Queue",
  "Promises",
  "Advanced Promises",
  "Advanced Events",
  "Advanced Queues",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const GENERATED_CATEGORY: Category = "Generated";

export type CategoryFilter = "All" | Category;

export const isCategory = (value: string): value is Category =>
  (CATEGORIES as readonly string[]).includes(value);
