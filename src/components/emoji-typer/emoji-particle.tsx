
"use client";

import type { CSSProperties } from 'react';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface EmojiParticleProps {
  id: string | number;
  imageDataUri: string; // Changed from char to imageDataUri
  x: number;
  y: number;
  speedFactor: number; 
  onComplete: (id: string | number) => void;
}

const EMOJI_ANIMATION_BASE_DURATION = 700; 
const BASE_GIF_SIZE = 40; // Base size for GIFs in pixels

export const EmojiParticle: React.FC<EmojiParticleProps> = ({ id, imageDataUri, x, y, speedFactor, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  const animationDuration = EMOJI_ANIMATION_BASE_DURATION / Math.max(0.5, speedFactor);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(id);
    }, animationDuration);

    return () => clearTimeout(timer);
  }, [id, onComplete, animationDuration]);

  const [animParams] = useState(() => ({
    translateXStart: `${(Math.random() - 0.5) * 5 * (1 + speedFactor * 0.2)}px`,
    translateYStart: `${(Math.random() - 0.5) * 5 * (1 + speedFactor * 0.2)}px`,
    scaleStart: 0.4 + speedFactor * 0.1, // GIFs might need smaller start scale
    rotateStart: `${(Math.random() - 0.5) * 15 * (1 + speedFactor * 0.1)}deg`,

    translateXMid: `${(Math.random() - 0.5) * 25 * (1 + speedFactor * 0.5)}px`,
    translateYMid: `-${40 + speedFactor * 25}px`,
    scaleMid: 1.0 + speedFactor * 0.4, // Adjusted mid scale
    rotateMid: `${(Math.random() - 0.5) * 30 * (1 + speedFactor * 0.4)}deg`,

    translateXEnd: `${(Math.random() - 0.5) * 35 * (1 + speedFactor * 0.8)}px`,
    translateYEnd: `-${70 + speedFactor * 40}px`,
    scaleEnd: Math.max(0.1, 0.2 - speedFactor * 0.05), 
    rotateEnd: `${(Math.random() - 0.5) * 45 * (1 + speedFactor * 0.5)}deg`,
  }));

  if (!isVisible) {
    return null;
  }

  const currentGifSize = BASE_GIF_SIZE * (0.8 + speedFactor * 0.2); // GIFs get slightly larger with speed

  const style: CSSProperties = {
    left: `${x - currentGifSize / 2}px`, // Adjust x, y to center the GIF
    top: `${y - currentGifSize / 2}px`,
    width: `${currentGifSize}px`,
    height: `${currentGifSize}px`,
    position: 'absolute',
    userSelect: 'none',
    pointerEvents: 'none',
    transformOrigin: 'center center',
    animation: `emojiPopAnimation var(--emoji-duration, 0.7s) var(--emoji-timing-function, cubic-bezier(0.175, 0.885, 0.32, 1.275)) forwards`,

    '--emoji-duration': `${animationDuration}ms`,
    
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
    <div style={style} className="emoji-particle-gif"> {/* Added a class for potential specific GIF styling */}
      <Image src={imageDataUri} alt="typing effect" width={currentGifSize} height={currentGifSize} unoptimized />
    </div>
  );
};
