import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function BrandLogo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      <Image src="/logo.svg" alt="AIDCELIX" width={36} height={36} className="rounded-xl shadow-[0_0_20px_rgba(15,155,142,0.35)]" />
      {showWordmark ? (
        <span className="text-xl font-bold tracking-tight text-white">
          AID<span className="text-emerald-400">CELIX</span>
        </span>
      ) : null}
    </Link>
  );
}
