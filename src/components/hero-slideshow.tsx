"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/hero/pharmacy.jpg", alt: "Pharmacy shelves" },
  { src: "/hero/medicines.jpg", alt: "Medications" },
  { src: "/hero/delivery.jpg", alt: "Medicine delivery" },
  { src: "/hero/care.jpg", alt: "Pharmacist with a customer" },
];

const INTERVAL_MS = 5000;

export function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateX(${(i - index) * 100}%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.src} alt="" className="h-full w-full object-cover" />
        </div>
      ))}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-8 bg-white" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
