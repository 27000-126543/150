import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlantStore } from '@/store/usePlantStore';
import { useDispatchStore } from '@/store/useDispatchStore';

interface PipeSegmentProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  type: 'normal' | 'backup' | 'emergency';
  isActive: boolean;
  showFlow?: boolean;
}

const PipeSegment = ({ start, end, color, type, isActive, showFlow = true }: PipeSegmentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const midPoint = useMemo(() => {
    return [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2,
    ] as [number, number, number];
  }, [start, end]);

  const length = useMemo(() => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [start, end]);

  const rotation = useMemo(() => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    const yaw = Math.atan2(dx, dz);
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    return [pitch, yaw, 0] as [number, number, number];
  }, [start, end]);

  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(30 * 3);
    for (let i = 0; i < 30; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (i / 30) * length - length / 2;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [length]);

  useFrame((state) => {
    if (particlesRef.current && isActive && showFlow) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 30; i++) {
        let z = positions[i * 3 + 2];
        z += 0.08;
        if (z > length / 2) z = -length / 2;
        positions[i * 3 + 2] = z;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (meshRef.current && type !== 'normal' && isActive) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (type === 'emergency') {
        material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 6) * 0.3;
      } else if (type === 'backup') {
        material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      }
    }
  });

  const pipeRadius = type === 'emergency' ? 0.12 : type === 'backup' ? 0.1 : 0.08;
  const isDashed = type === 'backup';

  return (
    <group position={midPoint} rotation={rotation}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[pipeRadius, pipeRadius, length, 8]} />
        {isDashed ? (
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={isActive ? 0.5 : 0.1}
            transparent
            opacity={isActive ? 0.9 : 0.4}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            metalness={0.8}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={isActive ? 0.3 : 0.1}
            transparent
            opacity={isActive ? 0.9 : 0.4}
          />
        )}
      </mesh>

      {isDashed && isActive && (
        <mesh>
          <cylinderGeometry args={[pipeRadius * 1.1, pipeRadius * 1.1, length, 8]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.3}
            wireframe
            wireframeLinewidth={2}
          />
        </mesh>
      )}

      {isActive && showFlow && (
        <points ref={particlesRef} geometry={particlesGeometry}>
          <pointsMaterial
            color={color}
            size={0.18}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  );
};

const FlowArrow = ({
  start,
  end,
  color,
  isActive,
  offset = 0.5,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  isActive: boolean;
  offset?: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const arrowHelperRef = useRef<THREE.ArrowHelper | null>(null);

  const { direction, midPoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const dir = endVec.clone().sub(startVec).normalize();
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
    mid.y += offset;
    return { direction: dir, midPoint: mid };
  }, [start, end, offset]);

  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.position.y = midPoint.y + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    }
  });

  if (!arrowHelperRef.current) {
    arrowHelperRef.current = new THREE.ArrowHelper(
      direction,
      new THREE.Vector3(0, 0, 0),
      0.8,
      new THREE.Color(color),
      0.35,
      0.2
    );
  }

  return (
    <group ref={groupRef} position={midPoint}>
      <primitive object={arrowHelperRef.current} />
    </group>
  );
};

const PipelineFlow = () => {
  const { treatmentLines, emergencyDosing, pipelineConnections, getActivePipelineConnections } = usePlantStore();
  const { isActive: isDispatchActive, selectedStrategy, getPreviewFlowPaths } = useDispatchStore();

  const activeConnections = getActivePipelineConnections();
  const backupLine = treatmentLines.find((l) => l.isBackup);
  const backupLineActive = backupLine?.isActive ?? false;

  const previewPaths = isDispatchActive && selectedStrategy ? getPreviewFlowPaths() : [];

  const getPipelineColor = (type: string, isBackup: boolean) => {
    if (type === 'emergency') return '#ff3b30';
    if (type === 'backup' || isBackup) return '#34c759';
    return '#00d4ff';
  };

  return (
    <group>
      {pipelineConnections.map((conn) => {
        const allPoints: [number, number, number][] = [conn.fromPosition];
        allPoints.push(...conn.waypoints);
        allPoints.push(conn.toPosition);

        const isBackupPipe = conn.type === 'backup';
        const color = getPipelineColor(conn.type, isBackupPipe);

        return (
          <group key={conn.id}>
            {allPoints.slice(0, -1).map((point, index) => (
              <PipeSegment
                key={`${conn.id}-${index}`}
                start={point}
                end={allPoints[index + 1]}
                color={color}
                type={conn.type}
                isActive={conn.isActive}
              />
            ))}

            {conn.isActive && (
              <FlowArrow
                start={conn.fromPosition}
                end={conn.toPosition}
                color={color}
                isActive={conn.isActive}
                offset={0.5}
              />
            )}
          </group>
        );
      })}

      {backupLineActive && backupLine?.switchPath && backupLine.switchPath.length > 1 && (
        <group>
          {backupLine.switchPath.slice(0, -1).map((point, index) => (
            <PipeSegment
              key={`backup-switch-${index}`}
              start={point}
              end={backupLine.switchPath![index + 1]}
              color="#34c759"
              type="backup"
              isActive={true}
            />
          ))}
          <FlowArrow
            start={backupLine.switchPath[0]}
            end={backupLine.switchPath[backupLine.switchPath.length - 1]}
            color="#34c759"
            isActive={true}
            offset={1}
          />
        </group>
      )}

      {emergencyDosing.map((dosing) =>
        dosing.isActive ? (
          <group key={dosing.id}>
            {dosing.pipelinePath.slice(0, -1).map((point, index) => (
              <PipeSegment
                key={`emergency-${dosing.id}-${index}`}
                start={point}
                end={dosing.pipelinePath[index + 1]}
                color="#ff3b30"
                type="emergency"
                isActive={true}
              />
            ))}
            {dosing.pipelinePath.length > 1 && (
              <FlowArrow
                start={dosing.pipelinePath[0]}
                end={dosing.pipelinePath[dosing.pipelinePath.length - 1]}
                color="#ff3b30"
                isActive={true}
                offset={1}
              />
            )}
          </group>
        ) : null
      )}

      {previewPaths.map((path, pathIndex) =>
        path.length > 1 ? (
          <group key={`preview-${pathIndex}`}>
            {path.slice(0, -1).map((point, index) => (
              <PipeSegment
                key={`preview-${pathIndex}-${index}`}
                start={point}
                end={path[index + 1]}
                color="#ffd700"
                type="backup"
                isActive={true}
                showFlow={false}
              />
            ))}
          </group>
        ) : null
      )}
    </group>
  );
};

export default PipelineFlow;
