'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Cubelet: single 3x3x3 cell ── */
function Cubelet({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const size = 0.58;
  const gap = 0.68;
  const geo = useMemo(() => new THREE.BoxGeometry(size, size, size, 1, 1, 1), []);

  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#88ccff', metalness: 0.05, roughness: 0.12,
    transparent: true, opacity: 0.22, envMapIntensity: 0.3,
    clearcoat: 0.4, clearcoatRoughness: 0.1,
  }), []);

  const coreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2266cc', emissive: '#1133aa', emissiveIntensity: 0.5,
    metalness: 0.1, roughness: 0.25, transparent: true, opacity: 0.45,
  }), []);

  return (
    <group position={[position[0] * gap, position[1] * gap, position[2] * gap]}>
      {/* Outer glow */}
      <mesh geometry={geo} scale={1.15}>
        <meshBasicMaterial color="#4499ff" transparent opacity={0.05} depthWrite={false} />
      </mesh>
      {/* Crystal shell */}
      <mesh ref={meshRef} geometry={geo}>
        <primitive object={glassMat} attach="material" />
      </mesh>
      {/* Inner core */}
      <mesh geometry={geo} scale={0.7}>
        <primitive object={coreMat} attach="material" />
      </mesh>
      {/* Edge glow */}
      <lineSegments geometry={new THREE.EdgesGeometry(geo)}>
        <lineBasicMaterial color="#6ab4ff" transparent opacity={0.8} />
      </lineSegments>
      <lineSegments geometry={new THREE.EdgesGeometry(geo)} scale={1.03}>
        <lineBasicMaterial color="#aad4ff" transparent opacity={0.25} />
      </lineSegments>
    </group>
  );
}

/* ── 3x3x3 Crystal Cube ── */
function CrystalCube() {
  const groupRef = useRef<THREE.Group>(null);

  const positions = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++)
          p.push([x, y, z]);
    return p;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.2;
      groupRef.current.rotation.z = Math.cos(t * 0.35) * 0.15;
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <Cubelet key={i} position={p} />
      ))}
    </group>
  );
}

/* ── Orbiting particles ── */
function Particles() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    const pts: { pos: THREE.Vector3; speed: number; offset: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 2.8 + Math.random() * 1.2;
      pts.push({
        pos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)),
        speed: 0.3 + Math.random() * 0.7,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        const r = 2.8 + Math.sin(t * p.speed + p.offset) * 0.6;
        const theta = t * 0.3 + p.offset;
        child.position.set(r * Math.cos(theta) * Math.cos(p.offset), r * Math.sin(theta * 0.7), r * Math.cos(theta) * Math.sin(p.offset));
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#88ccff' : '#4499ff'} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Scene ── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#4488ff" />
      <pointLight position={[-3, -2, -4]} intensity={1} color="#2266cc" />
      <pointLight position={[0, -3, 2]} intensity={1.5} color="#6699ff" />
      <CrystalCube />
      <Particles />
    </>
  );
}

/* ── Export ── */
export default function HeroCube() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 40 }} gl={{ antialias: true, alpha: true }} style={{ background: 'transparent' }}>
      <Scene />
    </Canvas>
  );
}
