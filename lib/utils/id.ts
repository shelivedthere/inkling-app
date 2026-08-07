import { nanoid } from "nanoid";

export function createId() {
  return nanoid(10);
}
