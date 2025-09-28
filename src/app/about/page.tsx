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
                Machine Learning Engineer with several years of hands-on experience in the research and development of large-scale NLP pipelines, 
                and deep learning solutions in telecommunications. My work includes implementing highly visible applications with ESPN Fantasy Football, 
                Wimbledon and Grammys, delivering insights to millions of users.
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
                <a
                  href="https://github.com/mgfos207"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  View GitHub
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
                  Machine Learning Consultant
                </h3>
                <span className="text-gray-600 dark:text-gray-400">November 2024 - Present</span>
              </div>
              <h4 className="text-xl text-primary mb-4">QVEST.US</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Led development of asset content supply chain workflow automation pipeline at NBCU utilizing Agentic workflows over MCP
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Developed natural language pipeline for text extraction from legal contracts for Matel using optical character recognition and entity classification
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Deployed solutions using AWS Cloud architecture (ECS, OpenSearch, S3, Lambda Functions) with LangGraph, MCP, GPT-4o, and FastAPI
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Machine Learning Consultant
                </h3>
                <span className="text-gray-600 dark:text-gray-400">March 2023 - November 2024</span>
              </div>
              <h4 className="text-xl text-primary mb-4">M. FORSTER</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Performed unsupervised learning Topic Modeling (BERTopic, LDA) on survey open textual responses in AWS SageMaker
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Implemented few-shot prompting with Anthropic Claude for extractive summarization on demographic cross-tab tables
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Built anomaly detection systems using isolation forest and CNN residence classification for small business analysis in Azure
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Data Scientist & Machine Learning Engineer
                </h3>
                <span className="text-gray-600 dark:text-gray-400">April 2017 - April 2022</span>
              </div>
              <h4 className="text-xl text-primary mb-4">IBM</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Implemented an extractive multi-doc summarization utilized on an internal dashboard for deriving insights about COVID-19
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Built an ensemble of 52 machine learning models to predict fantasy golf player positions at the Masters Fantasy mobile app
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Constructed end-to-end Natural Language Processing pipeline trained on 250 Gigabytes of data for ESPN's Fantasy Football platform
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Machine Learning Engineer & Full Stack Developer
                </h3>
                <span className="text-gray-600 dark:text-gray-400">August 2015 - April 2017</span>
              </div>
              <h4 className="text-xl text-primary mb-4">IBM</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Team-lead for deployment of Watson in the Wall at the Masters using facial recognition and natural language conversation
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Led the development of conversational agents on Pepper robots integrated with Watson AI SDK at the US Open Tennis event
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Developed front-end for robotic gateway that allowed users to configure registered devices with Watson AI services
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
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Languages: Python (Pandas, Numpy, scikit-learn, Tensorflow, PyTorch, Keras)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Machine Learning: Topic Modeling, LLM, Regression, Decision Trees, RandomForest, XGBoost, SVM, K-Means, Word Embeddings, Computer Vision</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Data Management: SQL, PySpark, EDA, ETL, Data Wrangling, Feature Engineering, S3, OpenSearch</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Container Technologies: Docker, Kubernetes, ECS</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-secondary dark:text-primary-light">Advanced Techniques</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Statistical Methods: Regression, Classification, Clustering, Statistical Learning, Hypothesis Testing, A/B Testing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>AI Platforms: IBM AutoAI, AWS SageMaker</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>DevOps/MLOps: GitLab, CI/CD pipelines</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span>Cloud: AWS, Azure, Google Cloud Platform</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold mb-12 text-primary dark:text-primary-light">Education & Certifications</h2>
          
          <div className="space-y-12">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Bachelor's Degree in Computer Information Science
                </h3>
              </div>
              <h4 className="text-xl text-primary mb-4">University of North Florida</h4>
              <p className="text-lg text-gray-700 dark:text-gray-200">
                Graduated with a focus on software engineering and information systems.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <h3 className="text-2xl font-bold text-secondary dark:text-primary-light">
                  Professional Certifications
                </h3>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Machine Learning
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Unsupervised Learning
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Introduction to PySpark
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Time Series Analysis in Python
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  Statistical Thinking
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
