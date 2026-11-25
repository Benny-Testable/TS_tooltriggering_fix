import { cycleAName } from "./cycle-a";

export function cycleBName(): string {
  return "cycle-b<" + cycleAName;
}
