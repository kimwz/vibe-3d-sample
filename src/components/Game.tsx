import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import Character from "./Character";
import Ground from "./Ground";

const Game = () => {
  const gameRef = useRef();

  useFrame(() => {
    // Game update logic can be added here
  });

  return (
    <Physics debug={false}>
      <group ref={gameRef}>
        <Ground />
        <Character />
      </group>
    </Physics>
  );
};

export default Game;
