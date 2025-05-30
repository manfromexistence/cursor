"use client";

import type { CSSProperties } from 'react';
import React, { useEffect, useState } from 'react';

interface EmojiParticleProps {
  id: string | number;
  char: string;
  x: number;
  y: number;
  speedFactor: number; // Affects animation
  onComplete: (id: string | number) => void;
}

const EMOJI_ANIMATION_BASE_DURATION = 600; // ms

export const EmojiParticle: React.FC<EmojiParticleProps> = ({ id, char, x, y, speedFactor, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const duration = EMOJI_ANIMATION_BASE_DURATION / Math.max(0.5, speedFactor); // Faster speed = shorter duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onComplete, speedFactor]);

  if (!isVisible) {
    return null;
  }

  const style: CSSProperties = {
    left: `${x}px`,
    top: `${y}px`,
    fontSize: `${1 + speedFactor * 0.2}rem`, // Slightly larger for faster typing
    '--emoji-duration': `${EMOJI_ANIMATION_BASE_DURATION / Math.max(0.5, speedFactor)}ms`,
    '--emoji-initial-scale': `${1 + speedFactor * 0.1}`,
    '--emoji-final-scale': `${1.2 + speedFactor * 0.2}`,
    '--emoji-final-y': `-${20 + speedFactor * 10}px`, // Float higher if faster
  } as CSSProperties;


  return (
    <div className="emoji-particle" style={style}>
      {char}
    </div>
  );
};
