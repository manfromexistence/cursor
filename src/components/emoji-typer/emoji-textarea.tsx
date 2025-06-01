
"use client";

import React, { useState, useRef, useCallback, useEffect, CSSProperties } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { EmojiParticle } from './emoji-particle';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
} from '@/app/data';

const GIF_EFFECT_LIST = [
    atomExplosion1, atomExplosion2, atomExplosion3, atomExplosion4, atomExplosion5,
    atomExplosion6, atomExplosion7, atomExplosion8, atomExplosion9, atomExplosion10,
    magic, verticalRift, horizontalRift, space1, space2, flame, sparkles,
    threeColorfulFireworks, threeColorfulFireworks2, clippy
];

const TYPING_SPEED_WINDOW_MS = 2000; // Calculate speed over the last 2 seconds
const CHARS_FOR_WORD = 5; // Standard characters per word for WPM

interface EffectState {
  id: string;
  dataUri: string;
  x: number;
  y: number;
  speedFactor: number;
}

const MIRROR_STYLES: (keyof CSSStyleDeclaration)[] = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
  'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'width', 'boxSizing', 'whiteSpace', 'wordWrap', 'wordBreak', 'textAlign', 'textIndent'
];

export const EmojiTextarea: React.FC = () => {
  const [text, setText] = useState('');
  const [effects, setEffects] = useState<EffectState[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measurementDivRef = useRef<HTMLDivElement>(null);
  const lastCaretPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const charTypedTimesRef = useRef<number[]>([]);
  const [wpm, setWpm] = useState(0);
  const [charCount, setCharCount] = useState(0);
  
  const copyStyles = useCallback(() => {
    if (textareaRef.current && measurementDivRef.current) {
      const textareaStyles = window.getComputedStyle(textareaRef.current);
      MIRROR_STYLES.forEach(prop => {
        if (measurementDivRef.current) {
          measurementDivRef.current.style[prop as any] = textareaStyles[prop];
        }
      });
      if (measurementDivRef.current) {
        measurementDivRef.current.style.height = 'auto'; 
        measurementDivRef.current.style.minHeight = textareaStyles.height;
      }
    }
  }, []);

  useEffect(() => {
    copyStyles();
    window.addEventListener('resize', copyStyles);
    return () => window.removeEventListener('resize', copyStyles);
  }, [copyStyles]);


  const calculateCaretPosition = useCallback(() => {
    if (!textareaRef.current || !measurementDivRef.current) return { x: 0, y: 0 };

    const textarea = textareaRef.current;
    const measurementDiv = measurementDivRef.current;
    const selectionEnd = textarea.selectionEnd;

    const textBeforeCaret = text.substring(0, selectionEnd);
    
    measurementDiv.innerHTML = ''; 
    const textNode = document.createTextNode(textBeforeCaret);
    const spanMarker = document.createElement('span');
    measurementDiv.appendChild(textNode);
    measurementDiv.appendChild(spanMarker);

    const textareaRect = textarea.getBoundingClientRect();
    const markerRect = spanMarker.getBoundingClientRect();
    const measurementDivRect = measurementDiv.getBoundingClientRect();

    const x = (markerRect.left - measurementDivRect.left) + textarea.scrollLeft;
    const y = (markerRect.top - measurementDivRect.top) + (markerRect.height / 2) + textarea.scrollTop;
    
    measurementDiv.innerHTML = ''; 

    if (isFinite(x) && isFinite(y)) {
      lastCaretPosRef.current = { x, y };
      return { x, y };
    }
    return lastCaretPosRef.current; 
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const prevTextLength = text.length;
    setText(newText);
    setCharCount(newText.length);

    const currentTime = performance.now();

    if (newText.length > prevTextLength) { 
      charTypedTimesRef.current.push(currentTime);
      
      charTypedTimesRef.current = charTypedTimesRef.current.filter(
        time => currentTime - time <= TYPING_SPEED_WINDOW_MS
      );

      const charsInWindow = charTypedTimesRef.current.length;
      const timeSpanSeconds = TYPING_SPEED_WINDOW_MS / 1000;
      
      const currentWpm = (charsInWindow / CHARS_FOR_WORD) / (timeSpanSeconds / 60);
      setWpm(Math.round(currentWpm));
      
      const speedFactor = Math.min(1 + charsInWindow / 10, 2.5); 

      const { x: caretX, y: caretY } = lastCaretPosRef.current;

        const newEffect: EffectState = {
          id: `${Date.now()}-${Math.random()}`,
          dataUri: GIF_EFFECT_LIST[Math.floor(Math.random() * GIF_EFFECT_LIST.length)],
          x: caretX + Math.random() * 20 - 10, 
          y: caretY - 20 + Math.random() * 10 - 5,
          speedFactor: speedFactor,
        };
        setEffects(prev => [...prev, newEffect].slice(-10)); 
      
    } else { 
      if (newText.length === 0) { 
        charTypedTimesRef.current = [];
        setWpm(0);
      }
    }
  };
  
  const handleSelectionEvents = () => {
    requestAnimationFrame(() => {
      calculateCaretPosition();
    });
  };

  useEffect(() => {
    calculateCaretPosition();
  }, [text, calculateCaretPosition]);


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
        onSelect={handleSelectionEvents} 
        onKeyUp={handleSelectionEvents}  
        onClick={handleSelectionEvents}  
        onFocus={handleSelectionEvents} 
        placeholder="Start typing here..."
        className="w-full h-72 sm:h-80 md:h-96 p-4 text-base sm:text-lg rounded-md shadow-inner resize-none focus:ring-2 focus:ring-primary transition-shadow duration-200"
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
      />
      <div
        ref={measurementDivRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '0', 
          left: '0',
          visibility: 'hidden',
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap', 
          wordWrap: 'break-word',   
        }}
      />
      {effects.map(effect => (
        <EmojiParticle
          key={effect.id}
          id={effect.id}
          imageDataUri={effect.dataUri}
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
