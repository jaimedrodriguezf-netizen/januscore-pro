import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { BusinessUnit } from '../../types';

interface BusinessUnitCardProps {
  unit: BusinessUnit;
  index: number;
  key?: string;
}

const colorMap = {
  primary: {
    border: 'border-primary/30',
    glow: 'shadow-primary/20',
    bg: 'bg-primary/10',
    text: 'text-primary',
    pill: 'bg-primary/20 text-primary',
  },
  secondary: {
    border: 'border-secondary/30',
    glow: 'shadow-secondary/20',
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    pill: 'bg-secondary/20 text-secondary',
  },
  accent: {
    border: 'border-accent/30',
    glow: 'shadow-accent/20',
    bg: 'bg-accent/10',
    text: 'text-accent',
    pill: 'bg-accent/20 text-accent',
  },
};

const iconSvgs: Record<string, React.JSX.Element> = {
  cpu: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-8 h-8"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
      <path
        d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"
        strokeLinecap="round"
      />
    </svg>
  ),
  eye: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-8 h-8"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  monitor: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-8 h-8"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  ),
};

export default function BusinessUnitCard({
  unit,
  index,
}: BusinessUnitCardProps) {
  const colors = colorMap[unit.color];
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.5,
        delay: prefersReducedMotion ? 0 : index * 0.15,
        ease: 'easeOut',
      }}
      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      className={`relative bg-surface border ${colors.border} rounded-xl p-6 md:p-8 
        transition-shadow duration-300 cursor-default
        hover:shadow-lg ${colors.glow}
        ${prefersReducedMotion ? '' : 'hover:border-opacity-60'}`}
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none ${colors.bg}`}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div className={`mb-4 ${colors.text}`}>
          {iconSvgs[unit.icon] || (
            <div className="w-8 h-8 rounded bg-surface border border-text-secondary/20" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text mb-2">{unit.title}</h3>

        {/* Description */}
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          {unit.description}
        </p>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-2">
          {unit.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${colors.pill}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
