import { cycleBName } from "./cycle-b";

export const cycleAName = "cycle-a";

export function describeCycleA(): string {
  return cycleAName + ">" + cycleBName();
}
