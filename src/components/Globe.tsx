import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const Globe = () => {
    const globeRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.001;
        }
    });

    return (
        <group>
            {/* Atmosphere glow */}
            <Sphere args={[2.2, 64, 64]}>
                <meshBasicMaterial
                    color="#4f46e5"
                    transparent
                    opacity={0.05}
                    side={THREE.BackSide}
                />
            </Sphere>

            {/* Main Globe */}
            <Sphere ref={globeRef} args={[2, 64, 64]}>
                <MeshDistortMaterial
                    color="#1a1a1f"
                    roughness={0.7}
                    metalness={0.2}
                    distort={0}
                    speed={2}
                />
            </Sphere>

            {/* Wireframe overlay — sibling, not nested inside Sphere */}
            <mesh>
                <sphereGeometry args={[2.01, 32, 32]} />
                <meshBasicMaterial
                    color="#4f46e5"
                    wireframe
                    transparent
                    opacity={0.1}
                />
            </mesh>

            {/* Lights */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#818cf8" />
        </group>
    );
};
