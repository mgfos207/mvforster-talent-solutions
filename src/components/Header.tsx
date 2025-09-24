import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary dark:text-primary-light">
            MVForster Talent Solutions
          </Link>
          <div className="flex gap-8">
            <Link href="/about" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light transition-colors">
              About
            </Link>
            <Link href="/#services" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light transition-colors">
              Services
            </Link>
            <Link href="/#expertise" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light transition-colors">
              Expertise
            </Link>
            <Link href="/#jobs" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light transition-colors">
              Jobs
            </Link>
            <Link href="/#contact" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
