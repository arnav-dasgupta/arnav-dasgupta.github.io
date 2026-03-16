/**
 * blog.js — Blog listing page functionality
 * - Dynamic post loading from posts.json
 * - Search filtering
 * - Tag filtering  
 * - Sort by date/title
 * - View toggle (cards vs list)
 * - Subscribe form
 */

(function() {
  'use strict';

  // ============================================
  // STATE
  // ============================================
  let posts = [];
  let filteredPosts = [];
  let currentTag = 'all';
  let currentSort = 'date';
  let currentView = 'cards';
  let searchQuery = '';

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const searchInput = document.getElementById('search-input');
  const tagFilters = document.getElementById('tag-filters');
  const postList = document.getElementById('post-list');
  const lsView = document.getElementById('ls-view');
  const lsTableBody = document.querySelector('#ls-table tbody');
  const resultsCount = document.getElementById('results-count');

  // ============================================
  // LOAD POSTS FROM JSON
  // ============================================
  async function loadPosts() {
    try {
      // Use absolute path to ensure it works regardless of URL format
      const response = await fetch('/blog/posts.json');
      if (!response.ok) throw new Error('Failed to load posts');
      posts = await response.json();
      filteredPosts = [...posts];
      
      // Extract all unique tags
      updateTagFilters();
      
      // Render posts
      renderPosts();
      renderLsTable();
      updateResultsCount();
    } catch (err) {
      console.error('Error loading posts:', err);
      postList.innerHTML = `
        <div class="error-message" style="color: var(--accent-red); padding: 2rem; text-align: center;">
          <span style="color: var(--accent-amber);">$</span> cat posts.json<br>
          <span style="color: var(--text-muted);">Error: Failed to load posts. Please refresh.</span>
        </div>
      `;
    }
  }

  // ============================================
  // UPDATE TAG FILTERS FROM POST DATA
  // ============================================
  function updateTagFilters() {
    if (!tagFilters) return;

    // Collect all unique tags
    const allTags = new Set();
    posts.forEach(post => {
      (post.tags || []).forEach(tag => allTags.add(tag));
    });

    // Sort tags alphabetically
    const sortedTags = Array.from(allTags).sort();

    // Build tag filter buttons
    let html = '<span class="tag-label">--tag=</span>';
    html += '<button class="tag-filter active" data-tag="all">all</button>';
    sortedTags.forEach(tag => {
      html += `<button class="tag-filter" data-tag="${tag}">${tag}</button>`;
    });

    tagFilters.innerHTML = html;

    // Re-attach event listeners
    initTagFilters();
  }

  // ============================================
  // RENDER POST CARDS
  // ============================================
  function renderPosts() {
    if (!postList) return;

    if (filteredPosts.length === 0) {
      postList.innerHTML = `
        <div class="no-results" style="color: var(--text-muted); padding: 3rem; text-align: center; width: 100%;">
          <div style="color: var(--accent-amber); margin-bottom: 0.5rem;">$ grep -r "${searchQuery || currentTag}" ./posts/</div>
          <div>No matching posts found.</div>
        </div>
      `;
      return;
    }

    postList.innerHTML = filteredPosts.map(post => {
      const date = new Date(post.isoDate);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return `
        <a class="post-card" href="${post.url}" data-tags="${(post.tags || []).join(',')}" data-date="${post.isoDate}" data-title="${post.title}">
          <div class="post-card-date">
            <span class="month">${months[date.getMonth()]}</span>
            <span class="day">${date.getDate().toString().padStart(2, '0')}</span>
            <span class="year">${date.getFullYear()}</span>
          </div>
          <div class="post-card-content">
            <div class="post-card-title">${post.title}</div>
            <div class="post-card-excerpt">${post.description || ''}</div>
            <div class="post-card-meta">
              <div class="post-card-tags">
                ${(post.tags || []).map(tag => `<span class="tag tag-${tag}">${tag}</span>`).join('')}
              </div>
              <span class="post-card-reading">~ ${post.readingTime} min read</span>
            </div>
          </div>
          <div class="post-card-arrow">&rarr;</div>
        </a>
      `;
    }).join('');
  }

  // ============================================
  // RENDER LS TABLE VIEW
  // ============================================
  function renderLsTable() {
    if (!lsTableBody) return;

    if (filteredPosts.length === 0) {
      lsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="color: var(--text-muted); text-align: center; padding: 2rem;">
            No matching posts found.
          </td>
        </tr>
      `;
      return;
    }

    lsTableBody.innerHTML = filteredPosts.map(post => {
      const tags = (post.tags || []).slice(0, 2).join(', ');
      return `
        <tr data-href="${post.url}">
          <td>-rw-r--r--</td>
          <td>arnav</td>
          <td>${post.wordCount.toLocaleString()}</td>
          <td>${post.date}</td>
          <td>
            <span class="ls-filename">${post.slug}.md</span>
            <span class="ls-tags">[${tags}]</span>
          </td>
        </tr>
      `;
    }).join('');

    // Re-attach click listeners
    initLsTableClicks();
  }

  // ============================================
  // UPDATE RESULTS COUNT
  // ============================================
  function updateResultsCount() {
    if (resultsCount) {
      resultsCount.textContent = filteredPosts.length;
    }
  }

  // ============================================
  // FILTER & SORT
  // ============================================
  function applyFiltersAndSort() {
    // Start with all posts
    filteredPosts = posts.filter(post => {
      // Tag filter
      const matchesTag = currentTag === 'all' || 
        (post.tags || []).includes(currentTag);

      // Search filter
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery) ||
        (post.description || '').toLowerCase().includes(searchQuery) ||
        (post.tags || []).some(tag => tag.toLowerCase().includes(searchQuery));

      return matchesTag && matchesSearch;
    });

    // Sort
    filteredPosts.sort((a, b) => {
      if (currentSort === 'date') {
        return new Date(b.isoDate) - new Date(a.isoDate); // Newest first
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    // Re-render
    renderPosts();
    renderLsTable();
    updateResultsCount();
  }

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  function initSearch() {
    if (!searchInput) return;

    // Focus search on "/" key
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
      // Escape to blur
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
      }
    });

    // Filter on input
    searchInput.addEventListener('input', debounce(() => {
      searchQuery = searchInput.value.toLowerCase().trim();
      applyFiltersAndSort();
    }, 200));
  }

  // ============================================
  // TAG FILTERING
  // ============================================
  function initTagFilters() {
    if (!tagFilters) return;

    const buttons = tagFilters.querySelectorAll('.tag-filter');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentTag = btn.dataset.tag;
        applyFiltersAndSort();
      });
    });
  }

  // ============================================
  // SORT FUNCTIONALITY
  // ============================================
  function initSort() {
    const sortOptions = document.querySelectorAll('.sort-option');

    sortOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        sortOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');

        currentSort = opt.dataset.sort;
        applyFiltersAndSort();
      });
    });
  }

  // ============================================
  // VIEW TOGGLE
  // ============================================
  function initViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');

    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentView = btn.dataset.view;
        updateView();
      });
    });
  }

  function updateView() {
    if (!postList || !lsView) return;
    
    if (currentView === 'cards') {
      postList.style.display = 'flex';
      lsView.classList.remove('active');
    } else {
      postList.style.display = 'none';
      lsView.classList.add('active');
    }
  }

  // ============================================
  // LS TABLE ROW CLICKS
  // ============================================
  function initLsTableClicks() {
    if (!lsTableBody) return;

    const rows = lsTableBody.querySelectorAll('tr[data-href]');
    rows.forEach(row => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => {
        const href = row.dataset.href;
        if (href && href !== '#') {
          window.location.href = href;
        }
      });
    });
  }

  // ============================================
  // SUBSCRIBE FORM
  // ============================================
  function initSubscribe() {
    const form = document.getElementById('subscribe-form');
    const emailInput = document.getElementById('subscribe-email');
    const submitBtn = document.getElementById('subscribe-btn');

    if (!form || !emailInput || !submitBtn) return;

    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (email && isValidEmail(email)) {
        // Simulate success (in real app, would send to backend)
        form.classList.add('success');
      } else {
        emailInput.style.borderColor = 'var(--accent-red)';
        setTimeout(() => {
          emailInput.style.borderColor = '';
        }, 2000);
      }
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ============================================
  // UTILITY: Debounce
  // ============================================
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // ============================================
  // INITIALIZE ON DOM READY
  // ============================================
  document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initSort();
    initViewToggle();
    initSubscribe();
    
    // Load posts dynamically
    loadPosts();
  });

})();
