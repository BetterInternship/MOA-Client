// lib/demo-realtime.ts
type Event = { type: "stage"; value: 0 | 1 | 2 };
const chan = typeof window !== "undefined" ? new BroadcastChannel("moa-demo") : null;

export const DemoRT = {
  sendStage(s: 0 | 1 | 2) {
    chan?.postMessage({ type: "stage", value: s } satisfies Event);
  },
  onStage(cb: (s: 0 | 1 | 2) => void) {
    chan?.addEventListener("message", (ev) => {
      if (ev.data?.type === "stage") cb(ev.data.value);
    });
  },
};
