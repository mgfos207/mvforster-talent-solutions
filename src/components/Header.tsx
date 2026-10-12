import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand/95 backdrop-blur-xs border-b border-border">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/android-chrome-512x512.png"
              alt="MVForster Talent Solutions"
              width={150}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <div className="flex gap-8">
            <Link href="/about" className="text-on-brand-muted hover:text-on-brand transition-colors">
              About
            </Link>
            <Link href="/#services" className="text-on-brand-muted hover:text-on-brand transition-colors">
              Services
            </Link>
            <Link href="/#expertise" className="text-on-brand-muted hover:text-on-brand transition-colors">
              Expertise
            </Link>
            <Link href="/#contact" className="text-on-brand-muted hover:text-on-brand transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
