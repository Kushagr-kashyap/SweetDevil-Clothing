"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Core, { type CoreConfig } from "smooothy";
import gsap from "gsap";

export function useSmooothy(config: Partial<CoreConfig> = {}) {
  const [slider, setSlider] = useState<Core | null>(null);
  const instanceRef = useRef<Core | null>(null);
  const tickRef = useRef<(() => void) | null>(null);
  const configRef = useRef(config);

  // Stable ref callback: only creates the slider once, never on re-render.
  const ref = useCallback((node: HTMLElement | null) => {
    if (node && !instanceRef.current) {
      const instance = new Core(node, configRef.current);
      const tick = instance.update.bind(instance);
      gsap.ticker.add(tick);
      instanceRef.current = instance;
      tickRef.current = tick;
      setSlider(instance);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) gsap.ticker.remove(tickRef.current);
      instanceRef.current?.destroy();
      instanceRef.current = null;
      tickRef.current = null;
    };
  }, []);

  return { ref, slider };
}
