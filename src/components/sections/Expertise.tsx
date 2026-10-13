export default function Expertise() {
  return (
    <section id="expertise" className="py-24">
      <div id="candidates" className="container mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-brand">Our Expertise</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-accent">Technology Domains</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Full Stack Development (React, Node.js, Python)
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Cloud & DevOps (AWS, Azure, Kubernetes)
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Data Science & Machine Learning
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Security & Infrastructure
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Generative AI (Agentic Workflows)
              </li>
            </ul>
          </div>
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-accent">Behavioral Health</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Applied Behavior Analysis (ABA)
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Autism Spectrum Disorder Services
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Early Intervention Programs
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Developmental Disabilities Support
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Clinical Therapy Services
              </li>
            </ul>
          </div>
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-accent">Roles We Place</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Software Engineers (All Levels)
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Technical Team Leads & Engineering Managers
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                DevOps & Site Reliability Engineers
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Data Scientists & ML Engineers
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Board Certified Behavior Analysts (BCBA)
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Registered Behavior Technicians (RBT)
              </li>
              <li className="flex items-center gap-3 text-lg">
                <span className="text-brand">•</span>
                Clinical Supervisors & Program Directors
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
