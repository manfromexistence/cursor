
"use client";

import React, { useState, useRef, useCallback, useEffect, CSSProperties } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { EmojiParticle } from './emoji-particle';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import getCaretCoordinates from 'textarea-caret';
import {
    atomExplosion1,
    atomExplosion2,
    atomExplosion3,
    atomExplosion4,
    atomExplosion5,
    atomExplosion6,
    atomExplosion7,
    atomExplosion8,
    atomExplosion9,
    atomExplosion10,
    magic,
    verticalRift,
    horizontalRift,
    space1,
    space2,
    clippy
} from '@/app/data';

const TYPING_GIFS = [
    magic,
    flame,
    sparkles,
    threeColorfulFireworks,
    threeColorfulFireworks2,
    atomExplosion1,
    atomExplosion2,
    atomExplosion3,
    atomExplosion4,
    atomExplosion5,
    atomExplosion6,
    atomExplosion7,
    atomExplosion8,
    atomExplosion9,
    atomExplosion10,
];
const SPACE_GIFS = [space1, space2];
const BACKSPACE_GIF = clippy;
const GAP_GIFS = [verticalRift, horizontalRift];

const TYPING_SPEED_WINDOW_MS = 2000; 
const CHARS_FOR_WORD = 5; 
const BASE_GIF_SIZE = 40;
const GAP_TIMEOUT_MS = 1500; // 1.5 seconds for a gap

interface EffectState {
  id: string;
  dataUri: string;
  x: number;
  y: number;
  speedFactor: number;
}

export const EmojiTextarea: React.FC = () => {
  const [text, setText] = useState('');
  const [effects, setEffects] = useState<EffectState[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingGifIndexRef = useRef(0);
  const gapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputTimeRef = useRef(Date.now());
  const [wpm, setWpm] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const charTypedTimesRef = useRef<number[]>([]);
  const lastCaretPositionRef = useRef({ x: 0, y: 0 });

  const calculateCaretPosition = useCallback(() => {
    if (textareaRef.current) {
      const { top, left } = getCaretCoordinates(textareaRef.current, textareaRef.current.selectionEnd);
      // Adjust for textarea's own padding and border if necessary, or use client coordinates
      const rect = textareaRef.current.getBoundingClientRect();
      // Ensure the position is relative to the viewport if the textarea is inside other positioned elements
      return { x: left + textareaRef.current.offsetLeft, y: top + textareaRef.current.offsetTop };
    }
    return { x: 0, y: 0 }; // Default if ref not available
  }, []);

  const calculateSpeedFactor = (): number => {
    const currentTime = performance.now();
    const recentPresses = charTypedTimesRef.current.filter(time => currentTime - time <= TYPING_SPEED_WINDOW_MS);
    const cps = recentPresses.length / (TYPING_SPEED_WINDOW_MS / 1000);
    let factor = cps / 5; // Normalize around 5 CPS
    factor = Math.max(0.2, Math.min(2.5, factor)); // Clamp between 0.2 and 2.5
    return factor;
  };
  
  const addEffect = (dataUri: string, caretX: number, caretY: number, speedFactor: number) => {
    const textareaElem = textareaRef.current;
    if (!textareaElem) return;

    const effectSize = BASE_GIF_SIZE * (0.5 + speedFactor * 0.5);
    let effectX = caretX;
    let effectY = caretY;
    
    const textareaRect = textareaElem.getBoundingClientRect();
    const textareaScrollTop = textareaElem.scrollTop;

    // Adjust for scroll position
    effectY -= textareaScrollTop;

    // Ensure the effect appears above the cursor if it's in the lower half
    const visibleTextareaHeight = textareaElem.clientHeight;
    if (caretY > visibleTextareaHeight / 2) {
      effectY -= effectSize; // Spawn above
    }

    // Keep within bounds (approximately)
    effectX = Math.max(0, Math.min(effectX, textareaElem.clientWidth - effectSize));
    effectY = Math.max(0, Math.min(effectY, textareaElem.clientHeight - effectSize));


    const newEffect: EffectState = {
      id: `${Date.now()}-${Math.random()}`,
      dataUri: dataUri,
      x: effectX,
      y: effectY,
      speedFactor: speedFactor,
    };
    setEffects(prev => [...prev.slice(-19), newEffect]); // Keep max 20 effects
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
    }
    lastInputTimeRef.current = Date.now();

    if (textareaRef.current) {
      const { x, y } = getCaretPositionInTextarea();
      lastCaretPositionRef.current = { x, y }; // Update last known caret position
      const speedFactor = calculateSpeedFactor();

      if (e.key === 'Backspace') {
        if (text.length > 0 && textareaRef.current.selectionStart > 0) {
          addEffect(BACKSPACE_GIF, x, y, speedFactor);
        }
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const prevText = text;
    setText(newText);
    setCharCount(newText.length);

    const currentTime = performance.now();

    if (newText.length > prevText.length) { // Character added
      charTypedTimesRef.current.push(currentTime);
    }

    charTypedTimesRef.current = charTypedTimesRef.current.filter(
      (time) => currentTime - time <= TYPING_SPEED_WINDOW_MS
    );

    const speedFactor = calculateSpeedFactor();
    const { x: caretX, y: caretY } = getCaretPositionInTextarea();
    lastCaretPositionRef.current = { x: caretX, y: caretY }; // Update on every change for accuracy

    let gifToUse: string | null = null;

    if (newText.length > prevText.length) { // Character added
      const charTyped = newText.slice(prevText.length);
      if (charTyped === ' ') { // Spacebar pressed
        gifToUse = SPACE_GIFS[Math.floor(Math.random() * SPACE_GIFS.length)];
      } else { // Regular character
        gifToUse = TYPING_GIFS_LIST[typingGifIndexRef.current % TYPING_GIFS_LIST.length];
        typingGifIndexRef.current = (typingGifIndexRef.current + 1);
      }
    }
    
    if (gifToUse) {
      addEffect(gifToUse, caretX, caretY, speedFactor);
    }

    // WPM calculation
    if (newText.length === 0) {
      charTypedTimesRef.current = [];
      setWpm(0);
    } else {
      const charsInWindow = charTypedTimesRef.current.length;
      const timeSpanSeconds = TYPING_SPEED_WINDOW_MS / 1000;
      const currentWpm = Math.max(0, (charsInWindow / CHARS_FOR_WORD) / (timeSpanSeconds / 60)); // Ensure WPM is not negative
      setWpm(Math.round(currentWpm));
    }

    // Gap timer
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
    }
    gapTimerRef.current = setTimeout(() => {
      if (textareaRef.current && document.activeElement === textareaRef.current && textareaRef.current.value.length > 0 && (Date.now() - lastInputTimeRef.current >= GAP_TIMEOUT_MS)) {
        const { x, y } = lastCaretPositionRef.current; // Use the last known caret position
        const currentSpeedFactor = calculateSpeedFactor(); 
        addEffect(GAP_GIFS[Math.floor(Math.random() * GAP_GIFS.length)], x, y, currentSpeedFactor);
      }
    }, GAP_TIMEOUT_MS); 
  };

  const removeEffect = useCallback((id: string | number) => {
    setEffects(prev => prev.filter(effect => effect.id !== id));
  }, []);

  const handleClearText = () => {
    setText('');
    setEffects([]);
    setWpm(0);
    setCharCount(0);
    charTypedTimesRef.current = [];
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handleSelectionEvents = useCallback(() => {
    if (textareaRef.current) {
        const { x, y } = getCaretCoordinates(textareaRef.current, textareaRef.current.selectionEnd);
        // Adjust for textarea's own padding and border if necessary, or use client coordinates
        const rect = textareaRef.current.getBoundingClientRect();
        lastCaretPositionRef.current = { x: left + textareaRef.current.offsetLeft, y: top + textareaRef.current.offsetTop };
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('select', handleSelectionEvents);
      textarea.addEventListener('focus', handleSelectionEvents);
      textarea.addEventListener('click', handleSelectionEvents); // For good measure
    }
    return () => {
      if (textarea) {
        textarea.removeEventListener('select', handleSelectionEvents);
        textarea.removeEventListener('focus', handleSelectionEvents);
        textarea.removeEventListener('click', handleSelectionEvents);
      }
    };
  }, [handleSelectionEvents]);


  return (
    <TooltipProvider>
    <div className="relative w-full">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-muted-foreground">
          WPM: <span className="font-semibold text-primary">{wpm}</span> | Chars: <span className="font-semibold text-primary">{charCount}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleClearText} aria-label="Clear text">
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Text</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled className="opacity-0 pointer-events-none" aria-label="Info"> {/* Placeholder for spacing */}
                <InfoIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </div>
      </div>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown} 
        onSelect={handleSelectionEvents}  
        onKeyUp={handleSelectionEvents}  
        onClick={handleSelectionEvents} 
        placeholder="Start typing here..."
        className="w-full h-72 sm:h-80 md:h-96 p-4 text-base sm:text-lg rounded-md shadow-inner resize-none focus:ring-2 focus:ring-primary transition-shadow duration-200"
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
      />
      {/* Removed measurementDivRef as textarea-caret handles this internally */}
      {effects.map(effect => (
        <EmojiParticle
          key={effect.id}
          id={effect.id}
          dataUri={effect.dataUri}
          x={effect.x}
          y={effect.y}
          speedFactor={effect.speedFactor}
          onComplete={removeEffect}
        />
      ))}
    </div>
    </TooltipProvider>
  );
};
