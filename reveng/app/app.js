/**
 * Claude Code Reverse Engineering Documentation Viewer
 * Renders markdown docs with cross-linking and full-text search.
 */

(function () {
  'use strict';

  const manifestUrl = 'docs-manifest.json';
  const contentEl = document.getElementById('content');
  const sidebarEl = document.getElementById('sidebar');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  let manifest = null;
  let docCache = new Map(); // id -> { title, path, raw, sections }
  let pathToId = new Map();
  let searchIndex = [];

  // ── Init ──────────────────────────────────────────────────────────

  async function init() {
    const res = await fetch(manifestUrl);
    manifest = await res.json();

    for (const doc of manifest.docs) {
      pathToId.set(normalizePath(doc.path), doc.id);
      pathToId.set(doc.path, doc.id);
    }

    await Promise.all(manifest.docs.map(loadDoc));
    buildSearchIndex();
    renderSidebar();
    setupSearch();
    setupPopstate();

    const initial = parseHash() || manifest.docs[0].id;
    await navigate(initial);
  }

  // ── Document loading ──────────────────────────────────────────────

  async function loadDoc(meta) {
    const res = await fetch(meta.path);
    const raw = await res.text();
    const sections = extractSections(raw);
    docCache.set(meta.id, { ...meta, raw, sections });
    return meta.id;
  }

  function extractSections(md) {
    const sections = [];
    const lines = md.split('\n');
    for (const line of lines) {
      const m = line.match(/^(#{1,4})\s+(.+)$/);
      if (m) {
        const level = m[1].length;
        const text = m[2].replace(/\*\*/g, '').trim();
        const id = slugify(text);
        sections.push({ level, text, id, line: line });
      }
    }
    return sections;
  }

  // ── Rendering ─────────────────────────────────────────────────────

  async function navigate(docId, sectionId) {
    const doc = docCache.get(docId);
    if (!doc) return;

    location.hash = sectionId ? `${docId}/${sectionId}` : docId;

    const renderer = new marked.Renderer();

    renderer.heading = function (text, level) {
      const id = slugify(text);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    };

    renderer.link = function (href, title, text) {
      const resolved = resolveLink(href, doc.path);
      if (resolved) {
        const t = title ? ` title="${title}"` : '';
        return `<a href="${resolved}"${t}>${text}</a>`;
      }
      const ext = href.match(/^https?:\/\//) ? ' target="_blank" rel="noopener"' : '';
      const t = title ? ` title="${title}"` : '';
      return `<a href="${href}"${t}${ext}>${text}</a>`;
    };

    marked.setOptions({ renderer, gfm: true, breaks: false });
    const html = marked.parse(doc.raw);
    contentEl.innerHTML = `<article class="markdown-body">${html}</article>`;

    contentEl.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', handleInternalLink);
    });

    updateActiveNav(docId);

    if (sectionId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('highlight-flash');
          setTimeout(() => el.classList.remove('highlight-flash'), 2000);
        }
      });
    } else {
      contentEl.scrollTop = 0;
    }
  }

  function resolveLink(href, currentPath) {
    if (!href || href.startsWith('http')) return null;

    let targetPath = href;
    let section = null;

    if (href.includes('#')) {
      const parts = href.split('#');
      targetPath = parts[0];
      section = parts[1];
    }

    if (!targetPath || targetPath === '') {
      // Same-doc section link
      if (section) {
        const docId = pathToId.get(normalizePath(currentPath));
        return `#${docId}/${section}`;
      }
      return null;
    }

    // Resolve relative path
    const base = currentPath.replace(/[^/]+$/, '');
    const resolved = normalizePath(base + targetPath);
    const docId = pathToId.get(resolved);
    if (!docId) return null;

    return section ? `#${docId}/${section}` : `#${docId}`;
  }

  function handleInternalLink(e) {
    const href = e.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    const parts = href.slice(1).split('/');
    const docId = parts[0];
    const sectionId = parts[1] || null;
    navigate(docId, sectionId);
    searchResults.classList.remove('active');
  }

  // ── Sidebar ───────────────────────────────────────────────────────

  function renderSidebar() {
    const categories = {};
    for (const doc of manifest.docs) {
      if (!categories[doc.category]) categories[doc.category] = [];
      categories[doc.category].push(doc);
    }

    let html = '';
    for (const [cat, docs] of Object.entries(categories)) {
      html += `<div class="nav-category"><div class="nav-category-title">${cat}</div>`;
      for (const doc of docs) {
        html += `<a class="nav-link" href="#${doc.id}" data-id="${doc.id}">${doc.title}</a>`;
      }
      html += '</div>';
    }
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(link.dataset.id);
      });
    });
  }

  function updateActiveNav(docId) {
    sidebarEl.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.id === docId);
    });
  }

  // ── Search ────────────────────────────────────────────────────────

  function buildSearchIndex() {
    searchIndex = [];
    for (const [id, doc] of docCache) {
      // Index full document body
      searchIndex.push({
        docId: id,
        title: doc.title,
        section: null,
        sectionId: null,
        text: stripMarkdown(doc.raw),
      });

      // Index each section separately
      for (const sec of doc.sections) {
        const sectionText = extractSectionBody(doc.raw, sec.text);
        searchIndex.push({
          docId: id,
          title: doc.title,
          section: sec.text,
          sectionId: sec.id,
          text: stripMarkdown(sectionText),
        });
      }
    }
  }

  function extractSectionBody(md, headingText) {
    const lines = md.split('\n');
    let capturing = false;
    let level = 0;
    const body = [];

    for (const line of lines) {
      const m = line.match(/^(#{1,4})\s+(.+)$/);
      if (m) {
        const text = m[2].replace(/\*\*/g, '').trim();
        if (text === headingText) {
          capturing = true;
          level = m[1].length;
          continue;
        }
        if (capturing && m[1].length <= level) break;
      }
      if (capturing) body.push(line);
    }
    return body.join('\n');
  }

  function stripMarkdown(md) {
    return md
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]+`/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_~>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function setupSearch() {
    let debounce = null;

    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => runSearch(searchInput.value.trim()), 150);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) runSearch(searchInput.value.trim());
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        searchResults.classList.remove('active');
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchResults.classList.remove('active');
        searchInput.blur();
      }
    });
  }

  function runSearch(query) {
    if (!query || query.length < 2) {
      searchResults.classList.remove('active');
      return;
    }

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = [];

    for (const entry of searchIndex) {
      const haystack = `${entry.title} ${entry.section || ''} ${entry.text}`;
      if (terms.every((t) => haystack.includes(t))) {
        const score = terms.reduce((s, t) => {
          const idx = haystack.indexOf(t);
          return s + (idx >= 0 ? 100 - Math.min(idx, 99) : 0);
        }, 0);
        results.push({ ...entry, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    renderSearchResults(results.slice(0, 20), query);
  }

  function renderSearchResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
    } else {
      searchResults.innerHTML = results
        .map((r) => {
          const label = r.section ? `${r.title} › ${r.section}` : r.title;
          const snippet = highlightSnippet(r.text, query);
          const hash = r.sectionId ? `#${r.docId}/${r.sectionId}` : `#${r.docId}`;
          return `<div class="search-result-item" data-hash="${hash}">
            <div class="search-result-title">${escapeHtml(label)}</div>
            <div class="search-result-snippet">${snippet}</div>
          </div>`;
        })
        .join('');
    }

    searchResults.classList.add('active');

    searchResults.querySelectorAll('.search-result-item').forEach((item) => {
      item.addEventListener('click', () => {
        const hash = item.dataset.hash.slice(1);
        const parts = hash.split('/');
        navigate(parts[0], parts[1] || null);
        searchResults.classList.remove('active');
        searchInput.value = '';
      });
    });
  }

  function highlightSnippet(text, query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let bestIdx = -1;
    for (const t of terms) {
      const idx = text.indexOf(t);
      if (idx >= 0 && (bestIdx < 0 || idx < bestIdx)) bestIdx = idx;
    }
    const start = Math.max(0, bestIdx - 40);
    const excerpt = text.slice(start, start + 120);
    let html = escapeHtml(excerpt);
    for (const t of terms) {
      const re = new RegExp(`(${escapeRegex(t)})`, 'gi');
      html = html.replace(re, '<mark>$1</mark>');
    }
    return (start > 0 ? '…' : '') + html + '…';
  }

  // ── Routing ───────────────────────────────────────────────────────

  function parseHash() {
    const hash = location.hash.slice(1);
    if (!hash) return null;
    return hash.split('/')[0];
  }

  function setupPopstate() {
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1);
      if (!hash) return;
      const parts = hash.split('/');
      navigate(parts[0], parts[1] || null);
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function normalizePath(p) {
    const parts = p.split('/');
    const stack = [];
    for (const part of parts) {
      if (part === '..') stack.pop();
      else if (part !== '.' && part !== '') stack.push(part);
    }
    return stack.join('/');
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── Boot ──────────────────────────────────────────────────────────

  init().catch((err) => {
    contentEl.innerHTML = `<div class="loading">
      <p>Failed to load documentation.</p>
      <p style="margin-top:1rem;font-size:0.875rem;color:var(--text-muted)">
        From the <code>reveng</code> directory run:<br>
        <code>npm run dev</code> (or <code>npx serve .</code>) then open <code>/app/</code>
      </p>
      <p style="margin-top:0.5rem;font-size:0.75rem;color:var(--text-muted)">${escapeHtml(String(err))}</p>
    </div>`;
  });
})();
