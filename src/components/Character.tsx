import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { 
  Vector3, 
  Quaternion, 
  Euler, 
  Group, 
  AnimationMixer, 
  AnimationClip, 
  AnimationAction,
  LoopOnce 
} from "three";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

// Animation states
const ANIMATIONS = {
  IDLE: "idle",
  WALK: "walk",
  RUN: "run",
  ATTACK: "attack",
};

// Animation URLs
const ANIMATION_URLS = {
  [ANIMATIONS.IDLE]: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/idle.glb",
  [ANIMATIONS.WALK]: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/walk.glb",
  [ANIMATIONS.RUN]: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/run.glb",
  [ANIMATIONS.ATTACK]: "https://agent8-games.verse8.io/assets/3d/animations/mixamorig/punch.glb",
};

const Character = () => {
  const characterRef = useRef<RapierRigidBody>(null);
  const modelRef = useRef<Group>(null);
  const [position, setPosition] = useState(new Vector3(0, 1, 0)); // Start slightly above ground
  const { forward, backward, left, right, jump } = useKeyboardControls();
  const speed = 0.1;
  const runSpeed = 0.2; // Speed when running
  const direction = new Vector3();
  const [animationState, setAnimationState] = useState(ANIMATIONS.IDLE);
  const [isMoving, setIsMoving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [mixer, setMixer] = useState<AnimationMixer | null>(null);
  const [animations, setAnimations] = useState<Record<string, AnimationClip>>({});
  const [animationActions, setAnimationActions] = useState<Record<string, AnimationAction>>({});
  const [currentAction, setCurrentAction] = useState<AnimationAction | null>(null);
  const previousAnimationRef = useRef(ANIMATIONS.IDLE);

  // Load Trump character model
  const { scene: trumpScene } = useGLTF("https://agent8-games.verse8.io/assets/3d/characters/trump.glb");
  
  // Load animation files
  const { animations: idleAnimations } = useGLTF(ANIMATION_URLS[ANIMATIONS.IDLE]);
  const { animations: walkAnimations } = useGLTF(ANIMATION_URLS[ANIMATIONS.WALK]);
  const { animations: runAnimations } = useGLTF(ANIMATION_URLS[ANIMATIONS.RUN]);
  const { animations: attackAnimations } = useGLTF(ANIMATION_URLS[ANIMATIONS.ATTACK]);
  
  // Clone the scene to avoid issues with instancing
  const [model, setModel] = useState(null);
  
  // Initialize model and animations
  useEffect(() => {
    if (trumpScene) {
      const clonedScene = SkeletonUtils.clone(trumpScene);
      setModel(clonedScene);
      
      // Create animation mixer
      const newMixer = new AnimationMixer(clonedScene);
      setMixer(newMixer);
      
      // Collect all animations
      const animClips: Record<string, AnimationClip> = {};
      const actions: Record<string, AnimationAction> = {};
      
      // Process idle animation
      if (idleAnimations && idleAnimations.length > 0) {
        const idleClip = idleAnimations[0];
        idleClip.name = ANIMATIONS.IDLE;
        animClips[ANIMATIONS.IDLE] = idleClip;
        actions[ANIMATIONS.IDLE] = newMixer.clipAction(idleClip);
      }
      
      // Process walk animation
      if (walkAnimations && walkAnimations.length > 0) {
        const walkClip = walkAnimations[0];
        walkClip.name = ANIMATIONS.WALK;
        animClips[ANIMATIONS.WALK] = walkClip;
        actions[ANIMATIONS.WALK] = newMixer.clipAction(walkClip);
      }
      
      // Process run animation
      if (runAnimations && runAnimations.length > 0) {
        const runClip = runAnimations[0];
        runClip.name = ANIMATIONS.RUN;
        animClips[ANIMATIONS.RUN] = runClip;
        actions[ANIMATIONS.RUN] = newMixer.clipAction(runClip);
      }
      
      // Process attack animation
      if (attackAnimations && attackAnimations.length > 0) {
        const attackClip = attackAnimations[0];
        attackClip.name = ANIMATIONS.ATTACK;
        // Make attack animation non-looping
        attackClip.loop = LoopOnce;
        attackClip.clampWhenFinished = true;
        animClips[ANIMATIONS.ATTACK] = attackClip;
        actions[ANIMATIONS.ATTACK] = newMixer.clipAction(attackClip);
        
        // Set up event listener for when attack animation completes
        newMixer.addEventListener('finished', (e) => {
          if (e.action.getClip().name === ANIMATIONS.ATTACK) {
            setIsAttacking(false);
            // Return to previous animation state
            fadeToAction(previousAnimationRef.current);
          }
        });
      }
      
      setAnimations(animClips);
      setAnimationActions(actions);
      
      // Start with idle animation
      if (actions[ANIMATIONS.IDLE]) {
        actions[ANIMATIONS.IDLE].reset().play();
        setCurrentAction(actions[ANIMATIONS.IDLE]);
      }
    }
  }, [trumpScene, idleAnimations, walkAnimations, runAnimations, attackAnimations]);
  
  // Function to handle animation transitions
  const fadeToAction = (newAction: string, duration: number = 0.2) => {
    if (!animationActions[newAction] || (animationState === newAction && newAction !== ANIMATIONS.ATTACK)) return;
    
    const nextAction = animationActions[newAction];
    
    if (currentAction) {
      currentAction.fadeOut(duration);
    }
    
    nextAction.reset().fadeIn(duration).play();
    setCurrentAction(nextAction);
    setAnimationState(newAction);
    
    // If this is not an attack animation, store it as the previous animation
    if (newAction !== ANIMATIONS.ATTACK) {
      previousAnimationRef.current = newAction;
    }
  };

  // Toggle running state with Shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsRunning(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsRunning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle attack animation with Space key
  useEffect(() => {
    if (jump && !isAttacking && mixer) {
      setIsAttacking(true);
      fadeToAction(ANIMATIONS.ATTACK, 0.1);
      
      // Configure attack animation to play once
      if (animationActions[ANIMATIONS.ATTACK]) {
        animationActions[ANIMATIONS.ATTACK].setLoop(LoopOnce, 1);
        animationActions[ANIMATIONS.ATTACK].clampWhenFinished = true;
        animationActions[ANIMATIONS.ATTACK].reset().fadeIn(0.1).play();
      }
    }
  }, [jump, isAttacking, mixer, animationActions]);

  useFrame((_, delta) => {
    if (!characterRef.current || !modelRef.current) return;
    
    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
    }

    // Skip movement processing if attacking
    if (isAttacking) return;

    // Reset direction
    direction.set(0, 0, 0);

    // Update direction based on key presses
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    // Check if moving
    const moving = direction.lengthSq() > 0;
    setIsMoving(moving);

    // Determine animation state
    if (moving) {
      // Choose between walk and run animations
      const nextAnimation = isRunning ? ANIMATIONS.RUN : ANIMATIONS.WALK;
      fadeToAction(nextAnimation);
      
      // Normalize direction vector to maintain consistent speed in all directions
      direction.normalize();
      
      // Calculate rotation to face movement direction
      const angle = Math.atan2(direction.x, direction.z);
      if (modelRef.current) {
        const targetRotation = new Quaternion().setFromEuler(new Euler(0, angle, 0));
        modelRef.current.quaternion.slerp(targetRotation, 0.1);
      }

      // Apply movement directly to position state
      const newPosition = position.clone();
      const currentSpeed = isRunning ? runSpeed : speed;
      newPosition.x += direction.x * currentSpeed;
      newPosition.z += direction.z * currentSpeed;
      setPosition(newPosition);

      // Update rigid body position directly
      characterRef.current.setTranslation({ 
        x: newPosition.x, 
        y: newPosition.y, 
        z: newPosition.z 
      }, true); // Added 'true' to wake up the rigid body
    } else {
      // Switch to idle animation when not moving
      fadeToAction(ANIMATIONS.IDLE);
    }
  });

  return (
    <RigidBody 
      ref={characterRef} 
      position={[position.x, position.y, position.z]}
      colliders="capsule"
      mass={1}
      type="dynamic"
      lockRotations
      enabledTranslations={[true, true, true]} // Ensure all translations are enabled
    >
      {model && (
        <group ref={modelRef} scale={0.8} position={[0, -1, 0]}>
          <primitive object={model} />
        </group>
      )}
    </RigidBody>
  );
};

export default Character;
