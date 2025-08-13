// lib/demo-store.ts
export type DemoStage = 0 | 1 | 2;
// 0 = no request yet (draft stage)
// 1 = submitted / under review
// 2 = approved

// HMR-safe singleton store
let stage: DemoStage = 0;
let signatory = { name: "", title: "" };

export const DemoStore = {
  get: () => ({ stage, signatory }),

  setStage: (s: DemoStage) => {
    stage = s;
  },

  setSignatory: (name: string, title: string) => {
    signatory = { name, title };
  },

  reset: () => {
    stage = 0;
    signatory = { name: "", title: "" };
  },
};
