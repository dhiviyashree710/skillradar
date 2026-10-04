import React, { useEffect, useRef, useState } from "react";

/** Fades + slides a section up once it scrolls into view, then stays —
 * uses IntersectionObserver so it costs nothing until the section is near
 * the viewport. Wrap any landing-page section in this instead of relying
 * on the mount-time fade (which only fires once, on first paint). */
export default function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`sr-reveal ${visible ? "sr-reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
