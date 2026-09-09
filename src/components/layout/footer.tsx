import { BrandLogo } from "@/components/brand/logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/80 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <BrandLogo />
        <p className="text-sm text-white/80">© {new Date().getFullYear()} AIDCELIX. Medication search and delivery.</p>
      </div>
    </footer>
  );
}
