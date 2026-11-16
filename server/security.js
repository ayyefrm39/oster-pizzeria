import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
const scryptOptions = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("hex");
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64, scryptOptions).toString("hex")}`;
}
export function verifyPassword(password, encoded) {
  const [salt, expected] = encoded.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64, scryptOptions),
    Buffer.from(expected, "hex"),
  );
}
export function safeEqual(a, b) {
  return (
    typeof a === "string" &&
    typeof b === "string" &&
    timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)))
  );
}
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const requireThat = (condition, message, status = 400) => {
  if (!condition) throw new ApiError(status, message);
};
