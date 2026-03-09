"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseZoomPanOptions {
  minScale?: number;
  maxScale?: number;
}

export function useZoomPan({ minScale = 0.25, maxScale = 5 }: UseZoomPanOptions = {}) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const pinchRef = useRef({ initialDistance: 0, initialScale: 1, initialCenter: { x: 0, y: 0 }, initialTranslate: { x: 0, y: 0 } });
  const containerRef = useRef<HTMLDivElement>(null);

  const clampScale = useCallback(
    (s: number) => Math.min(maxScale, Math.max(minScale, s)),
    [minScale, maxScale]
  );

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => clampScale(+(s + 0.25).toFixed(2)));
  }, [clampScale]);

  const zoomOut = useCallback(() => {
    setScale((s) => clampScale(+(s - 0.25).toFixed(2)));
  }, [clampScale]);

  // Mouse drag pan (when zoomed)
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
    },
    [scale, translate]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const { x, y, tx, ty } = dragStartRef.current;
      setTranslate({
        x: tx + (e.clientX - x),
        y: ty + (e.clientY - y),
      });
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom (no Ctrl needed) - must attach via ref for passive:false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => clampScale(prev - e.deltaY * 0.001));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [clampScale]);

  // Double click toggle 1x <-> 2x
  const onDoubleClick = useCallback(() => {
    if (scale > 1.1) {
      resetZoom();
    } else {
      setScale(2);
      setTranslate({ x: 0, y: 0 });
    }
  }, [scale, resetZoom]);

  // Pinch zoom (touch)
  const getTouchDistance = (touches: React.TouchList | TouchList) => {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.hypot(dx, dy);
  };

  const getTouchCenter = (touches: React.TouchList | TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchRef.current = {
          initialDistance: getTouchDistance(e.touches),
          initialScale: scale,
          initialCenter: getTouchCenter(e.touches),
          initialTranslate: { ...translate },
        };
      } else if (e.touches.length === 1 && scale > 1) {
        // Single finger drag when zoomed
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          tx: translate.x,
          ty: translate.y,
        };
      }
    },
    [scale, translate]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const newDist = getTouchDistance(e.touches);
        const ratio = newDist / pinchRef.current.initialDistance;
        const newScale = clampScale(pinchRef.current.initialScale * ratio);
        setScale(newScale);

        // Pan with pinch center movement
        const newCenter = getTouchCenter(e.touches);
        setTranslate({
          x: pinchRef.current.initialTranslate.x + (newCenter.x - pinchRef.current.initialCenter.x),
          y: pinchRef.current.initialTranslate.y + (newCenter.y - pinchRef.current.initialCenter.y),
        });
      } else if (e.touches.length === 1 && isDragging) {
        const { x, y, tx, ty } = dragStartRef.current;
        setTranslate({
          x: tx + (e.touches[0].clientX - x),
          y: ty + (e.touches[0].clientY - y),
        });
      }
    },
    [isDragging, clampScale]
  );

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const transformStyle = {
    transform: `scale(${scale}) translate(${translate.x / (scale || 1)}px, ${translate.y / (scale || 1)}px)`,
    transition: isDragging ? "none" : "transform 0.15s ease-out",
  };

  return {
    scale,
    setScale: (s: number) => setScale(clampScale(s)),
    translate,
    isDragging,
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave: onMouseUp,
    onDoubleClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    transformStyle,
    cursorStyle: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
  };
}
