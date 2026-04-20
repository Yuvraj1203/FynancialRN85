import {CustomText} from '@/components/atoms';
import React, {useEffect, useState} from 'react';

const DOTS = ['.', '..', '...'];

type DotsProps = {
  mode: 'dots';
  baseText?: string; // text before the cycling dots, e.g. "Loading"
  speed?: number;    // ms between dot steps (default 400)
  style?: any;
};

type TypingProps = {
  mode: 'typing';
  text: string;   // full text to reveal character by character
  speed?: number; // ms per character (default 50)
  style?: any;
};

type TypingTextProps = DotsProps | TypingProps;

const TypingText: React.FC<TypingTextProps> = props => {
  // ── Dots mode state ──────────────────────────────────────────────────────
  const [dotIndex, setDotIndex] = useState(0);

  // ── Typing mode state ────────────────────────────────────────────────────
  const [displayed, setDisplayed] = useState('');

  // ── Dots effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (props.mode !== 'dots') return;
    const interval = setInterval(() => {
      setDotIndex(prev => (prev + 1) % DOTS.length);
    }, props.speed ?? 400);
    return () => clearInterval(interval);
  }, [props.mode, props.speed]);

  // ── Typing effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (props.mode !== 'typing') return;
    const fullText = props.text; // snapshot text at effect creation time
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i >= fullText.length) {
        clearInterval(interval);
        return;
      }
      // Capture the character NOW before i is incremented, so the
      // setState updater closure always closes over the correct value
      // even if React batches multiple ticks before rendering.
      const ch = fullText[i++];
      setDisplayed(prev => prev + ch);
    }, props.speed ?? 50);
    return () => clearInterval(interval);
  }, [props.mode, (props as TypingProps).text, props.speed]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (props.mode === 'dots') {
    const base = props.baseText ?? 'Loading';
    return <CustomText style={props.style}>{base + DOTS[dotIndex]}</CustomText>;
  }

  return <CustomText style={props.style}>{displayed}</CustomText>;
};

export default TypingText;
