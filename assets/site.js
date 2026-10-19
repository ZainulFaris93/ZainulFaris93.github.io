/* Shared behaviour for every page: theme, menu, reveal, résumé, live-demo links. */
(function () {
  const S = window.SETTINGS || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  // Pages in /projects/ sit one level down
  const base = document.body.dataset.base || '';

  // ---- Theme toggle (initial theme is set by the inline script in <head>)
  $$('[data-theme-toggle]').forEach(btn => {
    const sync = () => btn.setAttribute('aria-label', root.dataset.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    sync();
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      sync();
    });
  });

  // ---- Mobile menu
  const links = $('#links'), menuBtn = $('#menuBtn');
  if (links && menuBtn) {
    menuBtn.onclick = () => { const o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); };
    $$('a', links).forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }));
  }

  // ---- Reveal on scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    $$('.rv').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });
  } else { $$('.rv').forEach(el => el.classList.add('in')); }

  // ---- Contact links
  $$('[data-email]').forEach(a => { a.href = 'mailto:' + S.email; if (!a.textContent.trim()) a.textContent = S.email; });
  $$('[data-github]').forEach(a => a.href = S.github);
  $$('[data-linkedin]').forEach(a => a.href = S.linkedin);
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // ---- Live demo links + wake the free server early so it's ready when clicked
  $$('[data-demo]').forEach(a => a.href = S.hospitalDemo + (a.dataset.demo || '/login_page'));
  let woke = false;
  window.wakeDemo = () => { if (woke || !S.hospitalDemo) return; woke = true; fetch(S.hospitalDemo, { mode: 'no-cors', cache: 'no-store' }).catch(() => {}); };
  if ($('[data-demo]')) setTimeout(window.wakeDemo, 1500);

  // ---- Résumé: resume.pdf, or resume-<name>.pdf when the link has ?cv=<name>
  const resumeLinks = $$('[data-resume]');
  if (resumeLinks.length) (async () => {
    let cv = (new URLSearchParams(location.search).get('cv') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    try { if (cv) sessionStorage.setItem('cv', cv); else cv = sessionStorage.getItem('cv') || ''; } catch (e) {}
    const candidates = cv ? ['resume-' + cv + '.pdf', S.resumeFile] : [S.resumeFile];
    for (const file of candidates) {
      try {
        const r = await fetch(base + file, { method: 'HEAD', cache: 'no-store' });
        if (r.ok) {
          resumeLinks.forEach(a => { a.href = base + file + '?v=' + Date.now(); a.setAttribute('download', S.resumeDownloadName); a.hidden = false; });
          return;
        }
      } catch (e) {}
    }
  })();
})();
