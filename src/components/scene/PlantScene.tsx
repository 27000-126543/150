import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { usePlantStore } from '@/store/usePlantStore';
import ProcessUnits from './ProcessUnits';
import AerationSystem from './AerationSystem';
import PipelineFlow from './PipelineFlow';
import Personnel from './Personnel';
import WaterQualityTag from './WaterQualityTag';
import { dangerZones } from '@/data/initialData';

const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#0a1628" roughness={0.8} metalness={0.2} />
    </mesh>
  );
};

const GridFloor = () => {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame(() => {
    if (gridRef.current) {
      gridRef.current.material.opacity = 0.3;
      gridRef.current.material.transparent = true;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[50, 50, '#00d4ff', '#0a1628']}
      position={[0, 0.01, 0]}
    />
  );
};

const DangerZone = ({ zone }: { zone: typeof dangerZones[0] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group position={[zone.position[0], zone.position[1] + zone.size[1] / 2, zone.position[2]]}>
      <mesh ref={meshRef}>
        <boxGeometry args={[zone.size[0], zone.size[1], zone.size[2]]} />
        <meshStandardMaterial
          color="#ff3b30"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
      <Html position={[0, zone.size[1] / 2 + 0.5, 0]} center distanceFactor={10}>
        <div className="px-2 py-1 bg-red-500/80 text-white text-xs rounded font-bold whitespace-nowrap">
          危险区域: {zone.name}
        </div>
      </Html>
    </group>
  );
};

const FactoryLighting = () => {
  return (
    <>
      <ambientLight intensity={0.4} color="#4a90d9" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-12, 5, -8]} intensity={0.5} color="#00d4ff" distance={15} />
      <pointLight position={[0, 5, -6]} intensity={0.5} color="#00d4ff" distance={15} />
      <pointLight position={[0, 5, 3]} intensity={0.5} color="#00d4ff" distance={15} />
      <pointLight position={[9, 5, 8]} intensity={0.5} color="#00d4ff" distance={15} />
      <pointLight position={[15, 5, 8]} intensity={0.5} color="#00d4ff" distance={15} />
    </>
  );
};

interface PlantSceneProps {
  showLabels?: boolean;
  showPipelines?: boolean;
  showGrid?: boolean;
}

const SceneContent = ({ showLabels = true, showPipelines = true, showGrid = false }: PlantSceneProps) => {
  const { processUnits, selectedUnitId, setSelectedUnitId } = usePlantStore();

  return (
    <>
      <Ground />
      {showGrid && <GridFloor />}
      <FactoryLighting />

      <ProcessUnits />
      <AerationSystem />
      {showPipelines && <PipelineFlow />}
      <Personnel />
      {showLabels && <WaterQualityTag />}

      {dangerZones.map((zone) => (
        <DangerZone key={zone.id} zone={zone} />
      ))}

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={50}
        blur={2}
        far={10}
      />

      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 2, 0]}
      />

      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette offset={0.3} darkness={0.5} />
      </EffectComposer>
    </>
  );
};

const PlantScene = ({ showLabels = true, showPipelines = true, showGrid = false }: PlantSceneProps) => {
  return (
    <Canvas
      shadows
      camera={{ position: [15, 15, 15], fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#050a14');
      }}
    >
      <Suspense fallback={null}>
        <SceneContent showLabels={showLabels} showPipelines={showPipelines} showGrid={showGrid} />
      </Suspense>
    </Canvas>
  );
};

export default PlantScene;
