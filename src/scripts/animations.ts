import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type AnimationName = "fade-up" | "fade-down" | "fade-left" | "fade-right";

const animationClassMap: Record<AnimationName, string> = {
  "fade-up": "gsap-fade-up",
  "fade-down": "gsap-fade-down",
  "fade-left": "gsap-fade-left",
  "fade-right": "gsap-fade-right",
};

const animationOffsets: Record<AnimationName, { x: number; y: number }> = {
  "fade-up": { x: 0, y: 42 },
  "fade-down": { x: 0, y: -42 },
  "fade-left": { x: 42, y: 0 },
  "fade-right": { x: -42, y: 0 },
};

const animationSelector = [
  "[data-animate]",
  ".gsap-fade-up",
  ".gsap-fade-down",
  ".gsap-fade-left",
  ".gsap-fade-right",
].join(", ");

const animatedElements = new WeakSet<HTMLElement>();

const isAnimationName = (value: string | undefined): value is AnimationName =>
  value === "fade-up" ||
  value === "fade-down" ||
  value === "fade-left" ||
  value === "fade-right";

const readNumber = (
  element: HTMLElement,
  key: keyof HTMLElement["dataset"],
  fallback: number,
) => {
  const value = element.dataset[key];
  const parsedValue = value ? Number(value) : Number.NaN;

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const getAnimationName = (element: HTMLElement): AnimationName => {
  if (isAnimationName(element.dataset.animate)) {
    return element.dataset.animate;
  }

  const classMatch = Object.entries(animationClassMap).find(([, className]) =>
    element.classList.contains(className),
  );

  return classMatch ? classMatch[0] : "fade-up";
};

const initGsapAnimations = () => {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(animationSelector),
  ).filter((element) => !animatedElements.has(element));

  if (elements.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (prefersReducedMotion) {
    gsap.set(elements, { autoAlpha: 1, clearProps: "transform,visibility" });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  elements.forEach((element) => {
    animatedElements.add(element);

    const animationName = getAnimationName(element);
    const distance = readNumber(element, "animateDistance", 42);
    const duration = readNumber(element, "animateDuration", 0.85);
    const delay = readNumber(element, "animateDelay", 0);
    const trigger = element.dataset.animateTrigger || "scroll";
    const start = element.dataset.animateStart || "top 84%";
    const once = element.dataset.animateOnce !== "false";
    const offset = animationOffsets[animationName];

    const animationProps = {
      autoAlpha: 1,
      x: 0,
      y: 0,
      delay,
      duration,
      ease: "power3.out",
    };

    if (trigger === "load") {
      gsap.fromTo(
        element,
        {
          autoAlpha: 0,
          x: offset.x === 0 ? 0 : Math.sign(offset.x) * distance,
          y: offset.y === 0 ? 0 : Math.sign(offset.y) * distance,
        },
        animationProps,
      );
      return;
    }

    gsap.fromTo(
      element,
      {
        autoAlpha: 0,
        x: offset.x === 0 ? 0 : Math.sign(offset.x) * distance,
        y: offset.y === 0 ? 0 : Math.sign(offset.y) * distance,
      },
      {
        ...animationProps,
        scrollTrigger: {
          trigger: element,
          start,
          once,
        },
      },
    );
  });

  ScrollTrigger.refresh();
};

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", initGsapAnimations);
  document.addEventListener("astro:page-load", initGsapAnimations);
}
