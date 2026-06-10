import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { UseCase } from '../../types';

interface TestimonialCarouselProps {
  cases: UseCase[];
}

export default function TestimonialCarousel({
  cases,
}: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const prefersReducedMotion = useReducedMotion();

  const total = cases.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % total) + total) % total);
    },
    [total],
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(goNext, 5000);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, goNext]);

  const currentCase = cases[current];

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCase.id}
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 40 }
          }
          animate={{ opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -40 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="bg-surface border border-primary/10 rounded-xl p-6 md:p-8"
        >
          {/* Industry badge */}
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
            {currentCase.industry}
          </div>

          {/* Title */}
          <h3 className="text-xl md:text-2xl font-bold text-text mb-3">
            {currentCase.title}
          </h3>

          {/* Description */}
          <p className="text-text-secondary text-sm md:text-base leading-relaxed mb-6">
            {currentCase.description}
          </p>

          {/* Result metric */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5 text-accent flex-shrink-0"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-accent font-semibold text-sm">
              {currentCase.result}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {cases.map((c, i) => (
            <button
              key={c.id}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-primary w-6'
                  : 'bg-surface border border-text-secondary/30 hover:border-primary/50'
              }`}
              aria-label={`Ir al caso ${i + 1}: ${c.title}`}
            />
          ))}
        </div>

        {/* Prev/Next buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-2 rounded-lg bg-surface border border-text-secondary/20 text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
            aria-label="Caso anterior"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-lg bg-surface border border-text-secondary/20 text-text-secondary hover:text-primary hover:border-primary/50 transition-colors"
            aria-label="Caso siguiente"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
