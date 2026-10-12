export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-surface-muted">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-brand">Why Choose MVForster Talent Solutions</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-accent">For Companies</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>Access to pre-vetted, highly qualified technical talent</span>
              </li>
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>92% retention rate after the first year</span>
              </li>
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>Thorough technical assessment process</span>
              </li>
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>Industry expertise and market insights</span>
              </li>
            </ul>
          </div>
          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-accent">For Candidates</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>Exclusive opportunities with leading tech companies</span>
              </li>
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>Career guidance and development support</span>
              </li>
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>Personalized job search strategy</span>
              </li>
              <li className="flex items-start gap-3 text-lg">
                <span className="text-brand text-xl mt-1">•</span>
                <span>Long-term career partnership</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
