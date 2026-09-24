import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function BrandLogo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <Link href="/" prefetch data-press className={cn("flex items-center gap-2 group", className)}>
      <Image src="/logo.svg" alt="AIDCELIX" width={36} height={36} className="h-8 w-8 rounded-xl shadow-[0_0_20px_rgba(15,155,142,0.35)] sm:h-9 sm:w-9" />
      {showWordmark ? (
        <span className="text-sm font-bold tracking-tight text-white sm:text-xl">
          AID<span className="text-emerald-400">CELIX</span>
        </span>
      ) : null}
    </Link>
  );
}
