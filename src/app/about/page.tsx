import Image from "next/image";
import Header from "../../components/Header";
export default function About() {
  return (
    <>
      <Header />
      <main className="pt-32 min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-primary dark:text-primary-light">
                Micah Forster
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-200 mb-8">
                Senior Global Talent Acquisition Manager with over 7 years of experience in technical recruiting,
                specializing in building high-performance engineering teams across different markets and time zones.
              </p>
              <div className="flex gap-4">
                <a
                  href="http://linkedin.com/in/micah-forster-0207"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  Connect on LinkedIn
                </a>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/micah-forster-recruitment.jpeg"
                alt="Micah Forster"
                width={400}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold mb-12 text-primary dark:text-primary-light">Professional Experience</h2>
          
          <div className="space-y-12">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Senior Global Talent Acquisition Manager
                </h3>
                <span className="text-gray-600 dark:text-gray-400">2022 - Present</span>
              </div>
              <h4 className="text-xl text-primary mb-4">GitHub</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Led technical recruitment for GitHub's engineering teams globally
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Successfully managed high-volume recruitment, delivering 150+ technical hires annually
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Implemented innovative sourcing strategies resulting in a 40% reduction in time-to-hire
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Technical Recruiting Lead
                </h3>
                <span className="text-gray-600 dark:text-gray-400">2018 - 2022</span>
              </div>
              <h4 className="text-xl text-primary mb-4">Microsoft</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Built and led a team of technical recruiters, achieving 125% of hiring targets
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Developed and implemented technical assessment frameworks
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Established strong partnerships with engineering leadership and hiring managers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Expertise Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold mb-12 text-primary dark:text-primary-light">Skills & Expertise</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Technical Domains</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Full Stack Development (JavaScript/TypeScript, Python, Java)
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Cloud Technologies (AWS, Azure, GCP)
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  DevOps & Infrastructure
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Machine Learning & AI
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Recruitment Expertise</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Technical Assessment & Evaluation
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Global Talent Acquisition
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Diversity & Inclusion Initiatives
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Strategic Workforce Planning
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold mb-12 text-primary dark:text-primary-light">Key Achievements</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <div className="text-4xl font-bold text-primary dark:text-primary-light mb-4">150+</div>
              <p className="text-lg text-gray-700 dark:text-gray-200">Technical Hires Annually</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <div className="text-4xl font-bold text-primary dark:text-primary-light mb-4">92%</div>
              <p className="text-lg text-gray-700 dark:text-gray-200">First Year Retention Rate</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
              <div className="text-4xl font-bold text-primary dark:text-primary-light mb-4">40%</div>
              <p className="text-lg text-gray-700 dark:text-gray-200">Reduced Time-to-Hire</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
