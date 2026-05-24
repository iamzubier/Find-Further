import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompareItem = {
  slug: string;
  name: string;
  country: string;
  countryFlag?: string;
  qsRank?: number;
  logoUrl?: string;
  imageUrl?: string;
};

type CompareState = {
  items: CompareItem[];
  add: (item: CompareItem) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
};

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const items = get().items;
        if (items.some((x) => x.slug === item.slug)) return false;
        if (items.length >= 3) return false;
        set({ items: [...items, item] });
        return true;
      },
      remove: (slug) => set({ items: get().items.filter((x) => x.slug !== slug) }),
      clear: () => set({ items: [] }),
      has: (slug) => get().items.some((x) => x.slug === slug),
    }),
    {
      name: "bb-compare-v2",
      // Migrate from prior {ids:string[]} shape silently — drop it.
      version: 2,
    }
  )
);
