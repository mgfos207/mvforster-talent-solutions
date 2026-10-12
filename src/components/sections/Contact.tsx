import Image from "next/image";

export default function Contact() {
  return (
    <section id="contact" className="py-20">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-brand">Get in Touch</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-accent">Ready to Work Together?</h3>
            <p className="text-lg text-ink-muted">
              Whether you&apos;re looking to hire top tech talent or seeking your next career opportunity,
              MVForster Talent Solutions is here to help you succeed.
            </p>
            <div className="space-y-4">
              <a
                href="mailto:micah@mvforster.com"
                className="flex items-center gap-3 text-lg text-ink-muted hover:text-brand"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                micah@mvforster.com
              </a>
              <a
                href="https://www.linkedin.com/in/micah-forster-91ab8128b/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-lg text-ink-muted hover:text-brand"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/micah-night-city.png"
              alt="Micah Forster - Talent Solutions"
              width={600}
              height={900}
              className="rounded-lg shadow-lg object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
