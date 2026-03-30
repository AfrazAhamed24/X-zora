document.documentElement.classList.add("js");

if (typeof gsap === "undefined") {
  // Ensure content remains visible if GSAP fails to load.
  document.documentElement.classList.remove("js");
}

const container = document.getElementById("bg-canvas");
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x05050a, 70, 280);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 120);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileViewport ? 1.2 : 1.6));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0x3f3f6b, 0.8);
scene.add(ambient);

const blueLight = new THREE.PointLight(0x4dd0ff, 1.2, 300);
blueLight.position.set(60, 40, 120);
scene.add(blueLight);

const purpleLight = new THREE.PointLight(0x8e5bff, 1.1, 300);
purpleLight.position.set(-80, -20, 140);
scene.add(purpleLight);

const loader = new THREE.GLTFLoader();
const modelGroup = new THREE.Group();
scene.add(modelGroup);

let model = null;
const scrollState = { progress: 0 };
const targetPosition = new THREE.Vector3();
const targetRotation = new THREE.Euler();
const targetGroup = new THREE.Vector3();
const currentGroup = new THREE.Vector3();
const mouseState = { x: 0, y: 0, targetX: 0, targetY: 0 };

const keyframes = [
  { p: 0, position: { x: 0, y: -8, z: -8 }, rotation: { x: 0.1, y: 0.4, z: 0 }, group: { x: 0, y: 0, z: 0 } },
  { p: 0.25, position: { x: 12, y: -4, z: 12 }, rotation: { x: 0.25, y: 1.4, z: -0.12 }, group: { x: -10, y: 5, z: 0 } },
  { p: 0.5, position: { x: -16, y: -1, z: 26 }, rotation: { x: -0.12, y: 2.8, z: 0.16 }, group: { x: 12, y: 7, z: 0 } },
  { p: 0.75, position: { x: 10, y: -6, z: 18 }, rotation: { x: 0.32, y: 3.8, z: -0.08 }, group: { x: -6, y: 3, z: 0 } },
  { p: 1, position: { x: 0, y: -12, z: 42 }, rotation: { x: 0.15, y: 4.6, z: 0 }, group: { x: 0, y: 0, z: 0 } },
];

const lerp = (start, end, t) => start + (end - start) * t;

const interpolateFrames = (progress) => {
  for (let i = 0; i < keyframes.length - 1; i += 1) {
    const current = keyframes[i];
    const next = keyframes[i + 1];
    if (progress >= current.p && progress <= next.p) {
      const local = (progress - current.p) / (next.p - current.p);
      return {
        position: {
          x: lerp(current.position.x, next.position.x, local),
          y: lerp(current.position.y, next.position.y, local),
          z: lerp(current.position.z, next.position.z, local),
        },
        rotation: {
          x: lerp(current.rotation.x, next.rotation.x, local),
          y: lerp(current.rotation.y, next.rotation.y, local),
          z: lerp(current.rotation.z, next.rotation.z, local),
        },
        group: {
          x: lerp(current.group.x, next.group.x, local),
          y: lerp(current.group.y, next.group.y, local),
          z: lerp(current.group.z, next.group.z, local),
        },
      };
    }
  }
  return keyframes[keyframes.length - 1];
};

const loadModel = () => {
  loader.load(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
    (gltf) => {
      model = gltf.scene;
      model.scale.set(28, 28, 28);
      model.position.set(0, -8, 0);

      model.traverse((child) => {
        if (child.isMesh && child.material) {
          if (child.material.emissive) {
            child.material.emissive.setHex(0x1b1f52);
            child.material.emissiveIntensity = 0.45;
          }
          child.material.metalness = Math.min(child.material.metalness || 0.6, 0.9);
          child.material.roughness = Math.max(child.material.roughness || 0.3, 0.25);
        }
      });

      modelGroup.add(model);
      initScrollAnimations();
    },
    undefined,
    () => {
      model = null;
    }
  );
};

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(loadModel, { timeout: 1200 });
} else {
  window.setTimeout(loadModel, 200);
}

let scrollInitDone = false;

function initScrollAnimations() {
  if (scrollInitDone || typeof gsap === "undefined") return;
  scrollInitDone = true;
  gsap.registerPlugin(ScrollTrigger);

  gsap.set(".reveal", { autoAlpha: 0, y: 30 });

  gsap.to(scrollState, {
    progress: 1,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2,
    },
  });

  gsap.utils.toArray(".reveal").forEach((section) => {
    gsap.fromTo(
      section,
      { autoAlpha: 0, y: 40 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
        },
      }
    );
  });

  gsap.utils.toArray("[data-stagger]").forEach((wrapper) => {
    const items = wrapper.querySelectorAll(".card, .mini-card, .cred-card, .quote, .step, .stat");
    if (!items.length) return;
    gsap.fromTo(
      items,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: wrapper,
          start: "top 80%",
        },
      }
    );
  });

  gsap.utils.toArray(".section").forEach((section) => {
    gsap.to(section, {
      y: -24,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

initScrollAnimations();

const parallaxItems = Array.from(document.querySelectorAll(".parallax"));
const heroSection = document.querySelector(".hero");
const backgroundSections = Array.from(document.querySelectorAll(".bg-parallax"));
const motionImages = Array.from(document.querySelectorAll(".motion-image"));
const carouselMediaCards = Array.from(document.querySelectorAll(".carousel__card"));
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

if (!isTouchDevice) {
  window.addEventListener("mousemove", (event) => {
    mouseState.targetX = event.clientX / window.innerWidth - 0.5;
    mouseState.targetY = event.clientY / window.innerHeight - 0.5;
  });
}

function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.001;

  mouseState.x += (mouseState.targetX - mouseState.x) * 0.05;
  mouseState.y += (mouseState.targetY - mouseState.y) * 0.05;

  if (!isTouchDevice) {
    parallaxItems.forEach((item, index) => {
      const depth = (index + 1) * 8;
      item.style.transform = `translate3d(${mouseState.x * depth}px, ${mouseState.y * depth}px, 0)`;
    });
  }

  if (heroSection) {
    const heroShift = -scrollState.progress * 10 + (isTouchDevice ? 0 : mouseState.y * 5);
    const heroScale = 1.01 + scrollState.progress * 0.01;
    heroSection.style.setProperty("--hero-shift", `${heroShift.toFixed(2)}px`);
    heroSection.style.setProperty("--hero-scale", heroScale.toFixed(3));
  }

  if (backgroundSections.length) {
    const viewportCenter = window.innerHeight * 0.5;
    backgroundSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height * 0.5;
      const distance = (viewportCenter - sectionCenter) / window.innerHeight;
      const shift = Math.max(-14, Math.min(14, distance * 24));
      const scale = 1.01 + Math.min(0.01, Math.abs(distance) * 0.016);
      section.style.setProperty("--section-shift", `${shift.toFixed(2)}px`);
      section.style.setProperty("--section-scale", scale.toFixed(3));
    });
  }

  if (motionImages.length) {
    const viewportCenter = window.innerHeight * 0.5;
    motionImages.forEach((image) => {
      const rect = image.getBoundingClientRect();
      const imageCenter = rect.top + rect.height * 0.5;
      const distance = (viewportCenter - imageCenter) / window.innerHeight;
      const shift = Math.max(-10, Math.min(10, distance * 24));
      const scale = 1 + (1 - Math.min(1, Math.abs(distance) * 1.4)) * 0.05;
      image.style.setProperty("--img-shift", `${shift.toFixed(2)}px`);
      image.style.setProperty("--img-scale", scale.toFixed(3));
    });
  }

  if (carouselMediaCards.length) {
    const viewportCenter = window.innerHeight * 0.5;
    carouselMediaCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height * 0.5;
      const distance = (viewportCenter - cardCenter) / window.innerHeight;
      const shift = Math.max(-12, Math.min(12, distance * 18));
      const scale = 1.02 + (1 - Math.min(1, Math.abs(distance) * 1.6)) * 0.03;
      card.style.setProperty("--media-shift", `${shift.toFixed(2)}px`);
      card.style.setProperty("--media-scale", scale.toFixed(3));
    });
  }

  if (model) {
    const frame = interpolateFrames(scrollState.progress);
    targetPosition.set(frame.position.x, frame.position.y, frame.position.z);
    targetRotation.set(frame.rotation.x, frame.rotation.y, frame.rotation.z);
    targetGroup.set(frame.group.x, frame.group.y, frame.group.z);

    model.position.lerp(targetPosition, 0.06);
    const parallaxRotX = mouseState.y * 0.25;
    const parallaxRotY = mouseState.x * 0.3;
    model.rotation.x += (targetRotation.x + parallaxRotX - model.rotation.x) * 0.05;
    model.rotation.y += (targetRotation.y + parallaxRotY - model.rotation.y) * 0.04;
    model.rotation.z += (targetRotation.z - model.rotation.z) * 0.04;

    currentGroup.lerp(targetGroup, 0.05);
    const floatY = Math.sin(time * 0.9) * 1.3;
    const floatX = Math.cos(time * 0.6) * 0.6;
    const parallaxX = mouseState.x * 6;
    const parallaxY = mouseState.y * 6;
    modelGroup.position.set(
      currentGroup.x + floatX + parallaxX,
      currentGroup.y + floatY + parallaxY,
      currentGroup.z
    );
  }

  const targetCamZ = 120 - scrollState.progress * 30;
  const targetCamY = 10 + scrollState.progress * 6;
  camera.position.z += (targetCamZ - camera.position.z) * 0.05;
  camera.position.y += (targetCamY - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const mobileResize = window.matchMedia("(max-width: 768px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileResize ? 1.2 : 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);
animate();


const navToggle = document.querySelector(".nav__toggle");
const navLinks = document.querySelector(".nav__links");

if (navToggle && navLinks) {
  const closeMenu = () => {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      closeMenu();
    }
  });
}

const carouselTrack = document.querySelector("[data-carousel]");
const carouselCards = carouselTrack ? Array.from(carouselTrack.querySelectorAll(".carousel__card")) : [];
const prevButton = document.querySelector(".carousel__control--prev");
const nextButton = document.querySelector(".carousel__control--next");
let carouselIndex = 0;
let carouselTimer = null;

const updateCarousel = () => {
  if (!carouselCards.length) return;
  carouselCards.forEach((card, index) => {
    card.classList.remove("is-left", "is-right", "is-center", "is-far");
    const offset = index - carouselIndex;
    if (offset === 0) {
      card.classList.add("is-center");
    } else if (offset === -1) {
      card.classList.add("is-left");
    } else if (offset === 1) {
      card.classList.add("is-right");
    } else if (Math.abs(offset) > 1) {
      card.classList.add("is-far");
    }
  });
};

const stepCarousel = (direction) => {
  if (!carouselCards.length) return;
  carouselIndex = (carouselIndex + direction + carouselCards.length) % carouselCards.length;
  updateCarousel();
};

const startCarousel = () => {
  if (!carouselCards.length) return;
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = setInterval(() => stepCarousel(1), 3500);
};

if (carouselCards.length) {
  updateCarousel();
  startCarousel();

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      stepCarousel(-1);
      startCarousel();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      stepCarousel(1);
      startCarousel();
    });
  }

  carouselCards.forEach((card, index) => {
    card.addEventListener("mouseenter", () => {
      carouselIndex = index;
      updateCarousel();
      if (carouselTimer) clearInterval(carouselTimer);
    });

    card.addEventListener("mouseleave", () => {
      startCarousel();
    });
  });
}
