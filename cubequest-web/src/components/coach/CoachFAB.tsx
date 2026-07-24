'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';

/** AI 核心：流动光电线框球 */
function EnergyOrb() {
  const groupRef = useRef<THREE.Group>(null);
  const wireRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Geodesic wireframe
  const geo = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.45, 2);
    return ico;
  }, []);

  // Glowing dots on vertices
  const dots = useMemo(() => {
    const pos = geo.attributes.position;
    const arr: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      arr.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    return new Float32Array(arr);
  }, [geo]);

  // Orbiting particles
  const orbitParticles = useMemo(() => {
    const count = 80;
    const arr = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 0.2;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
      // Cyan to purple gradient
      const t = Math.random();
      colors[i * 3] = 0.22 + t * 0.45;       // R: 0.22→0.67
      colors[i * 3 + 1] = 0.74 - t * 0.3;     // G: 0.74→0.44
      colors[i * 3 + 2] = 0.96 - t * 0.3;     // B: 0.96→0.66
    }
    return { positions: arr, colors };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
    if (wireRef.current) {
      // Pulse wireframe
      const mat = wireRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 2) * 0.1;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.15;
      particlesRef.current.rotation.z = t * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Geodesic wireframe */}
      <lineSegments ref={wireRef}>
        <edgesGeometry args={[geo, 30]} />
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.3} linewidth={1} />
      </lineSegments>

      {/* Vertex glow dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dots, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#a78bfa" size={0.035} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </points>

      {/* Orbiting energy particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbitParticles.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[orbitParticles.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} vertexColors transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* Energy rings */}
      {[0, 1, 2].map(i => (
        <mesh key={i} rotation={[Math.PI / 2, i * Math.PI / 3, 0]}>
          <torusGeometry args={[0.55, 0.008, 8, 32]} />
          <meshBasicMaterial color={i === 0 ? '#38bdf8' : i === 1 ? '#a78bfa' : '#f472b6'} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** 流光尾迹环 */
function FlowRings() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.2;
      ref.current.rotation.z = state.clock.elapsedTime * 0.35;
    }
  });
  return (
    <group ref={ref}>
      {[0.62, 0.68, 0.74].map((r, i) => (
        <mesh key={i} rotation={[0, i * 0.7, 0]}>
          <torusGeometry args={[r, 0.003, 4, 48, Math.PI * 1.2]} />
          <meshBasicMaterial color={i === 0 ? '#38bdf8' : '#a78bfa'} transparent opacity={0.5 - i * 0.12} />
        </mesh>
      ))}
    </group>
  );
}

export default function CoachFAB() {
  return (
    <Link href="/coach" className="fixed bottom-8 right-8 z-50 group" style={{ width: 96, height: 96 }}>
      {/* Outer glow */}
      <div className="absolute -inset-3 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)',
          animation: 'heroFloat 3s ease-in-out infinite',
        }} />
      {/* Label */}
      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        ⚡ AI 私教
      </span>

      <div className="relative w-full h-full rounded-full overflow-hidden border border-cyan-400/20 bg-[#020617]/80 backdrop-blur-md"
        style={{ boxShadow: '0 0 40px rgba(56,189,248,0.15), 0 0 80px rgba(168,123,250,0.08), inset 0 0 20px rgba(56,189,248,0.05)' }}>
        <Canvas camera={{ position: [0, 0.05, 1.8], fov: 50 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.4} />
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.15}>
            <EnergyOrb />
          </Float>
          <FlowRings />
        </Canvas>
      </div>
    </Link>
  );
}
