'use client';
import { useEffect, useRef } from 'react';

const HOVERABLE = 'a, button, [role="button"], label, input, select, textarea, .btn, .bento-card, .cmd-card, .tutorial-card, .community-card, .accordion-trigger, .tab-btn, .nav-link';

export default function CursorTracker() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on pointer:fine devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const ring = ringRef.current;
    const dot  = dotRef.current;
    if (!ring || !dot) return;

    let raf = 0;
    let mx = -100, my = -100;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
      dot.classList.remove('cursor-hidden');
      ring.classList.remove('cursor-hidden');
    };

    const loop = () => {
      const rx = parseFloat(ring.style.left || '0');
      const ry = parseFloat(ring.style.top  || '0');
      ring.style.left = rx + (mx - rx) * 0.18 + 'px';
      ring.style.top  = ry + (my - ry) * 0.18 + 'px';
      raf = requestAnimationFrame(loop);
    };

    const onLeave = () => { ring.classList.add('cursor-hidden');    dot.classList.add('cursor-hidden'); };
    const onEnter = () => { ring.classList.remove('cursor-hidden'); dot.classList.remove('cursor-hidden'); };
    const onDown  = () => { ring.classList.add('cursor-clicking');    dot.style.transform = 'translate(-50%,-50%) scale(0.5)'; };
    const onUp    = () => { ring.classList.remove('cursor-clicking'); dot.style.transform = 'translate(-50%,-50%) scale(1)'; };

    // Use event delegation — one listener on body, no per-element bookkeeping
    const onDelegatedEnter = (e: MouseEvent) => {
      if ((e.target as Element).closest(HOVERABLE)) ring.classList.add('cursor-hovering');
    };
    const onDelegatedLeave = (e: MouseEvent) => {
      if ((e.target as Element).closest(HOVERABLE)) ring.classList.remove('cursor-hovering');
    };

    document.addEventListener('mousemove',  onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mousedown',  onDown);
    document.addEventListener('mouseup',    onUp);
    document.body.addEventListener('mouseover',  onDelegatedEnter);
    document.body.addEventListener('mouseout',   onDelegatedLeave);

    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove',  onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mousedown',  onDown);
      document.removeEventListener('mouseup',    onUp);
      document.body.removeEventListener('mouseover',  onDelegatedEnter);
      document.body.removeEventListener('mouseout',   onDelegatedLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring cursor-hidden" aria-hidden="true" />
      <div ref={dotRef}  className="cursor-dot  cursor-hidden" aria-hidden="true" />
    </>
  );
}
