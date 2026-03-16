/**
 * post.js — Blog post page functionality
 * - Table of contents generation & scroll-spy
 * - Reading progress bar
 * - Code copy buttons
 * - Share link copy
 */

(function() {
  'use strict';

  // ============================================
  // TABLE OF CONTENTS GENERATION
  // ============================================
  function generateTOC() {
    const tocList = document.getElementById('toc-list');
    const articleBody = document.querySelector('.article-body');
    
    if (!tocList || !articleBody) return;

    const headings = articleBody.querySelectorAll('h2, h3');
    let h2Counter = 0;
    let h3Counter = 0;

    headings.forEach((heading, index) => {
      // Ensure heading has an ID
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }

      const li = document.createElement('li');
      li.className = 'toc-item';
      
      if (heading.tagName === 'H2') {
        h2Counter++;
        h3Counter = 0;
        li.innerHTML = `
          <a href="#${heading.id}" class="toc-link">
            <span class="toc-num">0${h2Counter}</span> ${getHeadingText(heading)}
          </a>
        `;
      } else {
        h3Counter++;
        li.classList.add('sub');
        li.innerHTML = `
          <a href="#${heading.id}" class="toc-link">
            <span class="toc-num">${h2Counter}.${h3Counter}</span> ${getHeadingText(heading)}
          </a>
        `;
      }

      tocList.appendChild(li);
    });
  }

  function getHeadingText(heading) {
    // Get text without the ## or ### prefix (if added via CSS)
    return heading.textContent.replace(/^#+ /, '').trim();
  }

  // ============================================
  // TOC SCROLL-SPY
  // ============================================
  function initScrollSpy() {
    const tocItems = document.querySelectorAll('.toc-item');
    const articleBody = document.querySelector('.article-body');
    
    if (tocItems.length === 0 || !articleBody) return;

    const headings = articleBody.querySelectorAll('h2, h3');
    
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          
          // Remove active from all
          tocItems.forEach(item => item.classList.remove('active'));
          
          // Add active to matching item
          const activeLink = document.querySelector(`.toc-link[href="#${id}"]`);
          if (activeLink) {
            activeLink.closest('.toc-item').classList.add('active');
          }
        }
      });
    }, observerOptions);

    headings.forEach(heading => observer.observe(heading));
  }

  // ============================================
  // READING PROGRESS BAR
  // ============================================
  function initReadingProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    const article = document.querySelector('.article-body');
    
    if (!progressFill || !article) return;

    function updateProgress() {
      const articleRect = article.getBoundingClientRect();
      const articleTop = articleRect.top + window.scrollY;
      const articleHeight = articleRect.height;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Calculate how far we've scrolled through the article
      const start = articleTop - windowHeight;
      const end = articleTop + articleHeight;
      const current = scrollY;

      let progress = ((current - start) / (end - start)) * 100;
      progress = Math.max(0, Math.min(100, progress));

      progressFill.style.width = `${progress}%`;
      if (progressPercent) {
        progressPercent.textContent = `${Math.round(progress)}%`;
      }
    }

    window.addEventListener('scroll', throttle(updateProgress, 50));
    updateProgress(); // Initial call
  }

  // ============================================
  // CODE COPY BUTTONS
  // ============================================
  function initCodeCopy() {
    const copyButtons = document.querySelectorAll('.code-copy');

    copyButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const codeBlock = btn.closest('.code-block');
        const codeBody = codeBlock?.querySelector('.code-body');
        
        if (!codeBody) return;

        // Extract text from code lines
        const codeLines = codeBody.querySelectorAll('.code-line-content');
        const codeText = Array.from(codeLines)
          .map(line => line.textContent)
          .join('\n');

        try {
          await navigator.clipboard.writeText(codeText);
          
          // Visual feedback
          const originalText = btn.textContent;
          btn.textContent = 'copied!';
          btn.classList.add('copied');
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  }

  // ============================================
  // SHARE LINK COPY
  // ============================================
  function initShareCopy() {
    const copyLinkBtn = document.getElementById('copy-link-btn');
    
    if (!copyLinkBtn) return;

    copyLinkBtn.addEventListener('click', async () => {
      const url = copyLinkBtn.dataset.url || window.location.href;

      try {
        await navigator.clipboard.writeText(url);
        
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = 'Copied!';
        copyLinkBtn.classList.add('copied');
        
        setTimeout(() => {
          copyLinkBtn.textContent = originalText;
          copyLinkBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    });
  }

  // ============================================
  // SMOOTH SCROLL FOR TOC LINKS
  // ============================================
  function initTocSmoothing() {
    document.addEventListener('click', (e) => {
      const tocLink = e.target.closest('.toc-link');
      if (!tocLink) return;

      e.preventDefault();
      const targetId = tocLink.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        const navHeight = 60; // Account for fixed nav
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without jumping
        history.pushState(null, null, `#${targetId}`);
      }
    });
  }

  // ============================================
  // UTILITY: Throttle
  // ============================================
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ============================================
  // INITIALIZE ON DOM READY
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    generateTOC();
    initScrollSpy();
    initReadingProgress();
    initCodeCopy();
    initShareCopy();
    initTocSmoothing();
  });

})();
