import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import type { ProcessStep } from '../../types';

interface ProcessTimelineProps {
  steps: ProcessStep[];
  key?: string;
}

const iconSvgs: Record<string, React.JSX.Element> = {
  radar: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-6 h-6"
    >
      <path d="M12 2a10 10 0 1010 10" strokeLinecap="round" />
      <path d="M12 6a6 6 0 106 6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  brain: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-6 h-6"
    >
      <path d="M12 3a4 4 0 00-4 4c0 1.5.5 2.5 1.5 3.5L8 16h8l-1.5-5.5C15.5 9.5 16 8.5 16 7a4 4 0 00-4-4z" />
      <path d="M9 16v3a2 2 0 002 2h2a2 2 0 002-2v-3" />
    </svg>
  ),
  zap: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-6 h-6"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10" />
    </svg>
  ),
};

export default function ProcessTimeline({ steps }: ProcessTimelineProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();

  const lineProgress = isInView || prefersReducedMotion ? 1 : 0;

  return (
    <div ref={sectionRef} className="relative">
      {/* Desktop: horizontal layout */}
      <div className="hidden md:flex items-start justify-between relative">
        {/* Connecting line background */}
        <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-surface">
          {/* Animated fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-secondary to-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: lineProgress }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
            style={{ transformOrigin: 'left' }}
          />
        </div>

        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }
            }
            animate={
              isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : {}
            }
            transition={{
              duration: 0.5,
              delay: prefersReducedMotion ? 0 : 0.3 + index * 0.2,
            }}
            className="flex flex-col items-center text-center relative z-10 flex-1 px-4"
          >
            {/* Circle with icon */}
            <div className="w-16 h-16 rounded-full bg-surface border border-primary/30 flex items-center justify-center text-primary mb-4">
              {iconSvgs[step.icon] || (
                <span className="text-xl font-bold">{step.number}</span>
              )}
            </div>

            {/* Step title */}
            <h3 className="text-lg font-bold text-text mb-2">{step.title}</h3>

            {/* Description */}
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Mobile: vertical layout */}
      <div className="md:hidden relative">
        {/* Vertical connecting line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-surface">
          <motion.div
            className="w-full bg-gradient-to-b from-primary via-secondary to-accent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: lineProgress }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
            style={{ transformOrigin: 'top' }}
          />
        </div>

        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }
            }
            animate={
              isInView || prefersReducedMotion ? { opacity: 1, x: 0 } : {}
            }
            transition={{
              duration: 0.5,
              delay: prefersReducedMotion ? 0 : 0.2 + index * 0.2,
            }}
            className="flex items-start gap-6 mb-10 last:mb-0 relative z-10"
          >
            {/* Circle with icon */}
            <div className="w-16 h-16 rounded-full bg-surface border border-primary/30 flex-shrink-0 flex items-center justify-center text-primary">
              {iconSvgs[step.icon] || (
                <span className="text-xl font-bold">{step.number}</span>
              )}
            </div>

            {/* Content */}
            <div className="pt-3">
              <h3 className="text-lg font-bold text-text mb-1">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
