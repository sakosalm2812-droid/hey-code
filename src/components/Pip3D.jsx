import { useRef } from 'react';
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

/**
 * Pip - The 3D Pet
 * A friendly companion that follows mouse movements
 */
export function Pip({ position = [6, -2, -5], scale = 1 }) {
  const groupRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const tailRef = useRef();

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const reduced = false; // Use local reduced state since useReducedMotion not available

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth rotation following mouse
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Calculate target rotation based on mouse position
    // Subtle following - max 15 degrees
    targetRotation.current.y = mouse.x * 0.26; // ~15 degrees
    targetRotation.current.x = mouse.y * 0.17; // ~10 degrees

    // Smooth interpolation
    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.05;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.05;

    // Apply to group
    groupRef.current.rotation.y = currentRotation.current.y;
    groupRef.current.rotation.x = currentRotation.current.x;

    // Subtle idle animation when not interacting
    const time = state.clock.getElapsedTime();
    if (Math.abs(mouse.x) < 0.01 && Math.abs(mouse.y) < 0.01) {
      groupRef.current.rotation.y += Math.sin(time * 0.3) * 0.02;
      groupRef.current.rotation.x += Math.cos(time * 0.5) * 0.01;
    }

    // Head follows slightly more than body
    if (headRef.current) {
      headRef.current.rotation.y = currentRotation.current.y * 1.5;
      headRef.current.rotation.x = currentRotation.current.x * 1.5;
    }

    // Tail wag
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(time * 2) * 0.2;
    }

    // Eye pupils follow mouse
    if (leftEyeRef.current && rightEyeRef.current) {
      const pupilOffset = 0.03;
      leftEyeRef.current.position.x = mouse.x * pupilOffset;
      leftEyeRef.current.position.y = -mouse.y * pupilOffset;
      rightEyeRef.current.position.x = mouse.x * pupilOffset;
      rightEyeRef.current.position.y = -mouse.y * pupilOffset;
    }

    // Body subtle breathing
    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(time * 1.5) * 0.02;
    }
  });

  // Deep Teal color
  const deepTeal = '#0f7685';
  const deepTealGlow = '#16a094';
  const eyeColor = '#0a4d57';

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Glow aura */}
      <mesh
        geometry={new THREE.SphereGeometry(2.5, 16, 16)}
        material={new THREE.MeshBasicMaterial({
          color: deepTeal,
          transparent: true,
          opacity: 0.05,
          depthWrite: false,
        })}
      />

      {/* Body - rounded box */}
      <group ref={bodyRef}>
        <mesh
          geometry={new THREE.BoxGeometry(1.8, 1.4, 1.8)}
          material={new THREE.MeshStandardMaterial({
            color: deepTeal,
            roughness: 0.3,
            metalness: 0.2,
            emissive: deepTeal,
            emissiveIntensity: 0.15,
          })}
        />
      </group>

      {/* Head - slightly smaller rounded box */}
      <group ref={headRef} position={[0, 1.2, 0.6]}>
        <mesh
          geometry={new THREE.BoxGeometry(1.2, 1.1, 1.1)}
          material={new THREE.MeshStandardMaterial({
            color: deepTeal,
            roughness: 0.2,
            metalness: 0.3,
            emissive: deepTeal,
            emissiveIntensity: 0.2,
          })}
        />

        {/* Eyes */}
        <group>
          {/* Left eye */}
          <mesh
            ref={leftEyeRef}
            position={[-0.3, 0.15, 0.55]}
            geometry={new THREE.SphereGeometry(0.15, 12, 12)}
            material={new THREE.MeshStandardMaterial({
              color: eyeColor,
              roughness: 0.1,
              metalness: 0.9,
              emissive: eyeColor,
              emissiveIntensity: 0.5,
            })}
          >
            {/* Pupil */}
            <mesh
              geometry={new THREE.SphereGeometry(0.08, 8, 8)}
              material={new THREE.MeshBasicMaterial({ color: '#000' })}
              position={[0, 0, 0.08]}
            />
            <mesh
              geometry={new THREE.SphereGeometry(0.03, 6, 6)}
              material={new THREE.MeshBasicMaterial({ color: '#fff' })}
              position={[0.02, -0.02, 0.12]}
            />
          </mesh>

          {/* Right eye */}
          <mesh
            ref={rightEyeRef}
            position={[0.3, 0.15, 0.55]}
            geometry={new THREE.SphereGeometry(0.15, 12, 12)}
            material={new THREE.MeshStandardMaterial({
              color: eyeColor,
              roughness: 0.1,
              metalness: 0.9,
              emissive: eyeColor,
              emissiveIntensity: 0.5,
            })}
          >
            {/* Pupil */}
            <mesh
              geometry={new THREE.SphereGeometry(0.08, 8, 8)}
              material={new THREE.MeshBasicMaterial({ color: '#000' })}
              position={[0, 0, 0.08]}
            />
            <mesh
              geometry={new THREE.SphereGeometry(0.03, 6, 6)}
              material={new THREE.MeshBasicMaterial({ color: '#fff' })}
              position={[0.02, -0.02, 0.12]}
            />
          </mesh>
        </group>

        {/* Ears */}
        <mesh
          position={[-0.55, 0.6, 0.1]}
          rotation={[-0.3, 0, -0.2]}
          geometry={new THREE.ConeGeometry(0.3, 0.6, 6)}
          material={new THREE.MeshStandardMaterial({
            color: deepTeal,
            roughness: 0.3,
            metalness: 0.2,
            emissive: deepTeal,
            emissiveIntensity: 0.1,
          })}
        />
        <mesh
          position={[0.55, 0.6, 0.1]}
          rotation={[-0.3, 0, 0.2]}
          geometry={new THREE.ConeGeometry(0.3, 0.6, 6)}
          material={new THREE.MeshStandardMaterial({
            color: deepTeal,
            roughness: 0.3,
            metalness: 0.2,
            emissive: deepTeal,
            emissiveIntensity: 0.1,
          })}
        />
      </group>

      {/* Paws - front */}
      <mesh
        position={[-0.6, -0.7, 0.6]}
        geometry={new THREE.SphereGeometry(0.25, 8, 8)}
        material={new THREE.MeshStandardMaterial({
          color: deepTeal,
          roughness: 0.3,
          metalness: 0.2,
          emissive: deepTeal,
          emissiveIntensity: 0.1,
        })}
      />
      <mesh
        position={[0.6, -0.7, 0.6]}
        geometry={new THREE.SphereGeometry(0.25, 8, 8)}
        material={new THREE.MeshStandardMaterial({
          color: deepTeal,
          roughness: 0.3,
          metalness: 0.2,
          emissive: deepTeal,
          emissiveIntensity: 0.1,
        })}
      />

      {/* Paws - back */}
      <mesh
        position={[-0.5, -0.7, -0.5]}
        geometry={new THREE.SphereGeometry(0.2, 8, 8)}
        material={new THREE.MeshStandardMaterial({
          color: deepTeal,
          roughness: 0.3,
          metalness: 0.2,
          emissive: deepTeal,
          emissiveIntensity: 0.1,
        })}
      />
      <mesh
        position={[0.5, -0.7, -0.5]}
        geometry={new THREE.SphereGeometry(0.2, 8, 8)}
        material={new THREE.MeshStandardMaterial({
          color: deepTeal,
          roughness: 0.3,
          metalness: 0.2,
          emissive: deepTeal,
          emissiveIntensity: 0.1,
        })}
      />

      {/* Tail */}
      <group ref={tailRef} position={[0, -0.3, -0.9]} rotation={[0.3, 0, 0]}>
        <mesh
          geometry={new THREE.CylinderGeometry(0.1, 0.25, 1, 8)}
          material={new THREE.MeshStandardMaterial({
            color: deepTeal,
            roughness: 0.3,
            metalness: 0.2,
            emissive: deepTeal,
            emissiveIntensity: 0.1,
          })}
        />
      </group>

      {/* Whiskers */}
      <group>
        {[-1, 1].map(side => (
          <mesh
            key={side}
            position={[side * 0.55, 0, 0.65]}
            geometry={new THREE.CylinderGeometry(0.01, 0.01, 0.6, 4)}
            rotation={[0, 0, Math.PI / 2 * 0.3 * side]}
            material={new THREE.MeshBasicMaterial({ color: '#aaa' })}
          />
        ))}
      </group>
    </group>
  );
}

/**
 * Main Pip canvas wrapper for the landing page
 */
export default function PipCanvas({ position = [6, -2, -5] }) {
  // Simple reduced motion check
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) return null;

  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      camera={{ position: [0, 0, 15], fov: 50 }}
      glare={false}
    >
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[10, 10, 10]}
        intensity={1.5}
        color="#ffffff"
      />
      <directionalLight
        position={[-10, 5, 5]}
        intensity={0.5}
        color="#0f7685"
      />
      <Pip position={position} scale={1.2} />
    </Canvas>
  );
}