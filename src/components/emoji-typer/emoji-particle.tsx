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

const EMOJI_ANIMATION_BASE_DURATION = 700; // ms, adjusted for new animation

export const EmojiParticle: React.FC<EmojiParticleProps> = ({ id, char, x, y, speedFactor, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  const animationDuration = EMOJI_ANIMATION_BASE_DURATION / Math.max(0.5, speedFactor);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(id);
    }, animationDuration);

    return () => clearTimeout(timer);
  }, [id, onComplete, animationDuration]);

  // Randomize animation parameters once per particle for variety
  const [animParams] = useState(() => ({
    translateXStart: `${(Math.random() - 0.5) * 5 * (1 + speedFactor * 0.2)}px`,
    translateYStart: `${(Math.random() - 0.5) * 5 * (1 + speedFactor * 0.2)}px`,
    scaleStart: 0.6 + speedFactor * 0.1,
    rotateStart: `${(Math.random() - 0.5) * 10 * (1 + speedFactor * 0.1)}deg`,

    translateXMid: `${(Math.random() - 0.5) * 20 * (1 + speedFactor * 0.5)}px`,
    translateYMid: `-${35 + speedFactor * 20}px`,
    scaleMid: 1.3 + speedFactor * 0.35,
    rotateMid: `${(Math.random() - 0.5) * 25 * (1 + speedFactor * 0.4)}deg`,

    translateXEnd: `${(Math.random() - 0.5) * 30 * (1 + speedFactor * 0.8)}px`,
    translateYEnd: `-${65 + speedFactor * 35}px`,
    scaleEnd: Math.max(0.1, 0.3 - speedFactor * 0.05), // Ensure scale doesn't go to 0 or negative
    rotateEnd: `${(Math.random() - 0.5) * 40 * (1 + speedFactor * 0.5)}deg`,
  }));

  if (!isVisible) {
    return null;
  }

  const style: CSSProperties = {
    left: `${x}px`,
    top: `${y}px`,
    fontSize: `${1 + speedFactor * 0.25}rem`, // Slightly larger base size for faster typing

    '--emoji-duration': `${animationDuration}ms`,
    // '--emoji-timing-function' is defined in globals.css, can be overridden here if needed

    '--emoji-translate-x-start': animParams.translateXStart,
    '--emoji-translate-y-start': animParams.translateYStart,
    '--emoji-scale-start': animParams.scaleStart,
    '--emoji-rotate-start': animParams.rotateStart,

    '--emoji-translate-x-mid': animParams.translateXMid,
    '--emoji-translate-y-mid': animParams.translateYMid,
    '--emoji-scale-mid': animParams.scaleMid,
    '--emoji-rotate-mid': animParams.rotateMid,

    '--emoji-translate-x-end': animParams.translateXEnd,
    '--emoji-translate-y-end': animParams.translateYEnd,
    '--emoji-scale-end': animParams.scaleEnd,
    '--emoji-rotate-end': animParams.rotateEnd,
  } as CSSProperties;


  return (
    <div className="emoji-particle" style={style}>
      {char}
    </div>
  );
};
