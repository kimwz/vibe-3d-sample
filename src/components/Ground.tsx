import { useRef } from "react";
import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";

const Ground = () => {
  const groundRef = useRef();

  useFrame(() => {
    // Ground update logic if needed
  });

  return (
    <RigidBody type="fixed" colliders="cuboid" ref={groundRef}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#3a7e4c" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </RigidBody>
  );
};

export default Ground;
