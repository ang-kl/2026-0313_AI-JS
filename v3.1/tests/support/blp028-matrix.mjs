export const BLP028_VIEWPORTS = Object.freeze([
  Object.freeze({ name: "desktop-1440x1000", width: 1440, height: 1000, phone: false }),
  Object.freeze({ name: "desktop-2048x1280", width: 2048, height: 1280, phone: false }),
  Object.freeze({ name: "phone-390x844", width: 390, height: 844, phone: true }),
  Object.freeze({ name: "phone-430x932", width: 430, height: 932, phone: true }),
]);

export const BLP028_STATES = Object.freeze(["positive", "empty", "withheld", "error", "stale"]);

export async function assertMatrixSurface(locator, label) {
  await locator.waitFor({ state: "visible", timeout: 15000 });
  await locator.scrollIntoViewIfNeeded();
  const geometry = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const left = Math.max(0, rect.left);
    const right = Math.min(window.innerWidth, rect.right);
    const top = Math.max(0, rect.top);
    const bottom = Math.min(window.innerHeight, rect.bottom);
    const points = [
      [(left + right) / 2, (top + bottom) / 2],
      [left + Math.min(12, Math.max(1, (right - left) / 4)), top + Math.min(12, Math.max(1, (bottom - top) / 4))],
    ];
    const reachable = points.some(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return hit === element || (hit && element.contains(hit));
    });
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
      visibleWidth: right - left,
      visibleHeight: bottom - top,
      horizontalOverflow: Math.max(0, element.scrollWidth - element.clientWidth),
      visibility: style.visibility,
      display: style.display,
      pointerEvents: style.pointerEvents,
      reachable,
    };
  });
  const r = geometry.rect;
  if (r.width <= 0 || r.height <= 0 || geometry.visibleWidth <= 0 || geometry.visibleHeight <= 0) throw new Error(`${label}: surface has no reachable visible area: ${JSON.stringify(geometry)}`);
  if (r.left < -1 || r.right > geometry.viewport.width + 1) throw new Error(`${label}: surface clips horizontally: ${JSON.stringify(geometry)}`);
  if (geometry.visibility === "hidden" || geometry.display === "none" || geometry.pointerEvents === "none" || !geometry.reachable) throw new Error(`${label}: surface is hidden or obstructed: ${JSON.stringify(geometry)}`);
  if (geometry.horizontalOverflow > 1) throw new Error(`${label}: surface owns unresolved horizontal overflow: ${JSON.stringify(geometry)}`);
  return geometry;
}
