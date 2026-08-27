import { useEffect, useState } from "react";

export const RESPONSIVE_PROFILE_VERSION = "v2-template-rin3-1";

const cleanDimension = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
};

function reportedFamily(userAgent, maxTouchPoints, formFactor) {
  const ua = String(userAgent || "");
  if (/iPhone/i.test(ua)) return "iphone";
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && Number(maxTouchPoints || 0) > 1 && formFactor === "tablet")) return "ipad";
  if (/Samsung|SAMSUNG-|SM-[A-Z0-9]+/i.test(ua)) return "samsung";
  if (/Android/i.test(ua)) return "android";
  return "generic";
}

export function classifyDeviceProfile({
  width,
  height,
  userAgent = "",
  maxTouchPoints = 0,
} = {}) {
  const viewportWidth = cleanDimension(width, 1280);
  const viewportHeight = cleanDimension(height, 800);
  const shortSide = Math.min(viewportWidth, viewportHeight);
  const longSide = Math.max(viewportWidth, viewportHeight);
  const aspectRatio = Number((viewportWidth / viewportHeight).toFixed(3));
  const orientation = viewportWidth === viewportHeight ? "square" : viewportWidth > viewportHeight ? "landscape" : "portrait";

  // The v2 template starts mobile-first and changes at 600/768/900 CSS px.
  // RIN3 adds aspect-ratio behaviour. Geometry therefore owns layout; the UA
  // can name a reported family, but never upgrades guessed dimensions to a brand.
  let formFactor = "desktop";
  if (shortSide < 600 && longSide <= 960) formFactor = "phone";
  else if (shortSide <= 1024 && longSide <= 1366) formFactor = "tablet";

  let sizeTier = "desktop";
  if (formFactor === "phone") {
    sizeTier = shortSide <= 360 ? "phone-compact" : shortSide <= 414 ? "phone-standard" : "phone-large";
  } else if (formFactor === "tablet") {
    sizeTier = shortSide <= 768 ? "tablet-small" : shortSide <= 900 ? "tablet-standard" : "tablet-large";
  } else if (viewportWidth >= 2000) sizeTier = "desktop-wide";

  let aspectTier = "balanced";
  if (aspectRatio <= 0.55) aspectTier = "tall";
  else if (aspectRatio < 0.9) aspectTier = "portrait";
  else if (aspectRatio <= 1.1) aspectTier = "square";
  else if (aspectRatio >= 1.7) aspectTier = "wide";
  else aspectTier = "landscape";

  const deviceFamily = reportedFamily(userAgent, maxTouchPoints, formFactor);
  return {
    profileVersion: RESPONSIVE_PROFILE_VERSION,
    viewportWidth,
    viewportHeight,
    shortSide,
    longSide,
    aspectRatio,
    aspectTier,
    orientation,
    formFactor,
    sizeTier,
    deviceFamily,
    touch: Number(maxTouchPoints || 0) > 0,
  };
}

export function readDeviceProfile(scope = typeof window !== "undefined" ? window : null) {
  if (!scope) return classifyDeviceProfile();
  const viewport = scope.visualViewport;
  return classifyDeviceProfile({
    width: viewport?.width || scope.innerWidth,
    height: viewport?.height || scope.innerHeight,
    userAgent: scope.navigator?.userAgent || "",
    maxTouchPoints: scope.navigator?.maxTouchPoints || 0,
  });
}

export function useDeviceProfile() {
  const [profile, setProfile] = useState(() => readDeviceProfile());

  useEffect(() => {
    let frame = 0;
    const assess = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setProfile(readDeviceProfile()));
    };
    assess();
    window.addEventListener("resize", assess, { passive: true });
    window.addEventListener("orientationchange", assess, { passive: true });
    window.visualViewport?.addEventListener("resize", assess, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", assess);
      window.removeEventListener("orientationchange", assess);
      window.visualViewport?.removeEventListener("resize", assess);
    };
  }, []);

  return profile;
}
