import './index.css';
import {
  computeCenterCursor,
  computeLayerTransform,
  computeMainMaxHeight,
  filterVistas,
  VISTA_PRESETS,
  type VistaPreset,
} from './parallaxMath';

interface GsapTimeline {
  from: (
    targets: Element | Element[] | string,
    vars: Record<string, unknown>,
    position?: string | number,
  ) => GsapTimeline;
  isActive: () => boolean;
  kill: () => void;
}

interface GsapApi {
  timeline: () => GsapTimeline;
}

declare global {
  interface Window {
    gsap?: GsapApi;
  }
}

const main = document.querySelector<HTMLElement>('main');
const parallaxElements = document.querySelectorAll<HTMLElement>('.parallax');
const navHome = document.getElementById('nav-home');
const navExplore = document.getElementById('nav-explore');
const navSearch = document.getElementById('nav-search');
const navHamburger = document.getElementById('nav-hamburger');
const searchOverlay = document.getElementById('search-overlay');
const menuDrawer = document.getElementById('menu-drawer');
const vistaSearchInput = document.getElementById('vista-search-input') as HTMLInputElement | null;
const vistaResults = document.getElementById('vista-results');
const replayIntroBtn = document.getElementById('replay-intro-btn');

let xValue = 0;
let yValue = 0;
let timeline: GsapTimeline | null = null;

function applyResponsiveHeight(): void {
  if (!main) return;
  main.style.maxHeight = `${computeMainMaxHeight(window.innerWidth)}px`;
}

function update(cursorPosition: number): void {
  const vw = window.innerWidth;
  parallaxElements.forEach((el) => {
    const speedX = parseFloat(el.dataset.speedX ?? '0');
    const speedY = parseFloat(el.dataset.speedY ?? '0');
    const speedZ = parseFloat(el.dataset.speedZ ?? '0');
    const rotation = parseFloat(el.dataset.rotation ?? '0');

    const computedLeft = parseFloat(getComputedStyle(el).left);
    const layerLeft = Number.isNaN(computedLeft) ? vw / 2 : computedLeft;

    el.style.transform = computeLayerTransform({
      xValue,
      yValue,
      cursorX: cursorPosition,
      layerLeft,
      innerWidth: vw,
      speedX,
      speedY,
      speedZ,
      rotation,
    });
  });
}

function runEntranceSequence(): void {
  const gsap = window.gsap;
  if (!gsap) return;

  if (timeline) {
    timeline.kill();
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skipIntro = new URLSearchParams(window.location.search).get('autostart') === '1';

  if (prefersReducedMotion || skipIntro) {
    return;
  }

  timeline = gsap.timeline();

  const backgroundAndMountains = Array.from(parallaxElements).filter(
    (el) => !el.classList.contains('text'),
  );

  backgroundAndMountains.forEach((layer) => {
    const dataDistance = parseFloat(layer.dataset.distance ?? '0');
    timeline!.from(
      layer,
      {
        top: `${layer.offsetHeight / 2 - dataDistance}px`,
        duration: 3.5,
        ease: 'power3.out',
      },
      '0',
    );
  });

  const headingEl = document.querySelector<HTMLElement>('.text h1');
  if (headingEl) {
    const headingTop = headingEl.getBoundingClientRect().top;
    timeline.from(
      '.text h1',
      {
        y: window.innerHeight - headingTop + 200,
        duration: 2,
        ease: 'power3.out',
      },
      '2.5',
    );
  }

  timeline.from(
    '.text h2',
    {
      y: -150,
      opacity: 0,
      duration: 1.5,
      ease: 'power3.out',
    },
    '3.0',
  );

  timeline.from(
    '.hide',
    {
      opacity: 0,
      duration: 1.5,
      ease: 'power3.out',
    },
    '3.0',
  );
}

function closeOverlays(): void {
  if (searchOverlay) {
    searchOverlay.hidden = true;
    searchOverlay.setAttribute('aria-hidden', 'true');
  }
  if (menuDrawer) {
    menuDrawer.hidden = true;
    menuDrawer.setAttribute('aria-hidden', 'true');
  }
  navSearch?.setAttribute('aria-expanded', 'false');
  navHamburger?.setAttribute('aria-expanded', 'false');
}

function applyVistaPreset(preset: VistaPreset): void {
  xValue = preset.xOffsetRatio * (window.innerWidth / 2);
  yValue = preset.yOffsetRatio * (window.innerHeight / 2);
  update(window.innerWidth / 2 + xValue);
}

function renderVistaResults(query: string): void {
  if (!vistaResults) return;
  const matches = filterVistas(query);
  vistaResults.innerHTML = '';

  if (matches.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'vista-meta';
    empty.textContent = 'No mountain vistas match your filter.';
    vistaResults.appendChild(empty);
    return;
  }

  matches.forEach((vista) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vista-btn';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = vista.name;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'vista-meta';
    metaSpan.textContent = vista.elevation;

    btn.appendChild(titleSpan);
    btn.appendChild(metaSpan);

    btn.addEventListener('click', () => {
      applyVistaPreset(vista);
      closeOverlays();
    });

    li.appendChild(btn);
    vistaResults.appendChild(li);
  });
}

// Initialize layout, default transforms, and entrance timeline on load
applyResponsiveHeight();
update(0);
renderVistaResults('');

window.addEventListener('load', () => {
  applyResponsiveHeight();
  update(0);
  runEntranceSequence();
});

window.addEventListener('resize', () => {
  applyResponsiveHeight();
  update(window.innerWidth / 2 + xValue);
});

window.addEventListener('mousemove', (e: MouseEvent) => {
  if (timeline && timeline.isActive()) return;

  const coords = computeCenterCursor(
    e.clientX,
    e.clientY,
    window.innerWidth,
    window.innerHeight,
  );
  xValue = coords.xValue;
  yValue = coords.yValue;

  update(e.clientX);
});

// Interactive Header Controls
navHome?.addEventListener('click', (e) => {
  e.preventDefault();
  closeOverlays();
  xValue = 0;
  yValue = 0;
  update(0);
});

navExplore?.addEventListener('click', (e) => {
  e.preventDefault();
  const wasHidden = menuDrawer?.hidden ?? true;
  closeOverlays();
  if (menuDrawer && wasHidden) {
    menuDrawer.hidden = false;
    menuDrawer.setAttribute('aria-hidden', 'false');
    navHamburger?.setAttribute('aria-expanded', 'true');
  }
});

navSearch?.addEventListener('click', (e) => {
  e.preventDefault();
  const wasHidden = searchOverlay?.hidden ?? true;
  closeOverlays();
  if (searchOverlay && wasHidden) {
    searchOverlay.hidden = false;
    searchOverlay.setAttribute('aria-hidden', 'false');
    navSearch.setAttribute('aria-expanded', 'true');
    vistaSearchInput?.focus();
  }
});

navHamburger?.addEventListener('click', (e) => {
  e.preventDefault();
  const wasHidden = menuDrawer?.hidden ?? true;
  closeOverlays();
  if (menuDrawer && wasHidden) {
    menuDrawer.hidden = false;
    menuDrawer.setAttribute('aria-hidden', 'false');
    navHamburger.setAttribute('aria-expanded', 'true');
  }
});

vistaSearchInput?.addEventListener('input', () => {
  renderVistaResults(vistaSearchInput.value);
});

document.querySelectorAll<HTMLElement>('[data-close-overlay]').forEach((btn) => {
  btn.addEventListener('click', closeOverlays);
});

searchOverlay?.addEventListener('click', (e) => {
  if (e.target === searchOverlay) closeOverlays();
});

document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.preset;
    const preset = VISTA_PRESETS.find((p) => p.id === id);
    if (preset) {
      applyVistaPreset(preset);
    }
    closeOverlays();
  });
});

replayIntroBtn?.addEventListener('click', () => {
  closeOverlays();
  xValue = 0;
  yValue = 0;
  update(0);
  runEntranceSequence();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeOverlays();
  }
});
