import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompareState = {
  ids: string[];
  add: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (id) => {
        const ids = get().ids;
        if (ids.includes(id)) return false;
        if (ids.length >= 3) return false;
        set({ ids: [...ids, id] });
        return true;
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
      has: (id) => get().ids.includes(id),
    }),
    { name: "bb-compare" }
  )
);
