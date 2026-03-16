/**
 * home.js — Home page specific functionality
 * - Terminal typewriter animation
 * - Post table row navigation
 */

(function() {
  'use strict';

  // ============================================
  // TERMINAL TYPEWRITER ANIMATION
  // ============================================
  function initTerminalAnimation() {
    const terminalBody = document.getElementById('terminal-body');
    if (!terminalBody) return;

    const lines = terminalBody.querySelectorAll('.terminal-line');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroCta = document.getElementById('hero-cta');

    // Stagger the reveal of terminal lines
    const lineDelays = [300, 800, 1300, 1700, 2100, 2500, 2800, 3100, 3400, 3700];

    lines.forEach((line, index) => {
      const delay = lineDelays[index] || (index * 300);
      setTimeout(() => {
        line.classList.add('visible');
      }, delay);
    });

    // Show subtitle and CTA after terminal animation
    const totalAnimationTime = lineDelays[lineDelays.length - 1] + 500;

    setTimeout(() => {
      if (heroSubtitle) heroSubtitle.classList.add('visible');
    }, totalAnimationTime);

    setTimeout(() => {
      if (heroCta) heroCta.classList.add('visible');
    }, totalAnimationTime + 200);
  }

  // ============================================
  // POST TABLE ROW CLICKS
  // ============================================
  function initPostTableNavigation() {
    const postsTable = document.getElementById('posts-table');
    if (!postsTable) return;

    const rows = postsTable.querySelectorAll('tbody tr[data-href]');

    rows.forEach(row => {
      row.addEventListener('click', () => {
        const href = row.getAttribute('data-href');
        if (href && href !== '#') {
          window.location.href = href;
        }
      });

      // Keyboard accessibility
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'link');

      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const href = row.getAttribute('data-href');
          if (href && href !== '#') {
            window.location.href = href;
          }
        }
      });
    });
  }

  // ============================================
  // INITIALIZE ON DOM READY
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    initTerminalAnimation();
    initPostTableNavigation();
  });

})();
