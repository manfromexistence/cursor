
"use client";

import React, { useState, useRef, useCallback, useEffect, CSSProperties } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { EmojiParticle } from './emoji-particle';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EMOJI_LIST = ['🎉', '✨', '🚀', '💥', '💖', '🔥', '💫', '🌟', '🎈', '💯', '🥳', '🤩', '🤯', '👍', '💪'];
const TYPING_SPEED_WINDOW_MS = 2000; // Calculate speed over the last 2 seconds
const CHARS_FOR_WORD = 5; // Standard characters per word for WPM

interface EmojiState {
  id: string;
  char: string;
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
  const [emojis, setEmojis] = useState<EmojiState[]>([]);
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
        measurementDivRef.current.style.height = 'auto'; // Allow it to grow
        measurementDivRef.current.style.minHeight = textareaStyles.height;
      }
    }
  }, []);

  useEffect(() => {
    copyStyles();
    // Optional: Recopy styles on resize if textarea width could change
    window.addEventListener('resize', copyStyles);
    return () => window.removeEventListener('resize', copyStyles);
  }, [copyStyles]);


  const calculateCaretPosition = useCallback(() => {
    if (!textareaRef.current || !measurementDivRef.current) return { x: 0, y: 0 };

    const textarea = textareaRef.current;
    const measurementDiv = measurementDivRef.current;
    const selectionEnd = textarea.selectionEnd;

    // Ensure styles are current (they might change if textarea resizes etc)
    // copyStyles(); // Can be performance intensive, called on mount and resize for now

    const textBeforeCaret = text.substring(0, selectionEnd);
    
    measurementDiv.innerHTML = ''; // Clear previous
    const textNode = document.createTextNode(textBeforeCaret);
    const spanMarker = document.createElement('span');
    // The marker helps to get the position at the end of the text
    measurementDiv.appendChild(textNode);
    measurementDiv.appendChild(spanMarker);

    const textareaRect = textarea.getBoundingClientRect();
    const markerRect = spanMarker.getBoundingClientRect();
    const measurementDivRect = measurementDiv.getBoundingClientRect();

    // Position relative to textarea's content area, accounting for scroll
    // markerRect.left is relative to viewport, so subtract measurementDivRect.left (which should be same as textareaRect.left if aligned)
    // Add scrollLeft to get position within the scrollable content
    const x = (markerRect.left - measurementDivRect.left) + textarea.scrollLeft;
    // markerRect.bottom gives y-pos for baseline of line with caret. Adjust to be near caret.
    // (markerRect.top + markerRect.height / 2) - measurementDivRect.top gives y-center of marker relative to measurementDiv
    const y = (markerRect.top - measurementDivRect.top) + (markerRect.height / 2) + textarea.scrollTop;
    
    measurementDiv.innerHTML = ''; // Clean up

    if (isFinite(x) && isFinite(y)) {
      lastCaretPosRef.current = { x, y };
      return { x, y };
    }
    return lastCaretPosRef.current; // Return last known good position
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const prevTextLength = text.length;
    setText(newText);
    setCharCount(newText.length);

    const currentTime = performance.now();

    if (newText.length > prevTextLength) { // Character typed (not deleted)
      charTypedTimesRef.current.push(currentTime);
      
      // Filter timestamps outside the TYPING_SPEED_WINDOW_MS
      charTypedTimesRef.current = charTypedTimesRef.current.filter(
        time => currentTime - time <= TYPING_SPEED_WINDOW_MS
      );

      const charsInWindow = charTypedTimesRef.current.length;
      const timeSpanSeconds = TYPING_SPEED_WINDOW_MS / 1000;
      
      // Calculate WPM
      const currentWpm = (charsInWindow / CHARS_FOR_WORD) / (timeSpanSeconds / 60);
      setWpm(Math.round(currentWpm));
      
      // SpeedFactor determines animation intensity. Max speedFactor of 2.5
      const speedFactor = Math.min(1 + charsInWindow / 10, 2.5); 

      // Always show emoji when a character is typed
      const { x: caretX, y: caretY } = lastCaretPosRef.current;

      const newEmoji: EmojiState = {
        id: `${Date.now()}-${Math.random()}`,
        char: EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)],
        x: caretX + Math.random() * 20 - 10, // Add some jitter
        y: caretY - 10 + Math.random() * 10 - 5,
        speedFactor: speedFactor,
      };
      setEmojis(prev => [...prev, newEmoji].slice(-15)); // Limit max concurrent emojis
      
    } else { // Text deleted or no change in length
      if (newText.length === 0) { // Cleared text
        charTypedTimesRef.current = [];
        setWpm(0);
      }
    }
  };
  
  // Update caret position on selection change or key up
  const handleSelectionEvents = () => {
    // Using requestAnimationFrame to ensure calculations happen after DOM updates
    requestAnimationFrame(() => {
      calculateCaretPosition();
    });
  };

  useEffect(() => {
    // This effect ensures calculateCaretPosition is called after text state updates and DOM reflects it.
    // However, for immediate emoji placement, lastCaretPosRef.current is used.
    // This effect primarily keeps lastCaretPosRef.current up-to-date.
    calculateCaretPosition();
  }, [text, calculateCaretPosition]);


  const removeEmoji = useCallback((id: string | number) => {
    setEmojis(prev => prev.filter(emoji => emoji.id !== id));
  }, []);

  const handleClearText = () => {
    setText('');
    setEmojis([]);
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
        onSelect={handleSelectionEvents} // Covers mouse selection, keyboard navigation
        onKeyUp={handleSelectionEvents}  // Covers keyboard input that moves caret
        onClick={handleSelectionEvents}  // Covers clicks that move caret
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
          top: '0', // Aligned with textarea wrapper for correct offset calculations
          left: '0',
          visibility: 'hidden',
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap', // Match textarea
          wordWrap: 'break-word',   // Match textarea
        }}
      />
      {emojis.map(emoji => (
        <EmojiParticle
          key={emoji.id}
          id={emoji.id}
          char={emoji.char}
          x={emoji.x}
          y={emoji.y}
          speedFactor={emoji.speedFactor}
          onComplete={removeEmoji}
        />
      ))}
    </div>
    </TooltipProvider>
  );
};
