import assert from "node:assert/strict";
import { classifyDeviceProfile, RESPONSIVE_PROFILE_VERSION } from "../src/responsive/deviceProfile.js";

const cases = [
  {
    name: "iPhone SE portrait",
    input: { width: 375, height: 667, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", maxTouchPoints: 5 },
    expected: { formFactor: "phone", sizeTier: "phone-standard", orientation: "portrait", deviceFamily: "iphone", aspectTier: "portrait" },
  },
  {
    name: "iPhone Pro Max portrait",
    input: { width: 430, height: 932, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", maxTouchPoints: 5 },
    expected: { formFactor: "phone", sizeTier: "phone-large", orientation: "portrait", deviceFamily: "iphone", aspectTier: "tall" },
  },
  {
    name: "Samsung compact portrait",
    input: { width: 360, height: 780, userAgent: "Mozilla/5.0 (Linux; Android 15; SM-S911B) AppleWebKit/537.36 SamsungBrowser/28.0", maxTouchPoints: 5 },
    expected: { formFactor: "phone", sizeTier: "phone-compact", orientation: "portrait", deviceFamily: "samsung", aspectTier: "tall" },
  },
  {
    name: "iPad mini portrait",
    input: { width: 768, height: 1024, userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", maxTouchPoints: 5 },
    expected: { formFactor: "tablet", sizeTier: "tablet-small", orientation: "portrait", deviceFamily: "ipad", aspectTier: "portrait" },
  },
  {
    name: "iPad Pro landscape",
    input: { width: 1366, height: 1024, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Mobile/15E148", maxTouchPoints: 5 },
    expected: { formFactor: "tablet", sizeTier: "tablet-large", orientation: "landscape", deviceFamily: "ipad", aspectTier: "landscape" },
  },
  {
    name: "MacBook desktop",
    input: { width: 2048, height: 1280, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", maxTouchPoints: 0 },
    expected: { formFactor: "desktop", sizeTier: "desktop-wide", orientation: "landscape", deviceFamily: "generic", aspectTier: "landscape" },
  },
];

for (const item of cases) {
  const actual = classifyDeviceProfile(item.input);
  assert.equal(actual.profileVersion, RESPONSIVE_PROFILE_VERSION, `${item.name}: profile version`);
  for (const [key, expected] of Object.entries(item.expected)) assert.equal(actual[key], expected, `${item.name}: ${key}`);
}

const unknownBrand = classifyDeviceProfile({ width: 390, height: 844, userAgent: "Mozilla/5.0", maxTouchPoints: 5 });
assert.equal(unknownBrand.formFactor, "phone");
assert.equal(unknownBrand.deviceFamily, "generic", "Phone geometry must not be guessed as iPhone or Samsung");

console.log("Responsive device preflight contract: PASS");
