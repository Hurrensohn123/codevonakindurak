function init3DCarousel() {
  $("[carousel='component']").each(function () {
    let componentEl = $(this);
    let wrapEl = componentEl.find("[carousel='wrap']");
    let itemEl = wrapEl.children().children();
    let panelEl = componentEl.find("[carousel='panel']");
    let nextEl = componentEl.find("[carousel='next']");
    let prevEl = componentEl.find("[carousel='prev']");

    if (!itemEl.length) return;

    let rotateAmount = 360 / itemEl.length;
    let startAngle = rotateAmount; // Korrektur

    let zTranslate =
      2 * Math.tan((rotateAmount / 2) * (Math.PI / 180));

    let negTranslate = `calc(var(--3d-carousel-item-width) / -${zTranslate} - var(--3d-carousel-gap))`;
    let posTranslate = `calc(var(--3d-carousel-item-width) / ${zTranslate} + var(--3d-carousel-gap))`;

    wrapEl.css("--3d-carousel-z", negTranslate);
    wrapEl.css("--3d-carousel-start", startAngle + "deg");
    wrapEl.css("perspective", posTranslate);

    gsap.fromTo(
      wrapEl,
      { opacity: 0 },
      { opacity: 1, delay: 0.4, duration: 1 }
    );

    itemEl.each(function (index) {
      $(this).css(
        "transform",
        `rotateY(${rotateAmount * index}deg) translateZ(${posTranslate})`
      );
    });

    ScrollTrigger.create({
      trigger: componentEl[0],
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const angle =
          -(360 - rotateAmount) * self.progress;
        wrapEl[0].style.setProperty(
          "--3d-carousel-rotate",
          angle + "deg"
        );
      },
    });

    let activePanel;
    let animating = false;

    function makePanelActive(activeItem) {
      activePanel = activeItem;
      nextEl.toggleClass(
        "is-disabled",
        !activePanel.next().length
      );
      prevEl.toggleClass(
        "is-disabled",
        !activePanel.prev().length
      );
    }

    makePanelActive(panelEl.first());

    function scrollToActive() {
      animating = true;
      $("html, body").animate(
        {
          scrollTop: window.__popupIsOpen ? window.scrollY : activePanel.offset().top,
        },
        600,
        () => {
          animating = false;
        }
      );
    }

    panelEl.each(function () {
      ScrollTrigger.create({
        trigger: $(this),
        start: "top center",
        end: "bottom center",
        onToggle: ({ isActive }) => {
          if (isActive) makePanelActive($(this));
        },
      });
    });

    nextEl.on("click", function () {
      if (activePanel.next().length && !animating) {
        makePanelActive(activePanel.next());
        scrollToActive();
      }
    });

    prevEl.on("click", function () {
      if (activePanel.prev().length && !animating) {
        makePanelActive(activePanel.prev());
        scrollToActive();
      }
    });
  });

  ScrollTrigger.refresh();
}
  
function resetSkewUp() {
  document.querySelectorAll(".skew-up").forEach((el) => {
    // Original-HTML sichern / wiederherstellen
    if (!el.dataset.originalHtml) {
      el.dataset.originalHtml = el.innerHTML;
    }
    el.innerHTML = el.dataset.originalHtml;
  });
}

function initSkewUp() {
  if (typeof gsap === "undefined" || typeof SplitType === "undefined") return;
  resetSkewUp(); // immer zuerst resetten

  document.querySelectorAll(".skew-up").forEach((el) => {
    const split = new SplitType(el, {
      types: "lines, words",
      lineClass: "word-line",
    });

    const words = el.querySelectorAll(".word");
    if (!words.length) return;

    gsap.set(el, { opacity: 0 });
    gsap.set(words, { y: "100%", skewX: -6, opacity: 0 });

    const delay = el.id === "delay-skew" ? 0.5 : 0;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          gsap.to(el, { opacity: 1, duration: 0.3 });

          gsap.to(words, {
            y: "0%",
            skewX: 0,
            opacity: 1,
            duration: 1.6,
            stagger: 0.03,
            ease: "expo.out",
            delay,
          });

          obs.disconnect();
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSkewUp();
});

if (window.barba) {
  barba.hooks.after(() => {
    initSkewUp();
  });
}

const LOGO_SRC =
  "https://cdn.prod.website-files.com/65aaadc263ad4e7a6d30a425/68f9fd7f1f1ffa469996db9e_AkinDurak.svg";

let lenis = null;

function ensureOverlay() {
  let overlay = document.querySelector(".transition-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "transition-overlay";
    overlay.innerHTML =
      `<div class="transition-center">
        <div class="transition-layer logo-layer">
          <img class="transition-logo" alt="Logo" />
        </div>
        <div class="transition-layer text-layer">
          <span class="transition-text"></span>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  const logoEl = overlay.querySelector(".transition-logo");
  if (logoEl && LOGO_SRC) {
    logoEl.src = LOGO_SRC;
    logoEl.onerror = () => {
      const textLayer = overlay.querySelector(".transition-text");
      textLayer.textContent = "Akin Durak";
      textLayer.style.display = "inline-block";
      logoEl.style.display = "none";
    };
  }

  return overlay;
}

window.__transitionPayload = {
  mode: "text",
  value: "",
};

function setupTransitionClicks() {
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest(
        "a, button, .button-primary, .button-secondary, .button-link, .nav-link"
      );
      if (!el) return;

      if (el.classList.contains("nav-link")) {
        window.__transitionPayload = {
          mode: "text",
          value: (el.textContent || "").trim(),
        };
        return;
      }

      if (
        el.matches(
          ".button-primary, .button-secondary, .button-link, button"
        )
      ) {
        window.__transitionPayload = {
          mode: "logo",
          value: "",
        };
        return;
      }

      if (el.tagName && el.tagName.toLowerCase() === "a") {
        window.__transitionPayload = {
          mode: "text",
          value: (el.textContent || "").trim(),
        };
      }
    },
    true
  );
}

window.addEventListener("popstate", () => {
  window.__transitionPayload = {
    mode: "logo",
    value: "",
  };
});

function initBurgerMenu() {
  const burger = document.querySelector(".hamburger-wrapper");
  const burgerLines = document.querySelectorAll(".burger-line-2");
  const lineBlock = document.querySelector(".line-block");
  const menu = document.querySelector(".menu-outer-wrapper");
  const menuInner = document.querySelector(".menu__inner__wrap");
  const navLinks = document.querySelectorAll(".nav-link, .Link-4");
  const socialText = document.querySelectorAll(".new-text-socials");
  const numberHovers = document.querySelectorAll(".number-on-hover");
  const navMenu = document.querySelector(".nav-menü");

  if (!burger || !menu || !lineBlock || burgerLines.length === 0) {
    console.warn("Menüelemente fehlen.");
    return;
  }

  if (navMenu) navMenu.style.mixBlendMode = "difference";

  let menuOpen = false;

  if (window.gsap) {
    gsap.set(lineBlock, { scaleY: 0, opacity: 0, transformOrigin: "top" });
    gsap.set(menu, { width: 0, opacity: 0, pointerEvents: "none" });
  } else {
    lineBlock.style.opacity = "0";
    menu.style.opacity = "0";
    menu.style.pointerEvents = "none";
  }

  const openTl = gsap.timeline({ paused: true });

  openTl
    .set(menu, { display: "flex", pointerEvents: "auto" })
    .to(burgerLines, {
      y: 8,
      opacity: 0,
      stagger: 0.05,
      duration: 0.35,
      ease: "power2.inOut",
    })
    .to(
      lineBlock,
      {
        opacity: 1,
        scaleY: 1,
        duration: 0.55,
        ease: "expo.out",
      },
      "-=0.2"
    )
    .to(
      menu,
      {
        width: window.innerWidth <= 768 ? "100vw" : "50vw",
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      },
      "-=0.3"
    )
    .from(
      menuInner,
      {
        yPercent: -10,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      },
      "-=0.4"
    )
    .from(
      [...socialText, ...numberHovers, ...navLinks],
      {
        autoAlpha: 0,
        y: 25,
        stagger: 0.05,
        duration: 0.35,
        ease: "power2.out",
      },
      "-=0.4"
    );

  const closeTl = gsap.timeline({ paused: true });
  window.__closeMenuTl = closeTl;
  window.__closeMenuTl.progress(0).pause(0);

  closeTl
    .to([...navLinks, ...numberHovers, ...socialText], {
      autoAlpha: 0,
      y: 15,
      stagger: 0.03,
      duration: 0.25,
      ease: "power2.in",
    })
    .to(
      menu,
      {
        width: 0,
        opacity: 0,
        duration: 0.5,
        ease: "power3.inOut",
      },
      "-=0.2"
    )
    .to(
      lineBlock,
      {
        scaleY: 0,
        opacity: 0,
        duration: 0.4,
        ease: "expo.in",
        transformOrigin: "bottom",
      },
      "-=0.3"
    )
    .to(
      burgerLines,
      {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 0.4,
        ease: "power2.out",
      },
      "-=0.2"
    )
    .set(menu, { pointerEvents: "none" });

  function toggleMenu() {
    if (openTl.isActive() || closeTl.isActive()) return;

    if (!menuOpen) {
      openTl.play(0);
      gsap.set(["html", "body"], { overflow: "hidden" });
      document.body.classList.add("menu-open");
    } else {
      closeTl.play(0);
      gsap.set(["html", "body"], { overflow: "auto" });
      document.body.classList.remove("menu-open");
    }

    menuOpen = !menuOpen;
  }

  burger.addEventListener("click", toggleMenu);
  lineBlock.addEventListener("click", toggleMenu);

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (menuOpen) toggleMenu();
    });
  });

  console.log("Burger-Menü initialisiert");
}

function initProjectsSwiper() {
  const titles = Array.from(document.querySelectorAll(".project-title"));
  if (!titles.length) return;

  if (window.gsap) {
    const loadingAnim = gsap.timeline();
    loadingAnim.fromTo(
      ".swiper-wrapper.is-main",
      { y: "-500%", opacity: 0 },
      {
        y: "0%",
        opacity: 1,
        delay: 2.2,
        duration: 0.9,
        ease: "power2.inOut",
      }
    );
  }

  async function updateVideo(idx) {
    const videoComponent = document.querySelector(".video_component");
    const videoEmbed = document.querySelector(".video-embed video");
    const linkEl = titles[idx]?.querySelector(".video-link");

    if (!videoComponent || !videoEmbed || !linkEl) return;

    let rawLink = "";
    const deepChild = linkEl.querySelector("a, p, div, span");

    rawLink = deepChild
      ? deepChild.getAttribute("href") ||
        deepChild.textContent ||
        ""
      : linkEl.getAttribute("href") || linkEl.textContent || "";

    const videoLink = decodeURIComponent((rawLink || "").trim());

    if (
      !videoLink.includes("cdn.prod.website-files.com") ||
      !videoLink.endsWith(".mp4")
    )
      return;

    videoComponent.classList.add("is-loading");
    videoEmbed.src = videoLink;
    videoEmbed.load();

    videoEmbed.addEventListener("canplay", () => {
      videoComponent.classList.remove("is-loading");
    });

    videoEmbed.addEventListener("error", () => {
      videoComponent.classList.remove("is-loading");
    });
  }

  function updateProject(idx) {
    titles.forEach((el) => el.classList.remove("is-active"));
    titles[idx]?.classList.add("is-active");

    updateVideo(idx);

    const link =
      titles[idx]?.querySelector(".live-link")?.textContent.trim() ||
      "#";
    const heading =
      titles[idx]?.querySelector("[project-title]")?.textContent.trim() ||
      "";
    const projectLink = document.querySelector(".project-link");
    const bannerLink = document.querySelector(".banner-link");
    const bannerHeading = document.querySelector(".banner-heading");

    if (projectLink) projectLink.href = link;
    if (bannerLink) bannerLink.innerText = link;
    if (bannerHeading) bannerHeading.innerText = heading;
  }

  const mainSwiperEl = document.querySelector(".swiper.is-main");
  if (!mainSwiperEl || typeof Swiper === "undefined") return;

  const projectsSwiper = new Swiper(mainSwiperEl, {
    direction: "vertical",
    loop: false,
    mousewheel: true,
    keyboard: true,
    centeredSlides: true,
    effect: "slide",
    grabCursor: true,
    spaceBetween: 150,
    speed: 900,
    slideActiveClass: "is-active",
    navigation: {
      nextEl: document.querySelector(".swiper-next"),
      prevEl: document.querySelector(".swiper-prev"),
    },
    on: {
      init: () => updateProject(0),
    },
  });

  projectsSwiper.on("slideChange", () =>
    updateProject(projectsSwiper.activeIndex)
  );

  titles.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const index = titles.indexOf(el);
      if (index >= 0) projectsSwiper.slideTo(index, 1000);
    });
  });
}

function floatProjectSlider() {
  const el = document.querySelector(".swiper.is-main");
  if (!el || !window.gsap) return;

  gsap.to(el, {
    y: -65,
    rotation: 2.5,
    duration: 2.5,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
  });
}

  function initTeamSlider() {
  if (typeof Swiper === "undefined") return;

  const sliderEl = document.querySelector(".team_slider.swiper");
  if (!sliderEl || sliderEl.__swiper) return;

  const imgSwiper = new Swiper(sliderEl, {
    slidesPerView: "auto",
    centeredSlides: true,
    spaceBetween: 16,

    touchRatio: 1,
    threshold: 0,
    resistance: false,
    speed: 1000,

    slideToClickedSlide: false,

    navigation: {
      nextEl: '[swiper-arrow="next"]',
      prevEl: '[swiper-arrow="previous"]',
    },
  });

  const textSwiper = new Swiper(".team_text_slider.swiper", {
    allowTouchMove: false,
    direction: "vertical",
    speed: 500,
    slidesPerView: 1,
    centeredSlides: true,
  });

  const bioSwiper = new Swiper(".team_bio_slider.swiper", {
    allowTouchMove: false,
    direction: "vertical",
    speed: 500,
    slidesPerView: 1,
    centeredSlides: true,
  });

  imgSwiper.controller.control = textSwiper;
  textSwiper.controller.control = bioSwiper;

  const slides = sliderEl.querySelectorAll(".swiper-slide");
  const bioSlider = document.querySelector(".team_bio_slider");

  slides.forEach((slide) => {
    slide.style.opacity = 0;
    slide.style.transform = "translateY(50px)";
  });

  if (bioSlider) bioSlider.style.opacity = 0;

  function moveInSlides() {
    slides.forEach((slide, i) => {
      setTimeout(() => {
        slide.style.transition = "opacity 0.9s ease, transform 0.9s ease";
        slide.style.opacity = 1;
        slide.style.transform = "translateY(0)";
      }, i * 300);
    });

    setTimeout(() => {
      if (bioSlider) {
        bioSlider.style.transition = "opacity 0.8s ease";
        bioSlider.style.opacity = 1;
      }
    }, 2000);
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      if (!entries[0].isIntersecting) return;
      moveInSlides();
      obs.disconnect();
    },
    { threshold: 0.6 }
  );

  observer.observe(sliderEl);
}

function initFollowMouseArrow() {
  const triggers = document.querySelectorAll(
    ".team_slider_arrow-trigger"
  );
  if (!triggers.length) return;

  triggers.forEach((trigger) => {
    const wrapper =
      trigger.querySelector(".arrow-wrapper") || trigger;
    const arrow = trigger.querySelector(".team_slider_arrow");
    if (!arrow) return;

    gsap.set(arrow, {
      autoAlpha: 0,
      scale: 0.9,
      xPercent: -50,
      yPercent: -50,
    });

    let hovering = false;

    trigger.addEventListener("mouseenter", () => {
      hovering = true;
      gsap.to(arrow, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    });

    trigger.addEventListener("mousemove", (e) => {
      if (!hovering) return;

      const rect = wrapper.getBoundingClientRect();

      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      x = Math.max(0, Math.min(rect.width, x));
      y = Math.max(0, Math.min(rect.height, y));

      gsap.to(arrow, {
        left: x,
        top: y,
        duration: 0.15,
        ease: "power3.out",
        overwrite: "auto",
      });
    });

    trigger.addEventListener("mouseleave", () => {
      hovering = false;
      gsap.to(arrow, {
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.25,
        ease: "power2.inOut",
      });
    });
  });
}

function bindSwiperClickDelegation() {
  if (window.__swiperClickDelegationBound) return;

  window.__swiperClickDelegationBound = true;
  window.__swiperClickDelegationNavigating = false;

  document.addEventListener("click", async (e) => {
    if (window.__swiperClickDelegationNavigating) return;

    const wrapper = e.target.closest(".project-visual-wrapper");
    if (!wrapper) return;

    const slide = wrapper.closest(".swiper-slide");
    if (!slide) return;

    const realLink = slide.querySelector("a");
    const href = realLink?.href || slide.dataset.href;
    if (!href || href.startsWith("#")) return;

    e.preventDefault();

    const titleEl =
      slide.querySelector("[project-title]") ||
      slide.querySelector(".project-title") ||
      slide;
    const projectName = (titleEl?.textContent || "").trim();

    document.body.classList.add("fade-outHref");

    window.__transitionPayload = {
      mode: "text",
      value: projectName,
    };

    const overlay = ensureOverlay();
    const textEl = overlay.querySelector(".transition-text");
    const logoEl = overlay.querySelector(".transition-logo");

    const swiperContainer = document.querySelector(
      ".swiper.is-main"
    );

    gsap.set(overlay, {
      opacity: 1,
      scaleY: 0,
      transformOrigin: "top",
    });
    gsap.set([textEl, logoEl], { opacity: 0 });

    logoEl.style.display = "none";
    textEl.style.display = "inline-block";
    textEl.textContent = projectName;

    try {
      // OPEN
      await gsap.to(overlay, {
        scaleY: 1,
        duration: 1.2,
        ease: "expo.inOut",
      });

      await gsap.to(textEl, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      });

      await new Promise((r) => setTimeout(r, 400));

      await gsap.to(textEl, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
      });

      if (swiperContainer)
        gsap.set(swiperContainer, { opacity: 0 });

      await gsap.to(overlay, {
        scaleY: 0,
        duration: 1.2,
        ease: "expo.inOut",
        transformOrigin: "bottom",
      });

      window.__swiperClickDelegationNavigating = true;

      realLink.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );

      setTimeout(() => {
        window.__swiperClickDelegationNavigating = false;
      }, 2000);
    } catch (err) {
      if (window.barba) barba.go(href);
      else window.location.href = href;
    }
  });
}

function initLenis() {
  if (typeof Lenis === "undefined") return;

  lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    smoothTouch: false,
    autoResize: true,
    touchMultiplier: 1.5,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  });

  if (window.gsap) {
    gsap.ticker.add((t) => lenis.raf(t * 1000));
  }
}

function resetLenisScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
}

function connectLenisToScrollTrigger() {
  if (!lenis || !ScrollTrigger) return;

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function initFreieArbeiten() {
  if (document.querySelector("iframe.freie-iframe")) return;

  const iframe = document.createElement("iframe");
  iframe.src = "https://3d-gallery-x.vercel.app";
  iframe.className = "freie-iframe";
  iframe.loading = "eager";

  if (window.innerWidth <= 768) {
    Object.assign(iframe.style, {
      position: "fixed",
      top: "15%",
      left: "50%",
      transform: "translateX(-50%)",
      width: "100vw",
      height: "100vh",
      border: "none",
      zIndex: "1",
      display: "block",
    });
  } else {

    Object.assign(iframe.style, {
      position: "fixed",
      inset: "0",
      width: "100vw",
      height: "100vh",
      border: "none",
      margin: "0",
      padding: "0",
      zIndex: "1",
      display: "block",
    });
  }

  document.body.appendChild(iframe);

  const hideSelectors = [
    ".main-wrapper",
    ".main_wrapper",
    ".mainwrapper",
    ".footer-wrapper",
    ".footer_wrapper",
    ".footerwrapper",
    ".padding-global",
    ".page-content",
  ];

  hideSelectors.forEach((sel) =>
    document.querySelectorAll(sel).forEach((el) => {
      el.dataset.prevDisplay = el.style.display;
      el.style.display = "none";
    })
  );

  const showSelectors = [
    ".nav-menü",
    ".nav-menu",
    ".menü-outer-wrapper",
    ".menu-outer-wrapper",
    ".nav",
    ".navbar",
  ];

  showSelectors.forEach((sel) =>
    document.querySelectorAll(sel).forEach((el) => {
      if (!el.dataset.prevPosition) {
        el.dataset.prevPosition = getComputedStyle(el).position;
      }

      el.style.position =
        getComputedStyle(el).position === "fixed"
          ? "fixed"
          : "relative";

      el.style.zIndex = "10";
      el.style.display = "";
    })
  );

  const menuWrapper =
    document.querySelector(".menü-outer-wrapper") ||
    document.querySelector(".menu-outer-wrapper");

  if (menuWrapper) {
    menuWrapper.style.position =
      menuWrapper.style.position || "relative";
    menuWrapper.style.zIndex = "11";
  }

  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function cleanupFreieArbeiten() {
  const iframe = document.querySelector("iframe.freie-iframe");
  if (iframe) iframe.remove();

  document
    .querySelectorAll("[data-prev-display]")
    .forEach((el) => {
      el.style.display = el.dataset.prevDisplay || "";
    });

  document
    .querySelectorAll("[data-prevPosition]")
    .forEach((el) => {
      el.style.position = el.dataset.prevPosition || "";
    });

  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

function injectMenuFixCSS() {
  const styleFix = document.createElement("style");

  styleFix.innerHTML = `
.menu-outer-wrapper {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  height: 100vh !important;
  width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 6 !important;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: width, opacity;
}

.hamburger-wrapper {
  position: relative;
  z-index: 10000 !important;
  cursor: pointer;
  pointer-events: auto;
}

.nav-menu {
  mix-blend-mode: difference;
  z-index: 10001;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
}
`;

  document.head.appendChild(styleFix);
}

function runPreloaderOncePerTab() {
  const FLAG = "preloader_shown_v1";
  if (sessionStorage.getItem(FLAG)) return;

  sessionStorage.setItem(FLAG, "1");

  const pre = document.createElement("div");
  pre.className = "preloader";
  pre.innerHTML = `<div class="preloader-percent">0%</div>`;
  document.body.appendChild(pre);

  const style = document.createElement("style");
  style.textContent = `
.preloader {
  position: fixed;
  inset: 0;
  background: #fff;
  z-index: 99999;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 3rem;
  pointer-events: none;
}

.preloader-percent {
  font-family: "Urbanist", system-ui, -apple-system, sans-serif;
  font-size: 42px;
  font-weight: 500;
  color: #000;
  letter-spacing: 0.02em;
}
`;

  document.head.appendChild(style);

  const percent = pre.querySelector(".preloader-percent");
  const current = { value: 0 };

  const delayElement = document.querySelector("#delay-skew");
  if (delayElement) delayElement.style.opacity = 0;

  gsap.to(current, {
    value: 100,
    duration: 1,
    onUpdate: () =>
      (percent.textContent = `${Math.round(
        current.value
      )}%`),
    onComplete: () => {
      gsap.to(pre, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => pre.remove(),
      });
    },
  });

  if (delayElement) {
    const text = new SplitType(delayElement, {
      types: "lines, words",
      lineClass: "word-line",
    });

    const word = delayElement.querySelectorAll(
      ".word-line .word"
    );

    gsap.fromTo(
      word,
      { y: "100%", skewX: "-6", opacity: 0 },
      {
        y: "0%",
        skewX: "0",
        opacity: 1,
        duration: 2,
        stagger: 0.03,
        ease: "expo.out",
      }
    );
  }

  initSkewUp();
}

document.addEventListener("DOMContentLoaded", runPreloaderOncePerTab);

function applyHamburgerVisibilityFix() {
  const burger = document.querySelector(".hamburger-wrapper");
  const menuOuter =
    document.querySelector(".menu-outer-wrapper") ||
    document.querySelector(".menü-outer-wrapper");

  if (burger) {
    burger.style.zIndex = "10000";
    burger.style.pointerEvents = "auto";
    burger.style.opacity = "1";
    burger.style.display = "block";
  }

  if (menuOuter) {
    menuOuter.style.zIndex = "9999";
    menuOuter.style.pointerEvents = "none";
    menuOuter.style.opacity = "0";
    menuOuter.style.display = "flex";
  }
}

function initServiceCardPopups() {
  if (window.innerWidth < 992) return;

  const cards = document.querySelectorAll(".services_card-inner");
  const popups = {
    pricing: document.querySelector(".pricing-card-element"),
    trust: document.querySelector(".trust-card-element"),
    collaboration: document.querySelector(".collaboration-card-element"),
  };

  if (!cards.length) return;

  function hideAllPopups() {
    Object.values(popups).forEach((el) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    });
  }

  hideAllPopups();

  cards.forEach((card) => {
    const key = card.dataset.popup; // "pricing", "trust", "collaboration"
    const popup = popups[key];
    if (!popup) return;

    card.addEventListener("mouseenter", () => {
      hideAllPopups();
      popup.style.opacity = "1";
      popup.style.pointerEvents = "auto";
    });

    card.addEventListener("mouseleave", hideAllPopups);
  });
}

document.addEventListener("DOMContentLoaded", initServiceCardPopups);

if (window.barba) {
  barba.hooks.afterEnter(() => {
    initServiceCardPopups();
  });
}

function initBarbaAndTransitions() {
  if (typeof barba === "undefined") return;

  barba.init({
    transitions: [
      {
        name: "luxury-overlay-dynamic",

        async leave(data) {
          if (lenis) lenis.stop?.();

          const iframe = document.querySelector(
            "iframe.freie-iframe"
          );
          if (iframe) {
            if (gsap) {
              await gsap.to(iframe, {
                opacity: 0,
                duration: 0.6,
                ease: "power2.inOut",
              });
            }
            iframe.remove();
          }

          const overlay = ensureOverlay();
          const textEl = overlay.querySelector(".transition-text");
          const logoEl = overlay.querySelector(".transition-logo");

          const payload =
            window.__transitionPayload || {
              mode: "logo",
              value: "",
            };

          if (gsap) {
            gsap.set(overlay, {
              opacity: 1,
              scaleY: 0,
              transformOrigin: "top",
            });
            gsap.set([textEl, logoEl], { opacity: 0 });
          }

          if (payload.mode === "logo") {
            logoEl.style.display = "block";
            textEl.style.display = "none";
          } else {
            textEl.textContent = payload.value;
            textEl.style.display = "inline-block";
            logoEl.style.display = "none";
          }

          if (gsap) {
            await gsap.to(overlay, {
              scaleY: 1,
              duration: 1.2,
              ease: "expo.inOut",
            });

            const el =
              payload.mode === "logo" ? logoEl : textEl;

            await gsap.to(el, {
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
            });

            await new Promise((r) => setTimeout(r, 400));

            await gsap.to(el, {
              opacity: 0,
              duration: 0.8,
              ease: "power2.inOut",
            });

            await gsap.to(data.current.container, {
              opacity: 0,
              duration: 0.3,
              ease: "power1.out",
            });
          }
        },

        async enter(data) {
          const overlay = document.querySelector(
            ".transition-overlay"
          );

          if (gsap) {
            await gsap.to(overlay, {
              scaleY: 0,
              duration: 1.2,
              ease: "expo.inOut",
              transformOrigin: "bottom",
            });

            gsap.from(data.next.container, {
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
            });
          }

          resetLenisScroll();
          lenis?.start?.();

          window.__transitionPayload = {
            mode: "text",
            value: "",
          };
        },
      },
    ],

    views: [
      {
        namespace: "home",
        afterEnter() {
          initProjectsSwiper();
          initFollowMouseArrow();
          initProfileAnimation();
          initPopups();
          initServiceCardPopups();
          initStaggerLinks();
        },
      },
      {
        namespace: "freie-arbeiten",
        afterEnter() {
          initFreieArbeiten();
        },
      },
      {
        namespace: "beruflicher-hintergrund",
        afterEnter() {
          gsap.from(".timeline-item", {
            opacity: 0,
            y: 40,
            stagger: 0.1,
            ease: "power2.out",
          });
        },
      },
      {
        namespace: "email",
        afterEnter() {
          gsap.from(".contact-section", {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: "power2.out",
          });
        },
      },
      {
        namespace: "bolide1",
        afterEnter() {
          gsap.from(".case-hero", {
            opacity: 0,
            y: 60,
            duration: 1,
            ease: "power2.out",
          });
        },
      },
      {
        namespace: "intello",
        afterEnter() {
          gsap.from(".case-hero", {
            opacity: 0,
            y: 60,
            duration: 1,
            ease: "power2.out",
          });
        },
      },
      {
        namespace: "project",
        afterEnter() {
          gsap.from(".project-hero, .project-details", {
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.1,
          });

          if (window.Webflow) {
            Webflow.destroy();
            Webflow.ready();
            Webflow.require("ix2").init();
          }
        },
      },
    ],
  });

  barba.hooks.beforeLeave((data) => {
    if (document.body.classList.contains("menu-open")) {
      document.body.classList.remove("menu-open");
      gsap.set(["html", "body"], { overflow: "" });
      window.__closeMenuTl?.restart(true);
    }

    if (data.current?.namespace === "freie-arbeiten") {
      const iframe = document.querySelector("iframe.freie-iframe");
      if (iframe) {
        gsap.to(iframe, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          pointerEvents: "none",
        });
        setTimeout(() => {
          cleanupFreieArbeiten();
        }, 400);
      }
    }
  });

  barba.hooks.after((data) => {
    const oldPage = data?.old?.container;
    if (oldPage && oldPage.remove) oldPage.remove();

    if (lenis && lenis.destroy) lenis.destroy();

    initLenis();
    resetLenisScroll();

    init3DCarousel();

    requestAnimationFrame(() => {
      lenis?.resize?.();
      ScrollTrigger?.refresh(true);
    });

    setTimeout(() => {
      lenis?.resize?.();
      ScrollTrigger?.refresh(true);
    }, 200);

    
    initFollowMouseArrow();
    initProjectsSwiper();
    bindSwiperClickDelegation();
    floatProjectSlider();
    initProfileAnimation();
    initPopups();
    initTeamSlider();
    initServiceCardPopups();
    initStaggerLinks();
    initCountdown();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  injectBaseStyles();
  injectMenuFixCSS();
  ensureOverlay();
  setupTransitionClicks();
  bindSwiperClickDelegation();
  initLenis();
  initBurgerMenu();
  initFollowMouseArrow();
  initProjectsSwiper();
  floatProjectSlider();
  init3DCarousel();
  runPreloaderOncePerTab();
  initProfileAnimation();
  initPopups();
  initTeamSlider();
  initServiceCardPopups();
  initStaggerLinks();
  initCountdown();
  
  if (location.pathname.includes("freie-arbeiten")) {
    initFreieArbeiten();
  } else {
    cleanupFreieArbeiten();
  }

  if (location.pathname === "/" || location.pathname === "/index.html") {
    setTimeout(() => ScrollTrigger?.refresh(), 200);
  } else {
    ScrollTrigger?.refresh();
  }

  applyHamburgerVisibilityFix();
  initBarbaAndTransitions();

  console.log("Setup abgeschlossen");

function initProfileAnimation() {
  const trigger = document.querySelector(".lottie-inner");
  const first = document.querySelector(".first-name");
  const last = document.querySelector(".last-name");
  const picture = document.querySelector(".profilepicture-content");

  if (!trigger || !first || !last || !picture) return;

  const config = [
    { mq: "(max-width: 479px)", first: -40, last: 40, pic: -85 },
    {
      mq: "(min-width: 480px) and (max-width: 767px)",
      first: -55,
      last: 55,
      pic: -80,
    },
    {
      mq: "(min-width: 768px) and (max-width: 991px)",
      first: -70,
      last: 70,
      pic: -80,
    },
    {
      mq: "(min-width: 992px) and (max-width: 1279px)",
      first: -90,
      last: 90,
      pic: -85,
    },
    {
      mq: "(min-width: 1280px) and (max-width: 1439px)",
      first: -110,
      last: 110,
      pic: -85,
    },
    {
      mq: "(min-width: 1440px) and (max-width: 1919px)",
      first: -130,
      last: 130,
      pic: -115,
    },
    { mq: "(min-width: 1920px)", first: -150, last: 150, pic: -220 },
  ];

  function getValues() {
    for (let c of config) {
      if (window.matchMedia(c.mq).matches) return c;
    }
    return config[0];
  }

  gsap.set(first, { x: 0 });
  gsap.set(last, { x: 0 });
  gsap.set(picture, { opacity: 0, x: 150 });

  let open = false;

  trigger.addEventListener("click", () => {
    const v = getValues();

    if (!open) {
      gsap.to(first, {
        x: v.first,
        duration: 1,
        ease: "expo.out",
      });
      gsap.to(last, {
        x: v.last,
        duration: 1,
        ease: "expo.out",
      });
      gsap.to(picture, {
        opacity: 1,
        x: v.pic,
        duration: 1,
        ease: "expo.out",
      });

      open = true;
    } else {
      gsap.to(first, {
        x: 0,
        duration: 1,
        ease: "expo.out",
      });
      gsap.to(last, {
        x: 0,
        duration: 1,
        ease: "expo.out",
      });
      gsap.to(picture, {
        opacity: 0,
        x: 150,
        duration: 1,
        ease: "expo.out",
      });

      open = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    Webflow.require("lottie").init();
  } catch (e) {}
  initProfileAnimation();
});

if (window.barba) {
  barba.hooks.afterEnter(() => {
    try {
      Webflow.require("lottie").init();
    } catch (e) {}
    initProfileAnimation();
  });
}

function initPopups() {
  document.removeEventListener("click", window.__popupDelegationHandler);

  window.__popupDelegationHandler = function (e) {

    // -----------------------------
    // OPEN POPUP (button-X)
    // -----------------------------
    const btn = e.target.closest("[class^='button-']");
    if (btn) {
      const btnClass = [...btn.classList].find(c => c.startsWith("button-"));
      if (!btnClass) return;

      const number = btnClass.split("-")[1];

      let popup =
        document.querySelector(".popup-wrapper-" + number) ||
        document.querySelector(".popup-wrapper_content-" + number);

      if (!popup) return;

      const bg =
        popup.querySelector(".popup-background") ||
        document.querySelector(".popup-background");

      gsap.killTweensOf([popup, bg]);

      if (bg) gsap.set(bg, { autoAlpha: 1, pointerEvents: "auto" });

      gsap.set(popup, { autoAlpha: 0, display: "flex" });

      // SAVE SCROLL POSITION
      window.__lockScrollY = window.scrollY;

      // iOS-SAFE LOCK (Body festnageln)
      document.body.style.position = "fixed";
      document.body.style.top = `-${window.__lockScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";

      // Lenis pausieren
      if (window.lenis?.stop) {
        try { lenis.stop(); } catch(e){}
      }

      popup.classList.add("popup-open");

      gsap.to(popup, {
        autoAlpha: 1,
        duration: 0.35,
        ease: "power2.out"
      });
      // Layout neu messen — wichtig für den Kreis-Slider
if (window.ScrollTrigger) {
  ScrollTrigger.refresh();
}
      return;
    }

    // -----------------------------
    // CLICK ON BACKGROUND (close)
    // -----------------------------
    const bg = e.target.closest(".popup-background");
    if (bg) {
      closePopup(getPopupWrapper(bg));
      return;
    }

    // -----------------------------
    // CLICK ON X (close)
    // -----------------------------
    const closeBtn = e.target.closest(".popup-close");
    if (closeBtn) {
      closePopup(getPopupWrapper(closeBtn));
      return;
    }
  };

  document.addEventListener("click", window.__popupDelegationHandler);


  // Resolve wrapper
  function getPopupWrapper(el) {
    let popup = el.closest("[class^='popup-wrapper-']");
    if (!popup) popup = el.closest("[class*='popup-wrapper']");
    return popup;
  }


  // -----------------------------
  // CLOSE
  // -----------------------------
  function closePopup(popup) {
    if (!popup) return;

    const bg =
      popup.querySelector(".popup-background") ||
      document.querySelector(".popup-background");

    gsap.killTweensOf([popup, bg]);

    gsap.to(popup, {
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        popup.classList.remove("popup-open");
        popup.style.display = "none";

        // BODY unlock
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";

        // zurück zur alten Position
        window.scrollTo(0, window.__lockScrollY || 0);

        // Lenis weiter
        if (window.lenis?.start) {
          try { lenis.start(); } catch(e){}
        }

        // ScrollTrigger wieder aktivieren
        if (window.__pausedTriggers) {
          window.__pausedTriggers.forEach(t => t.enable());
          window.__pausedTriggers = null;
        }
      }
    });

    if (bg) {
      gsap.to(bg, {
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => (bg.style.pointerEvents = "none")
      });
    }
  }
}
  
function initStaggerLinks() {
  let splitText;

  function runSplit() {
    splitText = new SplitType("[stagger-link]", {
      types: "words, chars"
    });
  }

  runSplit();

  // Update on resize
  let windowWidth = $(window).innerWidth();
  window.addEventListener("resize", () => {
    if (windowWidth !== $(window).innerWidth()) {
      windowWidth = $(window).innerWidth();
      if (splitText && splitText.revert) splitText.revert();
      runSplit();
    }
  });

  // Hover animation
  const staggerLinks = document.querySelectorAll("[stagger-link]");
  staggerLinks.forEach((link) => {
    const letters = link.querySelectorAll("[stagger-link-text] .char");

    link.addEventListener("click", () => {
      gsap.to(letters, {
        yPercent: -100,
        duration: 0.5,
        ease: "power4.inOut",
        stagger: { each: 0.01 },
        overwrite: true,
      });
    });
  });
}
  
  function initCountdown() {
  const el = document.querySelector("[data-countdown]");
  if (!el) return;

  if (el.__countdownRunning) return;
  el.__countdownRunning = true;

  const targetStr =
    el.getAttribute("data-target") || "December 31, 2025 23:59:59";
  const targetDate = new Date(targetStr).getTime();

  if (isNaN(targetDate)) {
    el.textContent = "Ungültiges Datum";
    return;
  }

  function tick() {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance <= 0) {
      clearInterval(interval);
      el.textContent = el.getAttribute("data-finished") || "Das Ziel ist erreicht!";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    el.textContent =
      `${days.toString().padStart(2, "0")}:` +
      `${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}`;
  }

 tick(); // sofort rendern

let interval = setInterval(tick, 1000);
}

window.addEventListener("load", () => {
  if (window.lenis) window.lenis.start();
});
// globaler Status – sagt uns, ob ein Popup offen ist
window.__popupIsOpen = false;
