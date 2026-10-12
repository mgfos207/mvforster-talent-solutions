export default function Education() {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-bold mb-12 text-brand">Education & Certifications</h2>

        <div className="space-y-12">
          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h3 className="text-2xl font-bold text-accent">
                Bachelor&apos;s Degree in Computer Information Science
              </h3>
            </div>
            <h4 className="text-xl text-brand mb-4">University of North Florida</h4>
            <p className="text-lg text-ink-muted">
              Graduated with a focus on software engineering and information systems.
            </p>
          </div>

          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h3 className="text-2xl font-bold text-accent">
                Professional Certifications
              </h3>
            </div>
            <ul className="space-y-3 text-ink-muted">
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Machine Learning
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Unsupervised Learning
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Introduction to PySpark
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Time Series Analysis in Python
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Statistical Thinking
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
