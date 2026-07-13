import { registerPlugin } from "@capacitor/core";
import type { RestTimerPlugin } from "./definitions";

const RestTimer = registerPlugin<RestTimerPlugin>("RestTimer", {
  web: () => import("./web").then((m) => new m.RestTimerWeb()),
});

export * from "./definitions";
export { RestTimer };
