'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useState, useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { generateScramble, parseMoves } from '@/lib/scramble';

const COLORS: Record<string, string> = {
  U: '#FFFFFF', D: '#FFD500', F: '#009B48', B: '#0046AD', R: '#C41E3A', L: '#FF8C00',
};

/** Move definition: axis + which layer and direction */
function moveDef(m: string): { axis: 'x'|'y'|'z'; dir: 1|-1; layer: number } | null {
  const map: Record<string,[number,number,number]>={
    U:[0,1,1],D:[0,1,-1],R:[1,1,1],L:[1,1,-1],F:[2,1,1],B:[2,1,-1],
    M:[0,0,-1],E:[0,0,-1],S:[2,0,1],  // M=x-axis, E=y-axis, S=z-axis
  };
  // Wide moves have layer=0 for the second layer - we check differently
  const v = map[m[0]]; if(!v)return null;
  const mod=m.slice(1); let dir=(v[2]||1)as 1|-1;
  if(mod==="'") dir=-dir as 1|-1;
  const axis: 'x'|'y'|'z' = v[0]===0?'y':v[0]===1?'x':'z';
  return {axis,dir,layer:v[1]};
}

/** Check if a cubie at coord is affected by a move */
function inLayer(move: string, coord: number): boolean {
  const base=move[0];
  // Wide moves and whole-cube rotations: affect both layer 0 and layer 1/-1
  if('rludfbxyz'.includes(base)) return coord===0||coord===1||coord===-1;
  // M/E/S slice moves: only layer 0
  if('MES'.includes(base)) return coord===0;
  // Standard face moves
  const single: Record<string,number>={R:1,L:-1,U:1,D:-1,F:1,B:-1};
  return coord===(single[base]??1);
}

function inverseMove(m:string):string{if(m.endsWith('2'))return m;if(m.endsWith("'"))return m[0];return m+"'"}
function invSeq(ms:string[]):string[]{return[...ms].reverse().map(inverseMove)}

// ── Cubie data: each cubie has an id, initial position, and face colors ──
interface CubieDef {
  id: string;
  pos: [number,number,number];
  colors: { face: 'U'|'D'|'F'|'B'|'R'|'L'; color: string }[];
}

function makeCubies(): CubieDef[] {
  const all: CubieDef[] = [];
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
    if(x===0&&y===0&&z===0)continue;
    const f: CubieDef['colors']=[];
    if(y===1)f.push({face:'U',color:COLORS.U});
    if(y===-1)f.push({face:'D',color:COLORS.D});
    if(z===1)f.push({face:'F',color:COLORS.F});
    if(z===-1)f.push({face:'B',color:COLORS.B});
    if(x===1)f.push({face:'R',color:COLORS.R});
    if(x===-1)f.push({face:'L',color:COLORS.L});
    all.push({id:`${x},${y},${z}`,pos:[x,y,z],colors:f});
  }
  return all;
}

// ── Compute rotation matrix for a move ──
function rotMatrix(axis:'x'|'y'|'z', angle:number): THREE.Matrix4 {
  const m=new THREE.Matrix4();
  const q=new THREE.Quaternion();
  const v=new THREE.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0);
  q.setFromAxisAngle(v,angle);
  m.makeRotationFromQuaternion(q);
  return m;
}

// ── Apply move to array of position + quaternion ──
function applyMoveCube(
  pieces: { pos: THREE.Vector3; quat: THREE.Quaternion }[],
  move: string
): void {
  const def = moveDef(move); if(!def)return;
  const {axis,dir} = def;
  const times = move.endsWith('2')?2:1;
  const angle = dir * Math.PI/2;
  const mat = rotMatrix(axis, angle);
  const q = new THREE.Quaternion().setFromRotationMatrix(mat);
  
  for(let t=0;t<times;t++){
    for(const p of pieces){
      const v = axis==='x'?p.pos.x:axis==='y'?p.pos.y:p.pos.z;
      if(!inLayer(move, Math.round(v))) continue;
      p.pos.applyMatrix4(mat);
      p.pos.round();
      p.quat.premultiply(q);
    }
  }
}

// ── 3D Cubie mesh ──
function CubieMesh({ def, pos, quat }: { def: CubieDef; pos: THREE.Vector3; quat: THREE.Quaternion }){
  const ref = useRef<THREE.Group>(null!);
  useEffect(()=>{
    if(ref.current){
      ref.current.position.copy(pos);
      ref.current.quaternion.copy(quat);
    }
  });
  useFrame(()=>{
    // no-op, just to trigger render
  });
  return (
    <group ref={ref}>
      <mesh><boxGeometry args={[0.9,0.9,0.9]}/><meshStandardMaterial color="#111"/></mesh>
      {def.colors.map((f,i)=>{
        const fpos: Record<string,[number,number,number]>={
          U:[0,.51,0],D:[0,-.51,0],F:[0,0,.51],B:[0,0,-.51],R:[.51,0,0],L:[-.51,0,0]
        };
        const frot: Record<string,[number,number,number]>={
          U:[-Math.PI/2,0,0],D:[Math.PI/2,0,0],F:[0,0,0],B:[0,Math.PI,0],R:[0,Math.PI/2,0],L:[0,-Math.PI/2,0]
        };
        return <mesh key={i} position={fpos[f.face]} rotation={frot[f.face]}>
          <planeGeometry args={[.85,.85]}/>
          <meshStandardMaterial color={f.color} roughness={.15} metalness={0} side={THREE.FrontSide}/>
        </mesh>;
      })}
    </group>
  );
}

// ── Main component ──
interface Cube3DProps { moves?: string; speed?: 0.5|1|2; showControls?: boolean; autoPlay?: boolean; }

export default function Cube3D({ moves='', speed=1, showControls=true, autoPlay=false }: Cube3DProps){
  const [inputMoves, setInputMoves] = useState(moves);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(speed);
  const [allMoves, setAllMoves] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [solution, setSolution] = useState('');
  const [showSol, setShowSol] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  
  const defs = useMemo(()=>makeCubies(),[]);
  const [pieces, setPieces] = useState(()=>{
    return defs.map(d=>({def:d,pos:new THREE.Vector3(...d.pos),quat:new THREE.Quaternion()}));
  });
  
  const resetPieces = ()=>setPieces(defs.map(d=>({def:d,pos:new THREE.Vector3(...d.pos),quat:new THREE.Quaternion()})));
  
  const playMoves = (movesList: string[], fromScrambled=false)=>{
    if(!movesList.length)return;
    setAllMoves(movesList);setIsPlaying(true);if(!fromScrambled)setShowSol(false);
    let step=0;
    let pcs=defs.map(d=>({def:d,pos:new THREE.Vector3(...d.pos),quat:new THREE.Quaternion()}));
    // If playing solution, first apply ORIGINAL scramble to reach scrambled state
    if(fromScrambled){
      const sm=parseMoves(inputMoves);
      for(const m of sm)applyMoveCube(pcs,m);
    }
    setPieces([...pcs]);setCurrentStep(0);
    if(timerRef.current)clearInterval(timerRef.current);
    timerRef.current=setInterval(()=>{
      if(step>=movesList.length){if(timerRef.current)clearInterval(timerRef.current);setIsPlaying(false);return;}
      applyMoveCube(pcs,movesList[step]);
      setPieces([...pcs]);setCurrentStep(step);step++;
    },350/playSpeed);
  };
  
  const handlePlay=()=>playMoves(parseMoves(inputMoves));
  const handlePause=()=>{if(timerRef.current)clearInterval(timerRef.current);setIsPlaying(false);};
  const handleReset=()=>{if(timerRef.current)clearInterval(timerRef.current);setIsPlaying(false);setCurrentStep(0);resetPieces();setShowSol(false);};
  const handleScramble=()=>{
    const s=generateScramble(20);setInputMoves(s);resetPieces();setIsPlaying(false);setShowSol(false);
  };
  const handleSolve=()=>{
    const movesList=parseMoves(inputMoves);if(!movesList.length)return;
    const inv=invSeq(movesList);setSolution(inv.join(' '));setShowSol(true);
    playMoves(inv,true);
  };
  
  useEffect(()=>{return()=>{if(timerRef.current)clearInterval(timerRef.current)};},[]);
  // Auto-play on mount when moves provided
  useEffect(()=>{if(autoPlay&&moves)playMoves(parseMoves(moves));},[autoPlay,moves]);
  
  const meshes=useMemo(()=>pieces.map((p,i)=><CubieMesh key={i} def={p.def} pos={p.pos} quat={p.quat}/>), [pieces]);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full aspect-square max-w-md mx-auto bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <Canvas camera={{position:[4,3,5],fov:45}}>
          <ambientLight intensity={0.5}/>
          <directionalLight position={[5,5,5]} intensity={0.8}/>
          <group>{meshes}</group>
          <OrbitControls enableDamping dampingFactor={0.1}/>
        </Canvas>
      </div>
      {showControls&&(
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={inputMoves} onChange={e=>setInputMoves(e.target.value)}
              placeholder="U R U' R' 等 WCA 标准标记..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"/>
            <button onClick={handleScramble} className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border text-sm">🔀 打乱</button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={isPlaying?handlePause:handlePlay} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] text-sm font-semibold">{isPlaying?'⏸️ 暂停':'▶️ 播放'}</button>
            <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-[var(--color-surface)] border text-sm">🔄 重置</button>
            <button onClick={handleSolve} className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-semibold hover:bg-yellow-500/30">🧩 自动还原</button>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-[var(--color-muted)]">速度:</span>
              {[0.5,1,2].map(s=><button key={s} onClick={()=>setPlaySpeed(s as 0.5|1|2)} className={`px-2 py-1 rounded text-xs ${playSpeed===s?'bg-[var(--color-primary)]/20 text-[var(--color-primary)]':'text-[var(--color-muted)]'}`}>{s}x</button>)}
            </div>
          </div>
          {showSol&&solution&&(
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
              <span className="text-xs font-bold text-yellow-400">🧩 还原公式 ({allMoves.length} 步)</span>
              <code className="block text-xs mt-1 font-mono break-all">{solution}</code>
            </div>
          )}
          {allMoves.length>0&&!showSol&&(
            <div className="flex flex-wrap gap-1">
              {allMoves.map((m,i)=><span key={i} className={`px-2 py-0.5 rounded text-xs font-mono ${i===currentStep&&isPlaying?'bg-[var(--color-primary)] text-[var(--color-background)]':i<currentStep?'text-[var(--color-accent-green)]':'bg-[var(--color-surface)] text-[var(--color-muted)]'}`}>{m}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
