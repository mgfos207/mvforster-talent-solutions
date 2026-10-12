import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/office-bg.jpg"
          alt="Modern Office Background"
          fill
          style={{ objectFit: 'cover' }}
          className="transform scale-110"
          priority
        />
        <div className="absolute inset-0 bg-brand-strong/65" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-6 text-center text-on-brand">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
          Your Success Starts With<br />The Right Talent
        </h1>
        <p className="text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto">
          MVForster Talent Solutions connects exceptional talent with innovative companies.
          We specialize in placing top-tier professionals in technology, behavioral health,
          and therapeutic services.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-surface to-transparent z-10" />
    </section>
  );
}
