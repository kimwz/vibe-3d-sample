import { useState, useEffect } from "react";

export const useKeyboardControls = () => {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game controls
      if (['w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys((keys) => ({ ...keys, forward: true }));
          break;
        case 's':
          setKeys((keys) => ({ ...keys, backward: true }));
          break;
        case 'a':
          setKeys((keys) => ({ ...keys, left: true }));
          break;
        case 'd':
          setKeys((keys) => ({ ...keys, right: true }));
          break;
        case ' ':
          setKeys((keys) => ({ ...keys, jump: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys((keys) => ({ ...keys, forward: false }));
          break;
        case 's':
          setKeys((keys) => ({ ...keys, backward: false }));
          break;
        case 'a':
          setKeys((keys) => ({ ...keys, left: false }));
          break;
        case 'd':
          setKeys((keys) => ({ ...keys, right: false }));
          break;
        case ' ':
          setKeys((keys) => ({ ...keys, jump: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
};
