/**
 * main.js — Shared functionality across all pages
 * - Live clock in nav
 * - Scroll reveal animations
 * - Utility functions
 */

(function() {
  'use strict';

  // ============================================
  // LIVE CLOCK
  // ============================================
  function updateClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}`;
  }

  // Update immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);

  // ============================================
  // SCROLL REVEAL ANIMATIONS
  // ============================================
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');
    
    if (revealElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop observing once revealed
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));
  }

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  function initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // Number keys 0-5 for nav tabs
      if (e.key >= '0' && e.key <= '5' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isInput = activeElement.tagName === 'INPUT' || 
                       activeElement.tagName === 'TEXTAREA' ||
                       activeElement.isContentEditable;
        
        if (isInput) return;

        const tabIndex = parseInt(e.key);
        const tabs = document.querySelectorAll('.nav-tab');
        if (tabs[tabIndex]) {
          tabs[tabIndex].click();
        }
      }
    });
  }

  // ============================================
  // UTILITY: Debounce function
  // ============================================
  window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // ============================================
  // UTILITY: Throttle function
  // ============================================
  window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // ============================================
  // INITIALIZE ON DOM READY
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initSmoothScroll();
    initKeyboardNav();
  });

})();
