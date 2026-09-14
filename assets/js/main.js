(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Header ---------------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- Mobile nav ---------------- */
  const burger = document.getElementById('burgerBtn');
  const navMobile = document.getElementById('navMobile');
  const toggleNav = (open) => {
    const isOpen = open ?? !navMobile.classList.contains('open');
    navMobile.classList.toggle('open', isOpen);
    burger.classList.toggle('active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleNav());
  navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleNav(false)));

  /* ---------------- Hero ready (neon power-on) ---------------- */
  const hero = document.querySelector('.hero');
  requestAnimationFrame(() => setTimeout(() => hero.classList.add('is-ready'), 120));

  /* ---------------- Scroll reveal ----------------
     IntersectionObserver alone can miss elements on a very fast/teleport
     scroll (fling, "End" key, anchor jump) if no frame ever paints while
     the element is mid-viewport — leaving it permanently invisible. We
     pair IO (for the nice threshold-triggered timing) with a cheap
     rAF-throttled scroll fallback that force-reveals anything whose top
     has already crossed into or past the viewport, so content can never
     get stuck hidden regardless of how the user scrolled. */
  const revealEls = Array.from(document.querySelectorAll('[data-reveal], .rv-bar-row, .divider-facet'));
  revealEls.forEach((el, i) => el.style.setProperty('--i', i % 8));

  if (reduced) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));

    let ticking = false;
    const sweep = () => {
      ticking = false;
      const vh = window.innerHeight;
      revealEls.forEach(el => {
        if (el.classList.contains('in-view')) return;
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add('in-view');
          io.unobserve(el);
        }
      });
    };
    const onScrollOrResize = () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } };
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    sweep();
  }

  /* ---------------- Price rendering ---------------- */
  const renderRow = ({ nm, note, pr, prTo }) => `
    <div class="svc-row">
      <span class="nm">${nm}${note ? `<small>${note}</small>` : ''}</span>
      <span class="pr">${prTo ? `${fmt(pr)}–${fmt(prTo)}` : `от ${fmt(pr)}`}</span>
    </div>`;

  const mount = (id, rows) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = rows.map(renderRow).join('');
  };

  mount('hair-cuts', PRICES.hairCuts);
  mount('nails-main', PRICES.nailsMain);
  mount('nails-extra', PRICES.nailsExtra);
  mount('brows-main', PRICES.browsMain);
  mount('brows-perm', PRICES.permMain);
  mount('care-clean', PRICES.careClean);
  mount('care-hw', PRICES.careHw);
  mount('massage-main', PRICES.massageMain);
  mount('massage-extra', PRICES.massageExtra);
  mount('makeup-main', PRICES.makeupMain);
  mount('makeup-wedding', PRICES.makeupWedding);
  mount('perm-main', PRICES.permMain);

  const hairCareEl = document.getElementById('hair-care');
  if (hairCareEl) {
    hairCareEl.innerHTML = `
      <p style="color:var(--text-muted);font-size:.88rem;margin-bottom:1rem">Также доступно по консультации мастера:</p>
      <ul style="display:flex;flex-direction:column;gap:.6rem">
        ${PRICES.hairCareNote.map(t => `<li style="font-size:.86rem;color:var(--text-body);padding-left:1rem;position:relative"><span style="position:absolute;left:0;top:.6em;width:5px;height:1px;background:var(--violet-glow)"></span>${t}</li>`).join('')}
      </ul>`;
  }

  const colorTable = document.getElementById('hair-color-table');
  if (colorTable) {
    const { head, rows, foot } = PRICES.hairColorTiers;
    colorTable.innerHTML = `
      <thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r[0]}</td>${r.slice(1).map(v => `<td>${v ? fmt(v) : '—'}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const footEl = document.createElement('p');
    footEl.style.cssText = 'color:var(--text-faint);font-size:.78rem;margin-top:1rem;max-width:38rem';
    footEl.textContent = foot;
    colorTable.closest('.svc-tiers').appendChild(footEl);
  }

  /* ---------------- Service tabs ---------------- */
  const tabs = document.querySelectorAll('.svc-tab');
  const panels = document.querySelectorAll('.svc-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const target = tab.dataset.tab;
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
    });
  });
  // deep-link support for hero facet shortcuts (#p-hair etc.)
  document.querySelectorAll('a[href^="#p-"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const key = a.getAttribute('href').replace('#p-', '');
      const tab = document.querySelector(`.svc-tab[data-tab="${key}"]`);
      if (tab) tab.click();
    });
  });

  /* ---------------- Gallery ---------------- */
  const galGrid = document.getElementById('galGrid');
  // Row/column span (landscape tiles, "big" ones double-width) lives in
  // CSS — see .gal-item / .gal-item.is-big — so it can vary per breakpoint.

  const imgSrc = (slug, w) => `assets/img/opt/${slug}-${w}.webp`;

  GALLERY.forEach((item, i) => {
    const fig = document.createElement('figure');
    fig.className = 'gal-item' + (item.big ? ' is-big' : '');
    fig.dataset.cat = item.cat;
    const sizes = item.big ? '(max-width:920px) 100vw, 50vw' : '(max-width:920px) 50vw, 25vw';
    fig.innerHTML = `
      <img src="${imgSrc(item.slug, 600)}" srcset="${imgSrc(item.slug,600)} 600w, ${imgSrc(item.slug,1000)} 1000w" sizes="${sizes}" alt="${item.cap} — 4 Грани Лаб" loading="lazy">
      <figcaption class="gal-cap">${item.cap}</figcaption>`;
    fig.addEventListener('click', () => openLightbox(i));
    galGrid.appendChild(fig);
  });

  const filterBtns = document.querySelectorAll('.gal-filters button');
  const galItems = () => document.querySelectorAll('.gal-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      galItems().forEach(el => {
        const show = f === 'all' || el.dataset.cat === f;
        el.toggleAttribute('data-hidden', !show);
      });
    });
  });

  /* ---------------- Lightbox ---------------- */
  const lb = document.getElementById('galLightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  let lbIndex = 0;

  function visibleIndices() {
    return GALLERY.map((_, i) => i).filter(i => {
      const el = galGrid.children[i];
      return el && !el.hasAttribute('data-hidden');
    });
  }
  function openLightbox(i) {
    lbIndex = i;
    updateLightbox();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function updateLightbox() {
    const item = GALLERY[lbIndex];
    lbImg.src = imgSrc(item.slug, 1000);
    lbImg.alt = item.cap;
    lbCap.textContent = item.cap;
  }
  function step(dir) {
    const vis = visibleIndices();
    if (!vis.length) return;
    const pos = vis.indexOf(lbIndex);
    const next = pos === -1 ? vis[0] : vis[(pos + dir + vis.length) % vis.length];
    lbIndex = next;
    updateLightbox();
  }
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', () => step(-1));
  document.getElementById('lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    const setHeight = () => { a.style.maxHeight = item.classList.contains('open') ? a.scrollHeight + 'px' : '0px'; };
    setHeight();
    q.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => { if (o !== item) { o.classList.remove('open'); o.querySelector('.faq-a').style.maxHeight = '0px'; } });
      item.classList.toggle('open', willOpen);
      setHeight();
    });
    window.addEventListener('resize', () => { if (item.classList.contains('open')) setHeight(); });
  });

  /* ---------------- Smooth-scroll offset for fixed header ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const targetPanelKey = a.dataset ? null : null;
      const target = document.getElementById(id) || document.getElementById(id + '-card');
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 84;
        window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  });

})();
