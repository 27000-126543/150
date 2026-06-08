import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePlantStore } from '@/store/usePlantStore';
import { getStatusColor, formatNumber } from '@/utils/formatters';
import { getDOColor } from '@/utils/colorUtils';
import type { ProcessUnit, Equipment } from '@/types';

const UnitBody = ({ unit, onClick, isSelected }: { unit: ProcessUnit; onClick: () => void; isSelected: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;

      if (unit.status === 'alarm') {
        material.emissive.setHex(0xff3b30);
        material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      } else if (unit.status === 'warning') {
        material.emissive.setHex(0xff9500);
        material.emissiveIntensity = 0.2;
      } else if (isSelected) {
        material.emissive.setHex(0x00d4ff);
        material.emissiveIntensity = 0.3;
      } else {
        material.emissive.setHex(0x00d4ff);
        material.emissiveIntensity = 0.1;
      }
    }

    if (edgeRef.current) {
      const edgeMaterial = edgeRef.current.material as THREE.LineBasicMaterial;
      if (isSelected) {
        edgeMaterial.color.setHex(0x00d4ff);
        edgeMaterial.opacity = 1;
      } else {
        edgeMaterial.opacity = 0.5;
      }
    }
  });

  const getUnitColor = () => {
    switch (unit.type) {
      case 'inlet': return '#1e3a5f';
      case 'grille': return '#2d4a6f';
      case 'biological': return '#1a4a3a';
      case 'sediment': return '#2a3a5a';
      case 'disinfection': return '#1a3a4a';
      case 'dewatering': return '#3a2a3a';
      case 'control': return '#2a2a4a';
      default: return '#1e3a5f';
    }
  };

  const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(unit.size[0], unit.size[1], unit.size[2]));

  return (
    <group position={unit.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={unit.size} />
        <meshStandardMaterial
          color={getUnitColor()}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      <lineSegments ref={edgeRef}>
        <primitive object={edgeGeometry} />
        <lineBasicMaterial color="#00d4ff" transparent opacity={0.5} linewidth={2} />
      </lineSegments>

      <mesh position={[0, unit.size[1] / 2 - 0.1, 0]}>
        <boxGeometry args={[unit.size[0] - 0.2, 0.1, unit.size[2] - 0.2]} />
        <meshStandardMaterial
          color="#00d4ff"
          transparent
          opacity={0.6}
          emissive="#00d4ff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {unit.type !== 'control' && (
        <mesh position={[0, -unit.size[1] / 2 + 0.3, 0]}>
          <boxGeometry args={[unit.size[0] * 0.8, unit.size[1] * 0.6, unit.size[2] * 0.8]} />
          <meshStandardMaterial
            color="#0a1628"
            transparent
            opacity={0.7}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      )}

      <Html position={[0, unit.size[1] / 2 + 1.2, 0]} center distanceFactor={12}>
        <div
          className={`px-3 py-1.5 rounded-lg text-white text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
            isSelected ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-slate-800/90 hover:bg-slate-700/90'
          }`}
          style={{ fontFamily: 'Rajdhani, sans-serif' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getStatusColor(unit.status) }}
            />
            {unit.name}
          </div>
        </div>
      </Html>
    </group>
  );
};

const EquipmentModel = ({ equipment }: { equipment: Equipment }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && equipment.status === 'running') {
      if (equipment.type === 'blower') {
        groupRef.current.rotation.y += 0.02;
      } else if (equipment.type === 'dewaterer') {
        groupRef.current.rotation.z += 0.01;
      }
    }
  });

  const needsMaintenance = equipment.runHours >= equipment.maintenanceThreshold;

  const getEquipmentColor = () => {
    if (needsMaintenance) return '#ff9500';
    if (equipment.status === 'running') return '#34c759';
    if (equipment.status === 'standby') return '#ff9500';
    return '#ff3b30';
  };

  return (
    <group position={equipment.position}>
      <group ref={groupRef}>
        {equipment.type === 'blower' && (
          <>
            <mesh>
              <cylinderGeometry args={[0.4, 0.5, 0.6, 8]} />
              <meshStandardMaterial color={getEquipmentColor()} metalness={0.8} roughness={0.2} emissive={getEquipmentColor()} emissiveIntensity={needsMaintenance ? 0.5 : 0.2} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.2, 0.3, 0.3, 8]} />
              <meshStandardMaterial color="#666" metalness={0.9} roughness={0.1} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0, 0.3, 0.35]}>
                <boxGeometry args={[0.05, 0.02, 0.2]} />
                <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
              </mesh>
            ))}
          </>
        )}

        {equipment.type === 'dewaterer' && (
          <>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 1.2, 12]} />
              <meshStandardMaterial color={getEquipmentColor()} metalness={0.8} roughness={0.2} emissive={getEquipmentColor()} emissiveIntensity={needsMaintenance ? 0.5 : 0.2} />
            </mesh>
            <mesh position={[0, 0, 0.5]}>
              <torusGeometry args={[0.35, 0.02, 8, 32]} />
              <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}

        {equipment.type === 'pump' && (
          <>
            <mesh>
              <cylinderGeometry args={[0.25, 0.3, 0.5, 8]} />
              <meshStandardMaterial color={getEquipmentColor()} metalness={0.8} roughness={0.2} emissive={getEquipmentColor()} emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.2, 0.15, 0.15]} />
              <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
            </mesh>
          </>
        )}
      </group>

      {needsMaintenance && (
        <Html position={[0, 1, 0]} center distanceFactor={10}>
          <div className="px-2 py-1 bg-orange-500 text-white text-xs rounded font-bold whitespace-nowrap animate-pulse">
            需要保养
          </div>
        </Html>
      )}

      <Html position={[0, -0.8, 0]} center distanceFactor={10}>
        <div className="px-2 py-1 bg-slate-800/80 text-white text-xs rounded whitespace-nowrap">
          {equipment.name}
          {equipment.frequency !== undefined && (
            <span className="text-cyan-400 ml-1">{formatNumber(equipment.frequency, 0)}Hz</span>
          )}
        </div>
      </Html>
    </group>
  );
};

const ProcessUnits = () => {
  const { processUnits, equipment, selectedUnitId, setSelectedUnitId } = usePlantStore();

  return (
    <group>
      {processUnits.map((unit) => (
        <UnitBody
          key={unit.id}
          unit={unit}
          onClick={() => setSelectedUnitId(selectedUnitId === unit.id ? null : unit.id)}
          isSelected={selectedUnitId === unit.id}
        />
      ))}

      {equipment.map((eq) => (
        <EquipmentModel key={eq.id} equipment={eq} />
      ))}
    </group>
  );
};

export default ProcessUnits;
