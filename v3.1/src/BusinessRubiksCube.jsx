import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildBusinessCubeModel } from "./businessCubeModel.js";
import "./BusinessRubiksCube.css";

const ALLOCATION_COLOURS = {
  "human-held": "#2463a8",
  "augmentation-review": "#0f8b80",
  "agent-candidate": "#d97706",
};

function cellLabel(cell) {
  return `${cell.function.label} / ${cell.workLayer.label} / ${cell.allocation.label}`;
}

export default function BusinessRubiksCube({ agentModel, sectorEvidence }) {
  const model = useMemo(() => buildBusinessCubeModel(agentModel, sectorEvidence), [agentModel, sectorEvidence]);
  const firstEvidenced = model.cells.find((cell) => cell.count > 0) || model.cells[0];
  const [selectedId, setSelectedId] = useState(firstEvidenced ? firstEvidenced.id : "");
  const [exploded, setExploded] = useState(false);
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const selectedIdRef = useRef(firstEvidenced ? firstEvidenced.id : "");
  const explodedRef = useRef(false);
  const selected = model.cells.find((cell) => cell.id === selectedId) || firstEvidenced;

  const selectCell = useCallback((nextId) => {
    selectedIdRef.current = nextId;
    setSelectedId(nextId);
    apiRef.current?.select(nextId);
  }, []);

  const setCubeExploded = useCallback((next) => {
    explodedRef.current = next;
    setExploded(next);
    apiRef.current?.explode(next);
  }, []);

  useEffect(() => {
    if (!model.cells.some((cell) => cell.id === selectedId)) {
      selectCell(firstEvidenced ? firstEvidenced.id : "");
    }
  }, [model, selectedId, firstEvidenced, selectCell]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    if (mountRef.current) mountRef.current.dataset.ready = "false";
    Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ]).then(([THREE, controlsModule]) => {
      if (disposed || !mountRef.current) return;
      const host = mountRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#e9eef4");
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(6.7, 5.4, 7.8);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.replaceChildren(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      scene.add(new THREE.HemisphereLight(0xffffff, 0x718096, 2.2));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
      keyLight.position.set(4, 7, 5);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const group = new THREE.Group();
      scene.add(group);
      const cellMeshes = [];
      const geometry = new THREE.BoxGeometry(0.88, 0.88, 0.88);
      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      model.cells.forEach((cell) => {
        const occupied = cell.count > 0;
        const material = new THREE.MeshStandardMaterial({
          color: occupied ? ALLOCATION_COLOURS[cell.allocation.id] : "#bdc8d4",
          transparent: !occupied,
          opacity: occupied ? 0.9 : 0.16,
          roughness: 0.54,
          metalness: 0.03,
          emissive: occupied ? "#07111f" : "#000000",
          emissiveIntensity: occupied ? 0.1 : 0,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = occupied;
        mesh.receiveShadow = true;
        mesh.userData.cellId = cell.id;
        const base = new THREE.Vector3((cell.x - 1) * 1.04, (1 - cell.y) * 1.04, (cell.z - 1) * 1.04);
        mesh.userData.basePosition = base;
        mesh.position.copy(base);
        group.add(mesh);
        const edge = new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({ color: occupied ? "#f8fafc" : "#7f8d9d", transparent: true, opacity: occupied ? 0.7 : 0.34 }));
        edge.userData.cellId = cell.id;
        mesh.add(edge);
        cellMeshes.push(mesh);
      });

      function applySelection(nextId) {
        cellMeshes.forEach((mesh) => {
          const isSelected = mesh.userData.cellId === nextId;
          const occupied = model.cells.find((cell) => cell.id === mesh.userData.cellId)?.count > 0;
          const edge = mesh.children[0];
          mesh.scale.setScalar(isSelected ? 1.09 : 1);
          mesh.material.opacity = isSelected ? (occupied ? 1 : 0.42) : occupied ? 0.82 : 0.14;
          mesh.material.transparent = !isSelected || !occupied;
          mesh.material.emissive.set(isSelected ? "#ffffff" : occupied ? "#07111f" : "#000000");
          mesh.material.emissiveIntensity = isSelected ? 0.28 : occupied ? 0.1 : 0;
          if (edge?.material) {
            edge.material.color.set(isSelected ? "#0b1f44" : occupied ? "#f8fafc" : "#7f8d9d");
            edge.material.opacity = isSelected ? 1 : occupied ? 0.7 : 0.3;
          }
        });
        host.dataset.selectedCell = nextId || "";
      }

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 24, 16),
        new THREE.MeshStandardMaterial({ color: model.sector.status === "exact" ? "#f4c542" : "#6b7280", emissive: "#8a6500", emissiveIntensity: 0.35 }),
      );
      core.userData.sectorCore = true;
      group.add(core);

      const controls = new controlsModule.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.dampingFactor = 0.08;
      controls.enablePan = true;
      controls.minDistance = 5;
      controls.maxDistance = 15;
      controls.target.set(0, 0, 0);
      controls.update();

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDown = null;
      let frame = 0;
      let cameraRevision = 0;
      const markRevision = () => {
        cameraRevision += 1;
        host.dataset.cameraRevision = String(cameraRevision);
      };
      controls.addEventListener("change", markRevision);

      function resize() {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function chooseCell(event) {
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(cellMeshes, false)[0];
        if (hit && hit.object.userData.cellId) selectCell(hit.object.userData.cellId);
      }

      function onPointerDown(event) {
        pointerDown = { x: event.clientX, y: event.clientY };
      }
      function onPointerUp(event) {
        if (!pointerDown) return;
        if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) < 5) chooseCell(event);
        pointerDown = null;
      }

      function setView(position) {
        camera.position.set(position[0], position[1], position[2]);
        controls.target.set(0, 0, 0);
        controls.update();
        markRevision();
      }

      function setExplode(next) {
        cellMeshes.forEach((mesh) => {
          const base = mesh.userData.basePosition;
          mesh.position.copy(base).multiplyScalar(next ? 1.34 : 1);
        });
        host.dataset.exploded = String(next);
      }

      function rotateBy(dx, dy) {
        group.rotation.y += dx;
        group.rotation.x = Math.max(-1.15, Math.min(1.15, group.rotation.x + dy));
        markRevision();
      }

      host.dataset.renderedCells = String(cellMeshes.length);
      host.dataset.cameraRevision = "0";
      host.dataset.exploded = "false";
      apiRef.current = {
        front: () => setView([0, 0, 9]),
        right: () => setView([9, 0, 0]),
        top: () => setView([0, 9, 0.01]),
        reset: () => { group.rotation.set(0, 0, 0); setView([6.7, 5.4, 7.8]); },
        explode: setExplode,
        rotateBy,
        zoom: (factor) => { camera.position.multiplyScalar(factor); controls.update(); markRevision(); },
        select: applySelection,
      };
      applySelection(selectedIdRef.current);
      setExplode(explodedRef.current);
      host.dataset.ready = "true";

      function render() {
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      }

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      resize();
      render();

      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        controls.removeEventListener("change", markRevision);
        controls.dispose();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        geometry.dispose();
        edgeGeometry.dispose();
        scene.traverse((object) => {
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
          }
          if (object.geometry && object.geometry !== geometry && object.geometry !== edgeGeometry) object.geometry.dispose();
        });
        renderer.dispose();
        if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
        apiRef.current = null;
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [model, selectCell]);

  useEffect(() => {
    explodedRef.current = exploded;
    apiRef.current?.explode(exploded);
  }, [exploded]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    apiRef.current?.select(selectedId);
  }, [selectedId]);

  function onKeyDown(event) {
    const actions = {
      ArrowLeft: () => apiRef.current?.rotateBy(-0.14, 0),
      ArrowRight: () => apiRef.current?.rotateBy(0.14, 0),
      ArrowUp: () => apiRef.current?.rotateBy(0, -0.14),
      ArrowDown: () => apiRef.current?.rotateBy(0, 0.14),
      "+": () => apiRef.current?.zoom(0.9),
      "=": () => apiRef.current?.zoom(0.9),
      "-": () => apiRef.current?.zoom(1.1),
      "0": () => apiRef.current?.reset(),
    };
    if (actions[event.key]) {
      event.preventDefault();
      actions[event.key]();
    }
  }

  return (
    <section className="business-cube" data-testid="business-rubiks-cube" aria-labelledby="business-cube-title">
      <header className="business-cube__head">
        <div>
          <div className="business-cube__eyebrow">Sector core</div>
          <h3 className="business-cube__title" id="business-cube-title">
            {model.sector.label}{model.sector.code ? ` (${model.sector.code})` : ""}
          </h3>
          <p className="business-cube__source">{model.sector.source}</p>
        </div>
        <div className="business-cube__status">
          {model.totals.evidencedCells} evidenced cells<br />
          {model.totals.clusters} duty clusters / {model.totals.agents} candidates
        </div>
      </header>
      <div className="business-cube__body">
        <div className="business-cube__stage">
          <div className="business-cube__axes">
            <div className="business-cube__axis"><strong>Function</strong><br />{model.axes.functions.map((item) => item.label).join(" / ")}</div>
            <div className="business-cube__axis"><strong>Work layer</strong><br />Execute / Coordinate / Govern</div>
            <div className="business-cube__axis"><strong>Allocation</strong><br />Human / Review / Candidate</div>
          </div>
          <div className="business-cube__toolbar" aria-label="Business cube controls">
            <button type="button" onClick={() => apiRef.current?.front()} title="Front face">Front</button>
            <button type="button" onClick={() => apiRef.current?.right()} title="Right face">Right</button>
            <button type="button" onClick={() => apiRef.current?.top()} title="Top face">Top</button>
            <button type="button" onClick={() => setCubeExploded(!explodedRef.current)} aria-pressed={exploded}>{exploded ? "Assemble" : "Explode"}</button>
            <button type="button" onClick={() => { setCubeExploded(false); apiRef.current?.reset(); }}>Reset</button>
          </div>
          {selected && (
            <div className="business-cube__selection-strip" data-testid="business-cube-selection" aria-live="polite">
              <span className="business-cube__axis-title">Selected cell</span>
              <strong>{cellLabel(selected)}</strong>
              <span>{selected.count ? `${selected.count} duty cluster${selected.count === 1 ? "" : "s"}` : "Evidence withheld"}</span>
            </div>
          )}
          <div
            ref={mountRef}
            className="business-cube__canvas"
            data-testid="business-cube-canvas"
            data-ready="false"
            role="application"
            tabIndex={0}
            aria-label={`Interactive business cube. Selected cell: ${selected ? cellLabel(selected) : "none"}. Arrow keys rotate; plus and minus zoom; zero resets.`}
            onKeyDown={onKeyDown}
          />
        </div>
        <aside className="business-cube__inspect">
          <div className="business-cube__axis-title">Cell evidence</div>
          {selected && (
            <>
              <h4 className="business-cube__selection">{cellLabel(selected)}</h4>
              <p className="business-cube__selection-meta">
                {selected.count ? `${selected.count} duty cluster${selected.count === 1 ? "" : "s"}` : "No supplied evidence in this cell"}
              </p>
              {selected.clusters.length > 0 && (
                <ul className="business-cube__duty-list">
                  {selected.clusters.slice(0, 8).map((cluster) => (
                    <li key={cluster.id}>
                      <p className="business-cube__duty">{cluster.repDuty}</p>
                      <p className="business-cube__provenance">
                        {cluster.recurrence} posting{cluster.recurrence === 1 ? "" : "s"} / {cluster.level} / {cluster.provenance.length} provenance row{cluster.provenance.length === 1 ? "" : "s"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <div className="business-cube__axis-title">Evidence matrix</div>
          <div className="business-cube__matrix">
            {model.cells.map((cell) => {
              const withheld = cell.status === "withheld";
              return (
                <button
                  type="button"
                  key={cell.id}
                  className={`business-cube__cell-button ${withheld ? "is-withheld" : "is-evidenced"}`}
                  data-cell-id={cell.id}
                  data-evidence-status={cell.status}
                  aria-pressed={selected?.id === cell.id}
                  aria-label={`${cellLabel(cell)}. ${withheld ? "Evidence withheld" : `${cell.count} duty cluster${cell.count === 1 ? "" : "s"}`}.`}
                  onClick={() => selectCell(cell.id)}
                >
                  <span className="business-cube__swatch" style={{ background: withheld ? "#c3ccd6" : ALLOCATION_COLOURS[cell.allocation.id] }} />
                  <span>{cellLabel(cell)}</span>
                  <span className="business-cube__count">{withheld ? "withheld" : cell.count}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
