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
                Customer Success Engineer and Software Developer with experience in cloud infrastructure, software development, and database management. 
                Specializing in delivering exceptional customer experiences and technical solutions.
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
                src="/micah-night-city.jpg"
                alt="Micah Forster"
                width={400}
                height={400}
                className="rounded-lg shadow-xl object-cover"
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
                  Customer Success Engineer
                </h3>
                <span className="text-gray-600 dark:text-gray-400">September 2023 - Present</span>
              </div>
              <h4 className="text-xl text-primary mb-4">Wiz</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Managed the technical implementation of the Wiz platform across customer cloud environments
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Built strong customer relationships with Fortune 500 companies, advising on cloud security best practices
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Collaborated with Product and Engineering teams to enhance the Wiz platform based on customer feedback
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Technical Implementation Specialist
                </h3>
                <span className="text-gray-600 dark:text-gray-400">May 2022 - September 2023</span>
              </div>
              <h4 className="text-xl text-primary mb-4">Appsembler Inc</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Served as the technical lead managing implementation projects for the Tahoe platform
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Developed integrations between Open edX platform and client systems using Python and JavaScript
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Created and delivered technical training to clients on platform capabilities and customization
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Software Developer
                </h3>
                <span className="text-gray-600 dark:text-gray-400">May 2021 - May 2022</span>
              </div>
              <h4 className="text-xl text-primary mb-4">InstaBase</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Built capabilities in the InstaBase platform to deliver customized solutions for Fortune 500 clients
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Developed document processing and classification workflows using Python and SQL
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Collaborated with UX/UI design team to improve platform functionality and user experience
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Software Engineer
                </h3>
                <span className="text-gray-600 dark:text-gray-400">July 2020 - May 2021</span>
              </div>
              <h4 className="text-xl text-primary mb-4">Talroo</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Maintained and enhanced job search API and database architecture using Java and PostgreSQL
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Implemented performance improvements to search algorithms that increased search speed by 20%
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Worked with the product team to implement new features based on user feedback and business needs
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
              <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Technical Skills</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Languages: Python, JavaScript, Java, SQL
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Cloud: AWS, Azure, GCP, Kubernetes
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Web: React, Node.js, HTML/CSS
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Databases: PostgreSQL, MySQL, MongoDB
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Professional Skills</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Customer Success Management
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Project Implementation
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Technical Documentation
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">•</span>
                  Client Training & Enablement
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold mb-12 text-primary dark:text-primary-light">Education</h2>
          
          <div className="space-y-12">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Bachelor of Science in Computer Science
                </h3>
                <span className="text-gray-600 dark:text-gray-400">2016 - 2020</span>
              </div>
              <h4 className="text-xl text-primary mb-4">The University of Texas at Austin</h4>
              <p className="text-lg text-gray-700 dark:text-gray-200">
                Graduated with a focus on software engineering and database systems. Participated in competitive programming teams and hackathons.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Certifications
                </h3>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  AWS Certified Solutions Architect
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Microsoft Azure Fundamentals
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Certified Kubernetes Administrator
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
