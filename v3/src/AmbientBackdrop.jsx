// AmbientBackdrop.jsx - progressive Three.js ambient field behind the landing
// and analysis-loading screens. A slow constellation of brand-palette points
// (blues/teal with sparse amber accents - no red/green anywhere) drifting on a
// light canvas, with faint proximity lines and a gentle pointer parallax.
// PROGRESSIVE: a pure-CSS gradient wash renders immediately; `three` is then
// dynamically imported AFTER mount so the main bundle stays three-free (same
// contract as /spherical - three/gsap never load up-front on the main path).
// Honesty/a11y: decorative only (aria-hidden, pointer-events none), nothing is
// encoded in it; prefers-reduced-motion or a WebGL failure leaves the static
// wash with zero animation; rendering pauses while the tab is hidden; DPR is
// capped so low-power devices stay cool. No LLM, no number, no data.
import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (_) { return false; }
};

// mode "calm" (landing) drifts slowly; "active" (analysis running) breathes a
// little faster and brighter so the screen visibly reads as "working".
const MODES = {
  calm:   { speed: 0.45, pointOpacity: 0.50, lineOpacity: 0.14 },
  active: { speed: 1.00, pointOpacity: 0.65, lineOpacity: 0.22 },
};

export default function AmbientBackdrop({ mode = "calm" }) {
  const hostRef = useRef(null);
  const modeRef = useRef(mode);
  const [live, setLive] = useState(false);
  useEffect(() => { modeRef.current = MODES[mode] ? mode : "calm"; }, [mode]);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined; // static wash only - no three, no motion
    const host = hostRef.current;
    if (!host) return undefined;
    let disposed = false;
    let cleanup = null;

    // defer the three chunk to browser idle time - first paint never pays for it
    const whenIdle = new Promise((resolve) => {
      if (typeof requestIdleCallback === "function") requestIdleCallback(resolve, { timeout: 1500 });
      else setTimeout(resolve, 350);
    });

    whenIdle.then(() => (disposed ? null : import("three"))).then((THREE) => {
      if (!THREE) return;
      if (disposed || !hostRef.current) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      } catch (_) { return; } // no WebGL - the CSS wash stands alone
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, host.clientWidth / Math.max(1, host.clientHeight), 1, 600);
      camera.position.set(0, 0, 130);

      // points - house palette only: deep blues / teal, sparse amber accents
      const PALETTE = [0x1a56db, 0x1e40af, 0x0e7490, 0x1a56db, 0x1e40af, 0x0e7490, 0x1a56db, 0xb45309];
      const N = 110;
      const base = new Float32Array(N * 3);
      const phase = new Float32Array(N);
      const amp = new Float32Array(N);
      const positions = new Float32Array(N * 3);
      const colors = new Float32Array(N * 3);
      const tmp = new THREE.Color();
      for (let i = 0; i < N; i++) {
        base[i * 3]     = (Math.random() * 2 - 1) * 115;
        base[i * 3 + 1] = (Math.random() * 2 - 1) * 70;
        base[i * 3 + 2] = (Math.random() * 2 - 1) * 45;
        phase[i] = Math.random() * Math.PI * 2;
        amp[i] = 3 + Math.random() * 7;
        tmp.setHex(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
        colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
        positions[i * 3] = base[i * 3]; positions[i * 3 + 1] = base[i * 3 + 1]; positions[i * 3 + 2] = base[i * 3 + 2];
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const pMat = new THREE.PointsMaterial({ size: 2.6, vertexColors: true, transparent: true, opacity: MODES.calm.pointOpacity, sizeAttenuation: true, depthWrite: false });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);

      // proximity lines - preallocated buffer, rebuilt per frame (N=110 is cheap)
      const LINK_DIST = 30;
      const maxSegs = N * 6;
      const linePos = new Float32Array(maxSegs * 6);
      const lGeo = new THREE.BufferGeometry();
      const lAttr = new THREE.BufferAttribute(linePos, 3);
      lAttr.setUsage(THREE.DynamicDrawUsage);
      lGeo.setAttribute("position", lAttr);
      const lMat = new THREE.LineBasicMaterial({ color: 0x1a56db, transparent: true, opacity: MODES.calm.lineOpacity, depthWrite: false });
      const lines = new THREE.LineSegments(lGeo, lMat);
      scene.add(lines);

      // gentle pointer parallax (skipped automatically on touch - no pointermove)
      const target = { x: 0, y: 0 };
      const onPointer = (e) => {
        const w = window.innerWidth || 1, h = window.innerHeight || 1;
        target.x = (e.clientX / w - 0.5) * 10;
        target.y = -(e.clientY / h - 0.5) * 6;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const onResize = () => {
        if (!hostRef.current) return;
        const w = host.clientWidth, h = Math.max(1, host.clientHeight);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      let raf = 0;
      let hidden = document.hidden;
      const onVis = () => {
        hidden = document.hidden;
        if (!hidden && !disposed) { cancelAnimationFrame(raf); raf = requestAnimationFrame(animate); }
      };
      document.addEventListener("visibilitychange", onVis);

      const t0 = performance.now();
      function animate(now) {
        if (disposed || hidden) return;
        raf = requestAnimationFrame(animate);
        const m = MODES[modeRef.current] || MODES.calm;
        const t = ((now || performance.now()) - t0) / 1000 * m.speed;
        pMat.opacity += (m.pointOpacity - pMat.opacity) * 0.04;
        lMat.opacity += (m.lineOpacity - lMat.opacity) * 0.04;
        for (let i = 0; i < N; i++) {
          positions[i * 3]     = base[i * 3]     + Math.sin(t * 0.35 + phase[i]) * amp[i];
          positions[i * 3 + 1] = base[i * 3 + 1] + Math.cos(t * 0.28 + phase[i] * 1.3) * amp[i] * 0.8;
          positions[i * 3 + 2] = base[i * 3 + 2] + Math.sin(t * 0.22 + phase[i] * 0.7) * amp[i] * 0.5;
        }
        pGeo.attributes.position.needsUpdate = true;
        let seg = 0;
        for (let i = 0; i < N && seg < maxSegs; i++) {
          for (let j = i + 1; j < N && seg < maxSegs; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            if (dx * dx + dy * dy + dz * dz < LINK_DIST * LINK_DIST) {
              const o = seg * 6;
              linePos[o] = positions[i * 3]; linePos[o + 1] = positions[i * 3 + 1]; linePos[o + 2] = positions[i * 3 + 2];
              linePos[o + 3] = positions[j * 3]; linePos[o + 4] = positions[j * 3 + 1]; linePos[o + 5] = positions[j * 3 + 2];
              seg++;
            }
          }
        }
        lGeo.setDrawRange(0, seg * 2);
        lAttr.needsUpdate = true;
        camera.position.x += (target.x - camera.position.x) * 0.03;
        camera.position.y += (target.y - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(animate);
      setLive(true); // fades the canvas in over the CSS wash

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVis);
        pGeo.dispose(); pMat.dispose(); lGeo.dispose(); lMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    }).catch(() => { /* chunk failed to load - the CSS wash stands alone */ });

    return () => { disposed = true; if (cleanup) cleanup(); };
  }, []);

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* instant CSS wash - the progressive base layer under the canvas */}
      <div style={{ position: "absolute", inset: 0, background:
        "radial-gradient(620px 420px at 12% 8%, rgba(26,86,219,0.07), transparent 70%)," +
        "radial-gradient(560px 400px at 88% 18%, rgba(14,116,144,0.06), transparent 70%)," +
        "radial-gradient(700px 520px at 50% 100%, rgba(180,83,9,0.04), transparent 72%)" }} />
      <div ref={hostRef} style={{ position: "absolute", inset: 0, opacity: live ? 1 : 0, transition: "opacity 1.2s ease" }} />
    </div>
  );
}
