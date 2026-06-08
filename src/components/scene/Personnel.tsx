import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePlantStore } from '@/store/usePlantStore';
import type { Personnel } from '@/types';

const PersonModel = ({ personnel }: { personnel: Personnel }) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const dx = personnel.targetPosition[0] - personnel.position[0];
      const dz = personnel.targetPosition[2] - personnel.position[2];
      if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
        groupRef.current.rotation.y = Math.atan2(dx, dz);
      }
    }

    if (personnel.inDangerZone) {
      if (bodyRef.current) {
        const material = bodyRef.current.material as THREE.MeshStandardMaterial;
        material.emissive.setHex(0xff3b30);
        material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.4;
      }
      if (headRef.current) {
        const material = headRef.current.material as THREE.MeshStandardMaterial;
        material.emissive.setHex(0xff3b30);
        material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 8) * 0.3;
      }
    } else {
      if (bodyRef.current) {
        const material = bodyRef.current.material as THREE.MeshStandardMaterial;
        material.emissive.setHex(0x00d4ff);
        material.emissiveIntensity = 0.1;
      }
      if (headRef.current) {
        const material = headRef.current.material as THREE.MeshStandardMaterial;
        material.emissive.setHex(0x000000);
        material.emissiveIntensity = 0;
      }
    }
  });

  const bodyColor = personnel.inDangerZone ? '#ff3b30' : '#4a90d9';
  const headColor = personnel.inDangerZone ? '#ff6b6b' : '#ffd4a3';

  return (
    <group ref={groupRef} position={personnel.position}>
      <mesh ref={bodyRef} position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.3} roughness={0.7} />
      </mesh>

      <mesh ref={headRef} position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={headColor} metalness={0.1} roughness={0.8} />
      </mesh>

      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.05, 16]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh position={[-0.08, 1.38, 0.08]}>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        <meshStandardMaterial
          color={personnel.inDangerZone ? '#ff3b30' : '#ffff00'}
          emissive={personnel.inDangerZone ? '#ff3b30' : '#ffff00'}
          emissiveIntensity={personnel.inDangerZone ? 1 : 0.5}
        />
      </mesh>
      <mesh position={[0.08, 1.38, 0.08]}>
        <boxGeometry args={[0.06, 0.03, 0.06]} />
        <meshStandardMaterial
          color={personnel.inDangerZone ? '#ff3b30' : '#ffff00'}
          emissive={personnel.inDangerZone ? '#ff3b30' : '#ffff00'}
          emissiveIntensity={personnel.inDangerZone ? 1 : 0.5}
        />
      </mesh>

      <Html position={[0, 2.2, 0]} center distanceFactor={10}>
        <div
          className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
            personnel.inDangerZone
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
              : 'bg-slate-800/90 text-cyan-400'
          }`}
        >
          <div>{personnel.name}</div>
          <div className="text-[10px] opacity-80">{personnel.role}</div>
        </div>
      </Html>

      {personnel.inDangerZone && (
        <Html position={[0, 2.8, 0]} center distanceFactor={10}>
          <div className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded animate-bounce">
            ⚠ 危险区域
          </div>
        </Html>
      )}
    </group>
  );
};

const Personnel = () => {
  const { personnel } = usePlantStore();

  return (
    <group>
      {personnel.map((p) => (
        <PersonModel key={p.id} personnel={p} />
      ))}
    </group>
  );
};

export default Personnel;
