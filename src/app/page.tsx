import Image from "next/image";
import Header from "@/components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section with Parallax */}
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
            <div className="absolute inset-0 bg-black/50" />
          </div>
          
          <div className="relative z-10 container mx-auto max-w-6xl px-6 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Your Success Starts With<br />The Right Talent
            </h1>
            <p className="text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto">
              MVForster Talent Solutions connects exceptional tech talent with innovative companies. 
              We specialize in placing top-tier professionals in software engineering, data science, 
              and technical leadership roles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <a
                href="#contact"
                className="inline-flex items-center justify-center bg-gray-800 text-primary px-8 sm:px-10 py-4 rounded-md border-2 border-white hover:bg-transparent hover:text-white focus:bg-transparent focus:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transform hover:scale-105 focus:scale-105 transition-all duration-200 text-lg font-bold shadow-lg hover:shadow-xl active:scale-95"
                role="button"
                aria-label="Contact us to hire talent"
              >
                Hire Talent
              </a>
              <a
                href="#jobs"
                className="inline-flex items-center justify-center bg-gray-800 text-white px-8 sm:px-10 py-4 rounded-md border-2 border-white hover:bg-transparent hover:text-primary focus:bg-white focus:text-primary focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transform hover:scale-105 focus:scale-105 transition-all duration-200 text-lg font-bold shadow-lg hover:shadow-xl active:scale-95"
                role="button"
                aria-label="Browse available job positions"
              >
                Find Jobs
              </a>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-primary dark:text-primary-light">Our Services</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
                <div className="mb-6">
                  <Image src="/globe.svg" alt="Technical Recruitment" width={48} height={48} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Technical Recruitment</h3>
                <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">Expert placement services for software engineers, developers, and technical leaders.</p>
              </div>
              {/* <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
                <div className="mb-6">
                  <Image src="/window.svg" alt="Talent Assessment" width={48} height={48} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Talent Assessment</h3>
                <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">Comprehensive evaluation of technical skills and cultural fit.</p>
              </div> */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
                <div className="mb-6">
                  <Image src="/file.svg" alt="Career Guidance" width={48} height={48} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Career Guidance</h3>
                <p className="text-lg text-gray-700 dark:text-gray-200 leading-relaxed">Professional development and career path optimization for tech professionals.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Expertise Section */}
        <section id="expertise" className="py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-primary dark:text-primary-light">Our Expertise</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">Technical Domains</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Full Stack Development (React, Node.js, Python)
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Cloud & DevOps (AWS, Azure, Kubernetes)
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Data Science & Machine Learning
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Security & Infrastructure
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Generative AI (Agentic Workflows)
                  </li>
                </ul>
              </div>
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">Roles We Place</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Software Engineers (All Levels)
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Technical Team Leads & Engineering Managers
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    DevOps & Site Reliability Engineers
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    Data Scientists & ML Engineers
                  </li>
                  <li className="flex items-center gap-3 text-lg">
                    <span className="text-primary">•</span>
                    AI Engineers
                  </li>                  
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-primary dark:text-primary-light">Why Choose MVForster Talent Solutions</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">For Companies</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>Access to pre-vetted, highly qualified technical talent</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>92% retention rate after the first year</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>Thorough technical assessment process</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>Industry expertise and market insights</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">For Candidates</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>Exclusive opportunities with leading tech companies</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>Career guidance and development support</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>Personalized job search strategy</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <span className="text-primary text-xl mt-1">•</span>
                    <span>Long-term career partnership</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-primary dark:text-primary-light">Get in Touch</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">Ready to Work Together?</h3>
                <p className="text-lg text-gray-700 dark:text-gray-200">
                  Whether you're looking to hire top tech talent or seeking your next career opportunity, 
                  MVForster Talent Solutions is here to help you succeed.
                </p>
                <div className="space-y-4">
                  <a
                    href="mailto:micah@mvforster.com"
                    className="flex items-center gap-3 text-lg text-gray-700 hover:text-primary dark:text-gray-200 dark:hover:text-primary-light"
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
                    className="flex items-center gap-3 text-lg text-gray-700 hover:text-primary dark:text-gray-200 dark:hover:text-primary-light"
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
      </main>
    </>
  );
}
