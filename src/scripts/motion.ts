import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function initPortfolioMotion() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Initialize Lenis Smooth Scroll (lerp: 0.1 synced to GSAP ticker)
  let lenis: Lenis | null = null;
  if (!isReducedMotion) {
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis?.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  // References to Fixed UI elements
  const topbar = document.getElementById('topbar');
  const viewButton = document.getElementById('view-button');
  const bottomBar = document.getElementById('bottom-bar');
  const menuButton = document.getElementById('menu-button');
  const navOverlay = document.getElementById('nav-overlay');
  const lightbox = document.getElementById('media-lightbox') as HTMLDialogElement | null;
  const lightboxClose = document.getElementById('lightbox-close');

  let activeWorkData = {
    title: '',
    sectionTitle: '',
    counter: '',
    linkUrl: '',
    mediaUrl: '',
    mediaType: 'IMAGE',
  };

  // Tone management for Fixed UI
  function setMenuTone(tone: 'light' | 'dark') {
    if (menuButton && menuButton.getAttribute('data-tone') !== tone) {
      menuButton.setAttribute('data-tone', tone);
    }
  }

  function setBottomTone(tone: 'light' | 'dark') {
    if (bottomBar && bottomBar.getAttribute('data-tone') !== tone) {
      bottomBar.setAttribute('data-tone', tone);
    }
  }

  function setUiTone(tone: 'light' | 'dark') {
    setMenuTone(tone);
    setBottomTone(tone);
  }

  // 200ms vertical text swap for Bottom Bar
  function updateBottomBarText(sectionTitle: string, counter: string) {
    const sectionEl = document.getElementById('bottom-bar-section');
    const counterEl = document.getElementById('bottom-bar-counter');

    if (sectionEl && sectionEl.dataset.current !== sectionTitle) {
      sectionEl.dataset.current = sectionTitle;
      gsap.to(sectionEl, {
        y: -12,
        opacity: 0,
        duration: 0.1,
        ease: 'power2.in',
        onComplete: () => {
          sectionEl.textContent = sectionTitle;
          gsap.fromTo(
            sectionEl,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.1, ease: 'power2.out' }
          );
        },
      });
    }

    if (counterEl && counterEl.dataset.current !== counter) {
      counterEl.dataset.current = counter;
      gsap.to(counterEl, {
        y: -12,
        opacity: 0,
        duration: 0.1,
        ease: 'power2.in',
        onComplete: () => {
          counterEl.textContent = counter;
          gsap.fromTo(
            counterEl,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.1, ease: 'power2.out' }
          );
        },
      });
    }
  }

  // Tone detection for general standalone sections (Hero, Services, Footer, etc.)
  // Triggered at top 80px matching the MenuButton viewport position
  const standaloneToneElements = document.querySelectorAll<HTMLElement>(
    '#hero, #services, #footer, [data-tone]:not(#menu-button):not(#bottom-bar):not(.work-section):not(.panel-wrapper):not(.work-panel)'
  );

  standaloneToneElements.forEach((el) => {
    const tone = (el.getAttribute('data-tone') as 'light' | 'dark') || (el.id === 'footer' ? 'dark' : 'light');
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80px',
      end: 'bottom 80px',
      onEnter: () => setMenuTone(tone),
      onEnterBack: () => setMenuTone(tone),
    });
  });

  // Services rows reveal animation (80ms upward stagger)
  const serviceRows = document.querySelectorAll('#services .border-b-2');
  if (serviceRows.length > 0) {
    gsap.from(serviceRows, {
      scrollTrigger: {
        trigger: '#services',
        start: 'top 75%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power2.out',
    });
  }

  // Topbar and MenuButton scroll transitions:
  // Hide on scroll down, immediately reveal on scroll up
  if (topbar && menuButton) {
    let lastScrollY = window.scrollY;
    let isHidden = false;

    // Initial state: topbar visible, menuButton hidden
    gsap.set(topbar, { yPercent: 0, opacity: 1, pointerEvents: 'auto' });
    gsap.set(menuButton, { opacity: 0, pointerEvents: 'none' });

    const updateTopbarDirection = (currentY: number) => {
      // 1. If at or near the very top of the page (<= 50px), always keep topbar visible
      if (currentY <= 50) {
        if (isHidden) {
          isHidden = false;
          gsap.killTweensOf([topbar, menuButton]);
          gsap.to(topbar, { yPercent: 0, opacity: 1, pointerEvents: 'auto', duration: 0.3, ease: 'power2.out' });
          gsap.to(menuButton, { opacity: 0, pointerEvents: 'none', duration: 0.25, ease: 'power2.in' });
        }
        lastScrollY = currentY;
        return;
      }

      const diff = currentY - lastScrollY;
      const threshold = 6; // Ignore tiny micro-jitters

      if (diff > threshold && !isHidden) {
        // Scrolling DOWN -> Hide topbar, reveal menu button
        isHidden = true;
        gsap.killTweensOf([topbar, menuButton]);
        gsap.to(topbar, { yPercent: -100, opacity: 0, pointerEvents: 'none', duration: 0.35, ease: 'power2.out' });
        gsap.to(menuButton, { opacity: 1, pointerEvents: 'auto', duration: 0.35, ease: 'power2.out' });
      } else if (diff < -threshold && isHidden) {
        // Scrolling UP -> Immediately reveal topbar, hide menu button
        isHidden = false;
        gsap.killTweensOf([topbar, menuButton]);
        gsap.to(topbar, { yPercent: 0, opacity: 1, pointerEvents: 'auto', duration: 0.3, ease: 'power2.out' });
        gsap.to(menuButton, { opacity: 0, pointerEvents: 'none', duration: 0.25, ease: 'power2.in' });
      }

      lastScrollY = currentY;
    };

    if (lenis) {
      lenis.on('scroll', (e: { scroll: number }) => {
        updateTopbarDirection(e.scroll);
      });
    } else {
      window.addEventListener('scroll', () => {
        updateTopbarDirection(window.scrollY);
      }, { passive: true });
    }
  }

  // Bottom Bar visibility triggers
  const firstHeading = document.querySelector('.section-heading-band');
  const footer = document.getElementById('footer');

  if (bottomBar) {
    // Initially hide Bottom Bar until the works arrive
    gsap.set(bottomBar, { opacity: 0, pointerEvents: 'none' });

    if (firstHeading) {
      ScrollTrigger.create({
        trigger: firstHeading,
        start: 'top 80%',
        onEnter: () => {
          gsap.to(bottomBar, { opacity: 1, pointerEvents: 'auto', duration: 0.4 });
        },
        onLeaveBack: () => {
          gsap.to(bottomBar, { opacity: 0, pointerEvents: 'none', duration: 0.3 });
        },
      });
    }

    if (footer) {
      // Fade out bottom bar when footer slides up (about 0.3 viewport)
      ScrollTrigger.create({
        trigger: footer,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(bottomBar, { opacity: 0, pointerEvents: 'none', duration: 0.3 });
        },
        onLeaveBack: () => {
          gsap.to(bottomBar, { opacity: 1, pointerEvents: 'auto', duration: 0.4 });
        },
      });
    }
  }

  // 3. Work Panels: Signature Push-and-Darken Motion
  const sectionContainers = document.querySelectorAll<HTMLElement>('.section-container');

  if (!isReducedMotion && sectionContainers.length > 0) {
    sectionContainers.forEach((secContainer) => {
      const headingBand = secContainer.querySelector<HTMLElement>('.section-heading-band');
      const panelsStack = secContainer.querySelector<HTMLElement>('.panels-stack');
      if (!panelsStack) return;

      const panelWrappers = panelsStack.querySelectorAll<HTMLElement>('.panel-wrapper');
      const numPanels = panelWrappers.length;
      if (numPanels === 0) return;

      // Initialize wrapper positions: first at 0%, subsequent at 100%
      panelWrappers.forEach((wrapper, idx) => {
        gsap.set(wrapper, { yPercent: idx > 0 ? 100 : 0 });
      });

      // Pin distance:
      // holdInitial (0.9 * vh): Pauses/holds the initial state (Heading + First work preview card)
      // revealHeading (0.8 * vh): Smoothly slides heading up & reveals first work full-screen
      // holdFirstWork (0.6 * vh): Holds first work full-screen
      // panelStep (1.6 * vh): Subsequent panel transitions (1.0) and holds (0.6)
      const holdInitial = 0.9;
      const revealHeading = 0.8;
      const holdFirstWork = 0.6;
      const panelStep = 1.6;
      const totalUnits = holdInitial + revealHeading + holdFirstWork + (numPanels - 1) * panelStep;
      const pinDistance = window.innerHeight * totalUnits;

      // When heading band approaches top 80px (menu button position) before pinning
      ScrollTrigger.create({
        trigger: secContainer,
        start: 'top 80px',
        end: 'top top',
        onEnter: () => setMenuTone('light'),
        onEnterBack: () => setMenuTone('light'),
        onLeaveBack: () => setMenuTone('dark'),
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: secContainer,
          start: 'top top',
          end: `+=${pinDistance}`,
          pin: true,
          scrub: 0.35,
          onUpdate: (self) => {
            const headingDoneShare = (holdInitial + revealHeading) / totalUnits;
            const headingRect = headingBand?.getBoundingClientRect();
            const isHeadingOverMenu = Boolean(headingRect && headingRect.bottom > 70 && headingRect.top <= 70);

            if (isHeadingOverMenu) {
              setMenuTone('light');
            }

            if (self.progress < headingDoneShare) {
              const firstPanel = panelWrappers[0]?.querySelector<HTMLElement>('.work-panel');
              if (firstPanel) {
                const title = firstPanel.getAttribute('data-work-title') || '';
                const sTitle = firstPanel.getAttribute('data-section-title') || '';
                const counter = firstPanel.getAttribute('data-counter') || '';
                activeWorkData = {
                  title,
                  sectionTitle: sTitle,
                  counter,
                  linkUrl: firstPanel.getAttribute('data-link-url') || '',
                  mediaUrl: firstPanel.getAttribute('data-media-url') || '',
                  mediaType: firstPanel.getAttribute('data-media-type') || 'IMAGE',
                };
                updateBottomBarText(sTitle, counter);
                if (!isHeadingOverMenu) {
                  const pTone = (firstPanel.getAttribute('data-tone') as 'light' | 'dark') || 'dark';
                  setMenuTone(pTone);
                  setBottomTone(pTone);
                }
              }
            } else {
              const panelProgress = (self.progress - headingDoneShare) / (1 - headingDoneShare);
              const activeIndex = Math.min(Math.floor(panelProgress * numPanels), numPanels - 1);
              const activeWrapper = panelWrappers[activeIndex];
              const panel = activeWrapper?.querySelector<HTMLElement>('.work-panel');
              if (panel) {
                const title = panel.getAttribute('data-work-title') || '';
                const sTitle = panel.getAttribute('data-section-title') || '';
                const counter = panel.getAttribute('data-counter') || '';
                activeWorkData = {
                  title,
                  sectionTitle: sTitle,
                  counter,
                  linkUrl: panel.getAttribute('data-link-url') || '',
                  mediaUrl: panel.getAttribute('data-media-url') || '',
                  mediaType: panel.getAttribute('data-media-type') || 'IMAGE',
                };
                updateBottomBarText(sTitle, counter);
                if (!isHeadingOverMenu) {
                  const pTone = (panel.getAttribute('data-tone') as 'light' | 'dark') || 'dark';
                  setMenuTone(pTone);
                  setBottomTone(pTone);
                }
              }
            }
          },
        },
      });

      // 1. Initial Hold: Screen pauses/stops at the exact initial view
      // (Headline band at top + First work preview card below)
      tl.to({}, { duration: holdInitial });

      // 2. Heading Band reveals First Work Panel Full-Screen smoothly:
      // Both headingBand and panelsStack slide up together so panel 1 fills 100% of screen
      const headingHeight = headingBand?.offsetHeight || Math.round(window.innerHeight * 0.48);
      tl.to(
        [headingBand, panelsStack],
        {
          y: -headingHeight,
          duration: revealHeading,
          ease: 'power1.inOut',
        },
        'reveal-first'
      );

      // 3. Hold First Panel still so user clearly sees the full work ("এক জায়গায় স্থির থাকে")
      tl.to({}, { duration: holdFirstWork });

      // 3. Work Panels transitions: signature push-and-darken
      // Next panel slides up from bottom (100% -> 0%), current panel moves up 22% and darkens 40% ("উপরের ছবিটা আগের জায়গায় স্থির থাকে, নিচে থেকে আরেকটা ছবি উপরে আসে")
      for (let i = 0; i < numPanels - 1; i++) {
        const currentWrapper = panelWrappers[i];
        const nextWrapper = panelWrappers[i + 1];
        const darkOverlay = currentWrapper.querySelector<HTMLElement>('.panel-dark-overlay');

        tl.to(
          nextWrapper,
          {
            yPercent: 0,
            ease: 'power3.inOut',
            duration: 1.0,
          },
          `panel-transition-${i}`
        );

        tl.to(
          currentWrapper,
          {
            yPercent: -22,
            ease: 'power3.inOut',
            duration: 1.0,
          },
          `panel-transition-${i}`
        );

        if (darkOverlay) {
          tl.to(
            darkOverlay,
            {
              opacity: 0.4,
              ease: 'power3.inOut',
              duration: 1.0,
            },
            `panel-transition-${i}`
          );
        }

        // Hold next panel still so user clearly sees full work
        tl.to({}, { duration: 0.6 });
      }
    });
  }

  // View Button Click: Open Lightbox with project media
  if (viewButton && lightbox) {
    viewButton.addEventListener('click', () => {
      const container = document.getElementById('lightbox-media-container');
      const titleEl = document.getElementById('lightbox-title');
      const sectionEl = document.getElementById('lightbox-section');
      const linkEl = document.getElementById('lightbox-link') as HTMLAnchorElement | null;

      if (titleEl) titleEl.textContent = activeWorkData.title || 'Project Preview';
      if (sectionEl) sectionEl.textContent = activeWorkData.sectionTitle;
      if (linkEl && activeWorkData.linkUrl) {
        linkEl.href = activeWorkData.linkUrl;
        linkEl.style.display = 'inline-block';
      } else if (linkEl) {
        linkEl.style.display = 'none';
      }

      if (container) {
        if (activeWorkData.mediaType === 'VIDEO' && activeWorkData.mediaUrl) {
          container.innerHTML = `<video src="${activeWorkData.mediaUrl}" controls autoplay muted playsinline class="w-full h-full object-contain"></video>`;
        } else if (activeWorkData.mediaUrl) {
          container.innerHTML = `<img src="${activeWorkData.mediaUrl}" alt="${activeWorkData.title}" class="w-full h-full object-contain" />`;
        } else {
          container.innerHTML = `<div class="p-12 text-center text-slate-400 font-mono">No direct media file. <br/>Use the link to view the project live.</div>`;
        }
      }

      lightbox.showModal();
    });
  }

  if (lightbox) {
    if (lightboxClose) {
      lightboxClose.addEventListener('click', () => lightbox.close());
    }
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.close();
    });
  }

  // Menu Button & Fullscreen Navigation Overlay
  if (menuButton && navOverlay) {
    let isOpen = false;
    let scrollPosBeforeOpen = 0;

    let preOpenTone: 'light' | 'dark' = 'dark';
    const toggleNav = () => {
      isOpen = !isOpen;
      if (isOpen) {
        scrollPosBeforeOpen = window.scrollY;
        preOpenTone = (menuButton.getAttribute('data-tone') as 'light' | 'dark') || 'dark';
        navOverlay.classList.remove('opacity-0', 'pointer-events-none');
        navOverlay.classList.add('opacity-100', 'pointer-events-auto');
        menuButton.setAttribute('data-tone', 'light');
      } else {
        navOverlay.classList.remove('opacity-100', 'pointer-events-auto');
        navOverlay.classList.add('opacity-0', 'pointer-events-none');
        menuButton.setAttribute('data-tone', preOpenTone);
      }
    };

    menuButton.addEventListener('click', toggleNav);

    // Back button inside overlay: returns directly to the exact session the user was in
    const backBtn = navOverlay.querySelector<HTMLElement>('#nav-overlay-back');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleNav();
        // Keep user in the exact session/scroll position they came from
        if (Math.abs(window.scrollY - scrollPosBeforeOpen) > 5) {
          if (lenis) {
            lenis.scrollTo(scrollPosBeforeOpen, { immediate: true });
          } else {
            window.scrollTo(0, scrollPosBeforeOpen);
          }
        }
      });
    }

    // Close when clicking directly on overlay backdrop
    navOverlay.addEventListener('click', (e) => {
      if (e.target === navOverlay) {
        toggleNav();
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (lightbox && lightbox.open) {
          lightbox.close();
        } else if (isOpen) {
          toggleNav();
        }
      }
    });

    // Close on link click & smooth scroll to anchor via Lenis
    navOverlay.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (link.id === 'nav-overlay-back') {
          return;
        }

        const href = link.getAttribute('href');
        if (href && (href.startsWith('#') || href.startsWith('/#'))) {
          const hash = href.includes('#') ? '#' + href.split('#')[1] : null;
          const target = hash ? document.querySelector(hash) : null;
          if (target) {
            e.preventDefault();
            toggleNav();
            if (lenis) {
              lenis.scrollTo(target as HTMLElement);
            } else {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            toggleNav();
          }
        } else {
          toggleNav();
        }
      });
    });
  }

  // Smooth scroll for topbar links (About, Works) via Lenis + Zoom & Focus on Services
  document.querySelectorAll<HTMLAnchorElement>('.topbar-nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('#') || href.startsWith('/#'))) {
        const hash = href.includes('#') ? '#' + href.split('#')[1] : null;
        if (hash) {
          const target = document.querySelector(hash);
          if (target) {
            e.preventDefault();
            if (lenis) {
              lenis.scrollTo(target as HTMLElement, { offset: -30, duration: 1.2 });
            } else {
              target.scrollIntoView({ behavior: 'smooth' });
            }

            // If navigating to #services (Works clicked), trigger zoom & focus animation
            if (hash === '#services') {
              const servicesContainer = target.querySelector('.services-container');
              const serviceItems = target.querySelectorAll('.service-row-item');
              if (servicesContainer) {
                gsap.timeline({ delay: 0.4 })
                  .fromTo(
                    servicesContainer,
                    { scale: 0.95 },
                    { scale: 1.02, duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 1 }
                  )
                  .fromTo(
                    serviceItems,
                    { x: 0 },
                    { x: 12, stagger: 0.06, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 },
                    '-=0.3'
                  );
              }
            }
          }
        }
      }
    });
  });

  // 4. Video IntersectionObserver: Play only when >=60% visible, pause otherwise, only 1 video plays at a time
  const panelVideos = document.querySelectorAll<HTMLVideoElement>('video.panel-video');
  if (panelVideos.length > 0) {
    let currentlyPlayingVideo: HTMLVideoElement | null = null;

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            if (currentlyPlayingVideo && currentlyPlayingVideo !== video) {
              currentlyPlayingVideo.pause();
            }

            currentlyPlayingVideo = video;
            video.play().catch(() => {});
          } else if (entry.intersectionRatio < 0.6) {
            if (currentlyPlayingVideo === video) {
              currentlyPlayingVideo = null;
            }
            video.pause();
          }
        });
      },
      {
        threshold: [0.0, 0.6, 1.0],
      }
    );

    panelVideos.forEach((video) => videoObserver.observe(video));
  }

  // Refresh ScrollTrigger after assets settle
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
}
