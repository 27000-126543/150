import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlantStore } from '@/store/usePlantStore';
import { getDOColor } from '@/utils/colorUtils';

interface Bubble {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  active: boolean;
  phase: number;
}

const AerationTank = ({
  unitId,
  position,
  size,
  doValue,
}: {
  unitId: string;
  position: [number, number, number];
  size: [number, number, number];
  doValue: number;
}) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const isLowDO = doValue < 1;

  const maxBubbles = useMemo(() => {
    const baseBubbles = 100;
    const doFactor = Math.max(0, 1 - (doValue - 1) / 4);
    return Math.floor(baseBubbles + doFactor * 150);
  }, [doValue]);

  useMemo(() => {
    bubblesRef.current = [];
    for (let i = 0; i < 250; i++) {
      bubblesRef.current.push({
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * (size[0] - 1),
          position[1] - size[1] / 2 + Math.random() * size[1] * 0.8,
          position[2] + (Math.random() - 0.5) * (size[2] - 1)
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          0.02 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.01
        ),
        size: 0.05 + Math.random() * 0.1,
        active: i < maxBubbles,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }, [position, size, maxBubbles]);

  useFrame((state) => {
    if (!instancedMeshRef.current) return;

    const time = state.clock.elapsedTime;
    const bubbleColor = new THREE.Color(getDOColor(doValue));

    bubblesRef.current.forEach((bubble, index) => {
      if (index >= maxBubbles) {
        bubble.active = false;
        return;
      }

      bubble.active = true;

      bubble.position.add(bubble.velocity);
      bubble.position.x += Math.sin(time * 2 + bubble.phase) * 0.002;
      bubble.position.z += Math.cos(time * 1.5 + bubble.phase) * 0.002;

      if (bubble.position.y > position[1] + size[1] / 2 - 0.5) {
        bubble.position.set(
          position[0] + (Math.random() - 0.5) * (size[0] - 1),
          position[1] - size[1] / 2 + 0.1,
          position[2] + (Math.random() - 0.5) * (size[2] - 1)
        );
      }

      dummy.position.copy(bubble.position);

      const scale = bubble.size * (1 + Math.sin(time * 3 + bubble.phase) * 0.2);
      dummy.scale.setScalar(scale);

      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(index, dummy.matrix);

      const opacity = isLowDO ? 0.8 + Math.sin(time * 8) * 0.2 : 0.7;
      instancedMeshRef.current!.setColorAt(index, bubbleColor.clone().multiplyScalar(opacity));
    });

    instancedMeshRef.current.count = maxBubbles;
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const waterColor = doValue < 1 ? '#ff3b30' : doValue < 2 ? '#ff9500' : '#1a4a6a';

  return (
    <group>
      <mesh position={[position[0], position[1] - size[1] / 2 + 0.05, position[2]]}>
        <boxGeometry args={[size[0] - 0.2, 0.1, size[2] - 0.2]} />
        <meshStandardMaterial
          color="#333"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[position[0], position[1] + 0.5, position[2]]}>
        <boxGeometry args={[size[0] * 0.9, size[1] * 0.6, size[2] * 0.9]} />
        <meshStandardMaterial
          color={waterColor}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, 250]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          transparent
          opacity={0.7}
          emissive={getDOColor(doValue)}
          emissiveIntensity={doValue < 1 ? 0.8 : 0.3}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {isLowDO && (
        <mesh position={[position[0], position[1] + size[1] / 2 + 0.5, position[2]]}>
          <boxGeometry args={[size[0] + 0.5, 0.2, size[2] + 0.5]} />
          <meshBasicMaterial
            color="#ff3b30"
            transparent
            opacity={0.5 + Math.sin(Date.now() / 200) * 0.3}
          />
        </mesh>
      )}
    </group>
  );
};

const AerationSystem = () => {
  const { processUnits } = usePlantStore();

  const biologicalUnits = processUnits.filter(
    (unit) => unit.type === 'biological' && unit.outletWater.flow > 0
  );

  return (
    <group>
      {biologicalUnits.map((unit) => (
        <AerationTank
          key={unit.id}
          unitId={unit.id}
          position={unit.position}
          size={unit.size}
          doValue={unit.outletWater.do ?? 2}
        />
      ))}
    </group>
  );
};

export default AerationSystem;
