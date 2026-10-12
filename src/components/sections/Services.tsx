import Image from "next/image";

export default function Services() {
  return (
    <section id="services" className="py-20 bg-surface-muted">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-brand">Our Services</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-surface p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-border hover:scale-105">
            <div className="mb-6">
              <Image src="/globe.svg" alt="Technical Recruitment" width={48} height={48} className="text-brand" />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-accent">Technology & Healthcare Recruitment</h3>
            <p className="text-lg text-ink-muted leading-relaxed">Expert placement services for software engineers, data scientists, BCBA professionals, behavioral health specialists, and healthcare administration roles.</p>
          </div>
          <div className="bg-surface p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-border hover:scale-105">
            <div className="mb-6">
              <Image src="/file.svg" alt="Career Guidance" width={48} height={48} className="text-brand" />
            </div>
            <h3 className="text-2xl font-bold mb-6 text-accent">Career Guidance</h3>
            <p className="text-lg text-ink-muted leading-relaxed">Professional development and career path optimization for technology and behavioral health professionals.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
