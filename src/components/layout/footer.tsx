"use client";

import { BrandLogo } from "@/components/brand/logo";
import { useI18n } from "@/components/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/80 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <BrandLogo />
        <p className="text-sm text-white/80">
          © {new Date().getFullYear()} AIDCELIX. {t.footerTagline}
        </p>
      </div>
    </footer>
  );
}
