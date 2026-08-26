import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// The R3F layer is deliberately presentation-only. The accessible, clickable
// graph labels and first-order signals remain DOM controls in WorkUniverseLanding.
// This scene mirrors that state so WebGL can enrich the spatial model without
// becoming the only way to understand or operate it.
export const WU_POSITIONS = {
  1: [-3.65, 2.25, 0.05],
  2: [3.65, 2.25, 0.05],
  3: [-4.05, -1.8, 0.0],
  4: [4.05, -1.8, 0.0],
  5: [0, -3.15, 0.18],
};

const ORB_COLORS = ["#256b7a", "#465fa7", "#86652a", "#5d568f", "#3f7182"];
const CENTER = new THREE.Vector3(0, 0.2, 0.65);
const UP = new THREE.Vector3(0, 1, 0);

function Connector({ graphId, selected }) {
  const point = useMemo(() => new THREE.Vector3(...WU_POSITIONS[graphId]), [graphId]);
  const geometry = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(point, CENTER);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(point, CENTER).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
    return { length, midpoint, quaternion };
  }, [point]);

  return (
    <mesh position={geometry.midpoint} quaternion={geometry.quaternion}>
      <cylinderGeometry args={[selected ? 0.018 : 0.011, selected ? 0.018 : 0.011, geometry.length, 10]} />
      <meshBasicMaterial color={selected ? "#2c6672" : "#a8b8b7"} transparent opacity={selected ? 0.38 : 0.16} />
    </mesh>
  );
}

function Orb({ graphId, selected, reducedMotion, onSelectGraph }) {
  const ref = useRef(null);
  const position = WU_POSITIONS[graphId];
  const color = ORB_COLORS[graphId - 1];

  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = selected ? 1.18 : 1;
    const ease = reducedMotion ? 1 : Math.min(1, delta * 5.5);
    const next = THREE.MathUtils.lerp(ref.current.scale.x, target, ease);
    ref.current.scale.setScalar(next);
    if (!reducedMotion) {
      ref.current.rotation.y += delta * (selected ? 0.16 : 0.06);
      ref.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 0.7 + graphId) * (selected ? 0.09 : 0.04);
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        if (onSelectGraph) onSelectGraph(graphId);
      }}
    >
      <sphereGeometry args={[0.48, 40, 40]} />
      <meshStandardMaterial
        color={color}
        roughness={0.34}
        metalness={0.08}
        transparent
        opacity={selected ? 0.42 : 0.24}
        emissive={selected ? color : "#000000"}
        emissiveIntensity={selected ? 0.08 : 0}
      />
      <mesh scale={1.12}>
        <sphereGeometry args={[0.48, 28, 28]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={selected ? 0.05 : 0.018} wireframe />
      </mesh>
    </mesh>
  );
}

function CentreOrb({ reducedMotion }) {
  const ref = useRef(null);
  useFrame((_, delta) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y += delta * 0.05;
    ref.current.rotation.x += delta * 0.025;
  });
  return (
    <group position={CENTER} ref={ref}>
      <mesh>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshStandardMaterial color="#dce9e6" roughness={0.56} metalness={0.03} />
      </mesh>
      <mesh scale={1.07}>
        <icosahedronGeometry args={[0.62, 2]} />
        <meshBasicMaterial color="#43717a" transparent opacity={0.08} wireframe />
      </mesh>
    </group>
  );
}

function Scene({ selectedGraph, reducedMotion, onSelectGraph }) {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 7, 8]} intensity={1.25} />
      <directionalLight position={[-6, -2, 5]} intensity={0.45} />
      <CentreOrb reducedMotion={reducedMotion} />
      {[1, 2, 3, 4, 5].map((graphId) => (
        <React.Fragment key={graphId}>
          <Connector graphId={graphId} selected={selectedGraph === graphId} />
          <Orb graphId={graphId} selected={selectedGraph === graphId} reducedMotion={reducedMotion} onSelectGraph={onSelectGraph} />
        </React.Fragment>
      ))}
    </>
  );
}

export default function WorkUniverseScene({ selectedGraph, reducedMotion = false, onSelectGraph }) {
  return (
    <Canvas
      data-testid="work-universe-r3f"
      aria-hidden="true"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.1, 10.4], fov: 49, near: 0.1, far: 50 }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <Scene selectedGraph={selectedGraph} reducedMotion={reducedMotion} onSelectGraph={onSelectGraph} />
    </Canvas>
  );
}
