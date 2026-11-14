import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "@react-three/drei";

export default function LandingPage3D({
  reducedMotion = false,
  ...props
}) {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
      }}
      glare={false}
      camera={{ position: [0, 0, 10], fov: 60 }}
    >
      <ambientLight intensity={0.5} />
      <directionLight
        position={[10, 10, 10]}
        intensity={1}
        shadows
      />
      <group rotation={[-0.1, 0, 0]}>
        {/* Orbiting spheres */}
        {Array.from({ length: 8 }).map((_, i) => (
          <sphere
            position={[
              Math.sin((i * Math.PI) / 4) * 6,
              Math.cos((i * Math.PI) / 4) * 6,
              -Math.random() * 10 - 5,
            ]}
            radius={0.5 + Math.random()}
            args={[0.5 + Math.random()]}
            color={
              `hsl(${(i * 45) % 360}, 70%, 50%)`
            }
            opacity={0.6 + Math.random() * 0.3}
            style={{
              animation: reduced
                ? undefined
                : `float-${i} 20s ease-in-out infinite`,
            }}
            style={{
              ...style,
            }}
          >
            <sphere.scale>
              {Array(3).fill(1 + Math.random() * 0.5)}
            </sphere.scale>
          </sphere>
        ))}

        {/* Earth-like globe */}
        <mesh>
          <sphereBufferGeometry args={[10, 32, 32]} />
          <meshStandardMaterial
            color="#0f7685"
            transparent
            opacity={0.03}
            depthWrite={false}
          />
          <mesh.scale>
            {Array(3).fill(0.8)}
          </mesh.scale>
        </mesh>

        {/* Rotating ring */}
        <mesh>
          <torusGeometry args={[6, 1.5, 16, 32]} />
          <meshStandardMaterial
            color="#0f7685"
            transparent
            opacity={0.1}
            side="double"
          />
          <mesh.rotation>
            {Array(3).fill(0)}
          </mesh.rotation>
          <mesh.position.z>{-8}</mesh.position.z>
        </mesh>
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={true}
        autoRotateSpeed{0.5}
        makeDefault
        args={["canvas", "camera"]}
        style={{
          rotateSpeed: -0.5,
          zoomSpeed: 0.5,
          panSpeed: 1,
        }}
      />
    </Canvas>
  );
}