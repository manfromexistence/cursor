
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { EmojiParticle } from './emoji-particle';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-react'; // Removed InfoIcon as it's not used
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
    flame,
    sparkles,
    threeColorfulFireworks,
    threeColorfulFireworks2,
    clippy
} from '@/app/data'; // Corrected path

const TYPING_GIFS_LIST = [
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
const SPACE_GIFS_LIST = [space1, space2];
const BACKSPACE_GIF_ITEM = clippy;
const GAP_GIFS_LIST = [verticalRift, horizontalRift];


const TYPING_SPEED_WINDOW_MS = 2000; // Calculate speed over the last 2 seconds
const CHARS_FOR_WORD = 5; // Standard characters per word for WPM
const BASE_GIF_SIZE = 40; // Base size for GIFs in pixels
const GAP_TIMEOUT_MS = 1500;

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
  const spaceGifIndexRef = useRef(0);
  const gapGifIndexRef = useRef(0);
  const gapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputTimeRef = useRef(Date.now());
  const [wpm, setWpm] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const charTypedTimesRef = useRef<number[]>([]);
  const lastCaretPosRef = useRef({ x: 0, y: 0 }); // Store last known caret position

  const calculateSpeedFactor = useCallback(() => {
    const currentTime = performance.now();
    const relevantTimes = charTypedTimesRef.current.filter(
      (time) => currentTime - time <= TYPING_SPEED_WINDOW_MS
    );
    const charsInWindow = relevantTimes.length;
    const timeSpanSeconds = TYPING_SPEED_WINDOW_MS / 1000;
    const currentWpm = Math.max(0, (charsInWindow / CHARS_FOR_WORD) / (timeSpanSeconds / 60));
    return Math.min(1 + currentWpm / 30, 2.5); // Adjust scaling factor as needed
  }, []);

  const calculateCaretPosition = useCallback(() => {
    if (textareaRef.current) {
      const { top, left } = getCaretCoordinates(textareaRef.current, textareaRef.current.selectionStart);
      // The getCaretCoordinates function returns position relative to the textarea's content box.
      // We don't need to add textareaRef.current.offsetLeft or .offsetTop if the particle container
      // is a direct child of the textarea's parent and positioned relative to that parent.
      // However, since the effectsContainer is positioned absolutely within the main 'w-full max-w-2xl' div,
      // we might need to adjust based on the textarea's offset *within* that container if it's not at 0,0.
      // For simplicity and common layouts, assuming the textarea is the direct reference point for coordinates.
      return { x: left, y: top - textareaRef.current.scrollTop };
    }
    return { x: 0, y: 0 };
  }, []);
  
  const addEffect = useCallback((dataUri: string, caretX: number, caretY: number, speedFactor: number) => {
    const textareaElem = textareaRef.current;
    if (!textareaElem) return;

    const effectSize = BASE_GIF_SIZE * (0.5 + speedFactor * 0.5);
    let effectX = caretX;
    let effectY = caretY;

    // Adjust Y position to be above the cursor
    effectY = caretY - effectSize - 5; // 5px offset above the cursor

    // Ensure effect is not spawned too far up (e.g., outside the textarea top)
    if (effectY < 0) {
      effectY = 0;
    }
    
    // Adjust X position to be centered around the cursor
    effectX = caretX - (effectSize / 2);


    const newEffect: EffectState = {
      id: `${Date.now()}-${Math.random()}`,
      dataUri: dataUri,
      x: effectX, 
      y: effectY,
      speedFactor: speedFactor,
    };
    setEffects(prev => [...prev, newEffect].slice(-20)); 
  }, []);
  
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const prevText = text;
    setText(newText);
    setCharCount(newText.length);
  
    const currentTime = performance.now();
  
    if (newText.length > prevText.length) {
      charTypedTimesRef.current.push(currentTime);
    }
    charTypedTimesRef.current = charTypedTimesRef.current.filter(
      (time) => currentTime - time <= TYPING_SPEED_WINDOW_MS
    );
  
    const speedFactor = calculateSpeedFactor();
    const { x: caretX, y: caretY } = calculateCaretPosition();
    lastCaretPosRef.current = { x: caretX, y: caretY };
  
    if (newText.length > prevText.length) {
      const charTyped = newText[newText.length - 1];
      // Avoid triggering for space here, as it's handled in onKeyDown
      if (charTyped !== ' ') { 
        const gifToUse = TYPING_GIFS_LIST[typingGifIndexRef.current % TYPING_GIFS_LIST.length];
        addEffect(gifToUse, caretX, caretY, speedFactor);
        typingGifIndexRef.current = (typingGifIndexRef.current + 1) % TYPING_GIFS_LIST.length;
      }
    }
  
    // WPM calculation
    if (newText.length === 0) {
      charTypedTimesRef.current = [];
      setWpm(0);
    } else {
      const charsInWindow = charTypedTimesRef.current.length;
      const timeSpanSeconds = TYPING_SPEED_WINDOW_MS / 1000;
      const currentWpm = Math.max(0, (charsInWindow / CHARS_FOR_WORD) / (timeSpanSeconds / 60));
      setWpm(Math.round(currentWpm));
    }

    // Reset and clear the gap timer
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
    }
    lastInputTimeRef.current = Date.now(); // Update last input time
    gapTimerRef.current = setTimeout(() => {
      if (textareaRef.current && (Date.now() - lastInputTimeRef.current >= GAP_TIMEOUT_MS)) {
        const { x, y } = lastCaretPosRef.current; // Use the last known caret position
        const speedFactor = calculateSpeedFactor();
        const gifToUse = GAP_GIFS_LIST[gapGifIndexRef.current % GAP_GIFS_LIST.length];
        addEffect(gifToUse, x, y, speedFactor);
        gapGifIndexRef.current = (gapGifIndexRef.current + 1) % GAP_GIFS_LIST.length;
      }
    }, GAP_TIMEOUT_MS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
    }
    lastInputTimeRef.current = Date.now();

    if (textareaRef.current) {
      // Calculate caret position *before* the character is inserted/deleted for better accuracy
      const { x: caretX, y: caretY } = calculateCaretPosition();
      lastCaretPosRef.current = { x: caretX, y: caretY }; // Update last known caret position
      const speedFactor = calculateSpeedFactor();

      if (e.key === 'Backspace') {
        if (text.length > 0 && textareaRef.current.selectionStart > 0) {
          addEffect(BACKSPACE_GIF_ITEM, caretX, caretY, speedFactor);
        }
      } else if (e.key === ' ') {
        const gifToUse = SPACE_GIFS_LIST[spaceGifIndexRef.current % SPACE_GIFS_LIST.length];
        addEffect(gifToUse, caretX, caretY, speedFactor);
        spaceGifIndexRef.current = (spaceGifIndexRef.current + 1) % SPACE_GIFS_LIST.length;
      }
    }
  };

  const handleSelectionEvents = () => {
    // Update caret position on selection change or click
    if (textareaRef.current) {
      const { top, left } = getCaretCoordinates(textareaRef.current, textareaRef.current.selectionStart);
      const rect = textareaRef.current.getBoundingClientRect();
      lastCaretPosRef.current = {
        x: left + textareaRef.current.offsetLeft,
        y: top + textareaRef.current.offsetTop - textareaRef.current.scrollTop,
      };
    }
    // Reset and clear the gap timer if the user interacts with the textarea
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
    }
    lastInputTimeRef.current = Date.now();
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
  
  // Update lastCaretPos when text or selection changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const updateCaretPos = () => {
        const { top, left } = getCaretCoordinates(textarea, textarea.selectionStart);
        // Convert textarea-local coordinates to coordinates relative to the textarea's offsetParent
        // This assumes the effects container is a sibling or ancestor positioned relative to the same parent
        lastCaretPosRef.current = {
          x: left + textarea.offsetLeft,
          y: top + textarea.offsetTop - textarea.scrollTop,
        };
      };
      updateCaretPos(); // Initial position
      textarea.addEventListener('input', updateCaretPos);
      textarea.addEventListener('selectionchange', updateCaretPos);
      textarea.addEventListener('click', updateCaretPos);
      textarea.addEventListener('keyup', updateCaretPos);
      return () => {
        textarea.removeEventListener('input', updateCaretPos);
        textarea.removeEventListener('selectionchange', updateCaretPos);
        textarea.removeEventListener('click', updateCaretPos);
        textarea.removeEventListener('keyup', updateCaretPos);
      };
    }
  }, [text]); // Re-calculate on text change as caret position might change

  return (
    <TooltipProvider>
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative w-full">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type here and watch the magic..."
          className="w-full h-64 p-4 text-lg border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        />
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            // This div will act as the positioning parent for the EmojiParticle components
            // It needs to precisely overlay the textarea
          }}
        >
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
      </div>
      <div className="flex justify-between items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
        <div>
          WPM: <span className="font-semibold">{wpm}</span> | Chars: <span className="font-semibold">{charCount}</span>
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
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};
