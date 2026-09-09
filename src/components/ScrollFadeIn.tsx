import React, { useEffect, useRef, useState } from 'react';

export interface ScrollFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in milliseconds
  duration?: number; // duration in milliseconds (default 500ms)
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  threshold?: number; // 0.0 - 1.0 (default 0.05)
  rootMargin?: string; // default '0px 0px 80px 0px'
  id?: string;
  as?: React.ElementType;
}

/**
 * Custom Hook: useIntersectionObserver
 * Tracks when a DOM element enters the viewport with native IntersectionObserver API.
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = { threshold: 0.05, rootMargin: '0px 0px 80px 0px' },
  triggerOnce: boolean = true
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If IntersectionObserver is not supported by environment, show immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const currentElem = elementRef.current;
    if (!currentElem) return;

    // Check if already in viewport
    const rect = currentElem.getBoundingClientRect();
    if (rect.top < (window.innerHeight || 800) && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          observer.unobserve(entry.target);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    }, options);

    observer.observe(currentElem);

    // Failsafe fallback
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 400);

    return () => {
      clearTimeout(timer);
      if (currentElem) {
        observer.unobserve(currentElem);
      }
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin, triggerOnce]);

  return { elementRef, isVisible };
}

/**
 * Component: ScrollFadeIn
 * Wraps dynamic components to trigger a smooth, progressive Fade-in effect on scroll
 * utilizing the browser's native Intersection Observer API with guaranteed fallback.
 */
export const ScrollFadeIn: React.FC<ScrollFadeInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 500,
  direction = 'up',
  threshold = 0.05,
  rootMargin = '0px 0px 80px 0px',
  id,
  as: Component = 'div'
}) => {
  const [hasAppeared, setHasAppeared] = useState(false);
  const domRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setHasAppeared(true);
      return;
    }

    const element = domRef.current;
    if (!element) return;

    // If already in or near viewport, trigger immediately
    const rect = element.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    if (rect.top < vh + 100 && rect.bottom > -50) {
      setHasAppeared(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAppeared(true);
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    // Guaranteed failsafe: ensure element becomes visible even if observer is delayed or skipped
    const fallbackTimer = setTimeout(() => {
      setHasAppeared(true);
    }, 400);

    return () => {
      clearTimeout(fallbackTimer);
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // Determine initial directional transform before appearing
  let transformClasses = 'translate-y-4';
  if (direction === 'down') transformClasses = '-translate-y-4';
  else if (direction === 'left') transformClasses = 'translate-x-4';
  else if (direction === 'right') transformClasses = '-translate-x-4';
  else if (direction === 'none') transformClasses = '';

  const visibilityClasses = hasAppeared
    ? 'opacity-100 translate-y-0 translate-x-0 scale-100'
    : `opacity-0 ${transformClasses} scale-[0.99]`;

  return (
    <Component
      id={id}
      ref={domRef as any}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className={`transition-all will-change-[opacity,transform] ${visibilityClasses} ${className}`}
    >
      {children}
    </Component>
  );
};
