import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { NavLink, SocialLink } from '../../types';

interface MobileNavProps {
  links: NavLink[];
  email: string;
  phone: string;
  socialLinks: SocialLink[];
}

export default function MobileNav({
  links,
  email,
  phone,
  socialLinks,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // SSR safety for Portals
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format WhatsApp URL
  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola Janus Core, me interesa un proyecto.')}`;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        hamburgerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus trap when open
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    document.addEventListener('keydown', handleTab);
    // Focus first link
    firstFocusable?.focus();

    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      setIsOpen(false);

      // Small delay to let the drawer close before scrolling
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);

      hamburgerRef.current?.focus();
    },
    [],
  );

  const transitionProps = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, damping: 30, stiffness: 300 };

  const containerVariants = {
    closed: { x: '100%' },
    open: {
      x: 0,
      transition: {
        ...transitionProps,
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, x: 20 },
    open: { opacity: 1, x: 0 },
  };

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-md"
            onClick={() => {
              setIsOpen(false);
              hamburgerRef.current?.focus();
            }}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.nav
            ref={drawerRef}
            variants={containerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 z-[101] h-full w-full sm:w-80 bg-surface/90 backdrop-blur-xl border-l border-white/10 
              shadow-2xl flex flex-col overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navegación móvil"
          >
            <div className="flex flex-col h-full pt-14 px-5 overflow-y-auto overscroll-contain">
              {/* Close Button Inside Drawer for UX */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-text-secondary"
                aria-label="Cerrar menú"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>

              {/* Menu Section */}
              <motion.div variants={itemVariants} className="mb-2">
                <span className="text-primary font-bold tracking-widest text-[9px] uppercase opacity-50">
                  Menú
                </span>
              </motion.div>

              <div className="flex flex-col mb-6">
                {links.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    variants={itemVariants}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="block py-1.5 text-lg font-bold text-text hover:text-primary transition-all duration-300 border-b border-white/5 last:border-0"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>

              {/* Contact Section */}
              <motion.div
                variants={itemVariants}
                className="mb-3 pt-4 border-t border-white/5"
              >
                <span className="text-primary font-bold tracking-widest text-[9px] uppercase opacity-50">
                  Contacto
                </span>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5 mb-5">
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 text-text-secondary hover:text-primary transition-colors group"
                >
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium truncate">{email}</span>
                </a>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 text-text-secondary hover:text-primary transition-colors group"
                >
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">{phone}</span>
                </a>
              </motion.div>

              {/* WhatsApp Button */}
              <motion.div variants={itemVariants} className="mb-6">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] text-bg font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#25D366]/20 text-[11px]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  WhatsApp Directo
                </a>
              </motion.div>

              {/* Social Links Footer */}
              <motion.div
                variants={itemVariants}
                className="mt-auto pt-4 pb-6 border-t border-white/5 flex items-center justify-between social-links-footer"
              >
                <div className="flex gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-all"
                      aria-label={social.label}
                    >
                      {social.label === 'GitHub' && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                      )}
                      {social.label === 'LinkedIn' && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                          <rect x="2" y="9" width="4" height="12"></rect>
                          <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                      )}
                      {(social.label === 'Twitter / X' ||
                        social.label === 'Twitter') && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-text-secondary uppercase tracking-widest leading-tight">
                    Bits, Átomos
                    <br />& Inteligencia
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Hamburger button */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-12 h-12 flex items-center justify-center rounded-xl
          bg-surface border border-white/10 text-text hover:text-primary
          shadow-2xl shadow-black/50 transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={isOpen}
      >
        <div className="w-6 h-5 relative flex flex-col justify-between">
          <span
            className={`block h-0.5 w-full bg-primary rounded transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-[9px]' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-primary rounded transition-all duration-300 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-primary rounded transition-all duration-300 ${
              isOpen ? '-rotate-45 -translate-y-[9px]' : ''
            }`}
          />
        </div>
      </button>

      {/* Render the drawer in a portal to avoid header clipping/filter issues */}
      {mounted && createPortal(menuContent, document.body)}
    </>
  );
}
