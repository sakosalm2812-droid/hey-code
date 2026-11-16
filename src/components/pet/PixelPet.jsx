import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const PET_SIZE = 64;
const GRID_SIZE = 16;
const PIXEL_SIZE = PET_SIZE / GRID_SIZE;

const petFrames = {
  idle: [
    // Frame 1 - neutral
    Array(GRID_SIZE).fill().map((_, y) =>
      Array(GRID_SIZE).fill().map((_, x) => {
        // Body: orange blocky square centered
        if (x >= 3 && x <= 12 && y >= 4 && y <= 13) {
          // Eyes
          if ((x === 5 || x === 10) && y === 6) return '#141414';
          // Blush
          if ((x === 4 && y === 8) || (x === 11 && y === 8)) return '#F4A69A';
          return '#E88A70';
        }
        return null;
      })
    ),
    // Frame 2 - slight bounce (moved down 1px)
    Array(GRID_SIZE).fill().map((_, y) =>
      Array(GRID_SIZE).fill().map((_, x) => {
        if (x >= 3 && x <= 12 && y >= 5 && y <= 14) {
          if ((x === 5 || x === 10) && y === 7) return '#141414';
          if ((x === 4 && y === 9) || (x === 11 && y === 9)) return '#F4A69A';
          return '#E88A70';
        }
        return null;
      })
    ),
  ],
  happy: [
    // Happy frame - eyes up, smile
    Array(GRID_SIZE).fill().map((_, y) =>
      Array(GRID_SIZE).fill().map((_, x) => {
        if (x >= 3 && x <= 12 && y >= 4 && y <= 13) {
          // Eyes looking up (closed/happy)
          if ((x === 5 || x === 10) && y === 5) return '#141414';
          // Smile
          if (x >= 6 && x <= 9 && y === 10) return '#141414';
          if ((x === 5 || x === 10) && y === 9) return '#141414';
          // Blush
          if ((x === 4 && y === 8) || (x === 11 && y === 8)) return '#F4A69A';
          return '#E88A70';
        }
        return null;
      })
    ),
  ],
  sad: [
    // Sad frame - eyes down, drooping
    Array(GRID_SIZE).fill().map((_, y) =>
      Array(GRID_SIZE).fill().map((_, x) => {
        if (x >= 3 && x <= 12 && y >= 4 && y <= 13) {
          // Eyes looking down
          if ((x === 5 || x === 10) && y === 8) return '#141414';
          // Frown
          if (x >= 6 && x <= 9 && y === 11) return '#141414';
          if ((x === 5 || x === 10) && y === 10) return '#141414';
          return '#E88A70';
        }
        return null;
      })
    ),
  ],
};

const sunFrames = [
  // Sun/sparkle above pet
  Array(12).fill().map((_, y) =>
    Array(12).fill().map((_, x) => {
      const cx = 5.5, cy = 5.5;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < 3) return '#F4D03F';
      // Rays
      if ((x === 5 && y === 1) || (x === 5 && y === 10) || (x === 1 && y === 5) || (x === 10 && y === 5)) return '#F4D03F';
      if ((x === 2 && y === 2) || (x === 9 && y === 2) || (x === 2 && y === 9) || (x === 9 && y === 9)) return '#F4D03F';
      return null;
    })
  ),
];

const cloudFrames = [
  // Rain cloud
  Array(12).fill().map((_, y) =>
    Array(12).fill().map((_, x) => {
      // Cloud body
      if (y >= 2 && y <= 6 && x >= 1 && x <= 10) {
        if ((y === 2 && (x === 2 || x === 3 || x === 7 || x === 8)) ||
            (y === 3 && (x >= 1 && x <= 9)) ||
            (y === 4 && (x >= 0 && x <= 11)) ||
            (y === 5 && (x >= 1 && x <= 9)) ||
            (y === 6 && (x >= 2 && x <= 8))) {
          return '#95A5A6';
        }
      }
      // Rain drops
      if (y >= 7 && y <= 11 && (x === 3 || x === 6 || x === 9) && (y - 7) % 2 === 0) return '#95A5A6';
      return null;
    })
  ),
];

function PixelGrid({ frame, size = PET_SIZE }) {
  const gridSize = frame[0].length;
  const pixelSize = size / gridSize;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${gridSize}, ${pixelSize}px)`,
        position: 'relative',
      }}
      aria-hidden="true"
    >
      {frame.map((row, y) =>
        row.map((color, x) =>
          color ? (
            <div
              key={`${x}-${y}`}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: color,
                // Crisp pixel rendering
                imageRendering: 'pixelated',
              }}
            />
          ) : null
        )
      )}
    </div>
  );
}

export function PixelPet({ inputText = "", className = "" }) {
  const [state, setState] = useState('idle');
  const [frameIndex, setFrameIndex] = useState(0);

  // Determine state from input text
  useEffect(() => {
    const text = inputText.toLowerCase();
    if (text.includes('believe in you') || text.includes('good job') || text.includes('love')) {
      setState('happy');
    } else if (text.includes('hard') || text.includes('fail') || text.includes('stupid')) {
      setState('sad');
    } else {
      setState('idle');
    }
  }, [inputText]);

  // Animation loop for idle breathing
  useEffect(() => {
    if (state !== 'idle') {
      setFrameIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % petFrames.idle.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [state]);

  const currentFrames = petFrames[state];
  const currentFrame = currentFrames[frameIndex % currentFrames.length];

  return (
    <div className={`pixel-pet ${className}`} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Overlay: Sun or Cloud */}
      <AnimatePresence mode="wait">
        {state === 'happy' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 48,
              height: 48,
            }}
          >
            <PixelGrid frame={sunFrames[0]} size={48} />
          </motion.div>
        )}
        {state === 'sad' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 48,
              height: 48,
            }}
          >
            <PixelGrid frame={cloudFrames[0]} size={48} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet */}
      <motion.div
        animate={{
          y: state === 'happy' ? -8 : state === 'sad' ? 4 : 0,
          scale: state === 'happy' ? 1.05 : state === 'sad' ? 0.98 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <PixelGrid frame={currentFrame} size={PET_SIZE} />
      </motion.div>
    </div>
  );
}

export default PixelPet;