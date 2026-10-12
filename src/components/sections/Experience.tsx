export default function Experience() {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-bold mb-12 text-brand">Professional Experience</h2>

        <div className="space-y-12">
          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h3 className="text-2xl font-bold text-accent">
                Machine Learning Consultant
              </h3>
              <span className="text-ink-muted">November 2024 - Present</span>
            </div>
            <h4 className="text-xl text-brand mb-4">QVEST.US</h4>
            <ul className="space-y-3 text-ink-muted">
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Led development of asset content supply chain workflow automation pipeline at NBCU utilizing Agentic workflows over MCP
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Developed natural language pipeline for text extraction from legal contracts for Matel using optical character recognition and entity classification
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Deployed solutions using AWS Cloud architecture (ECS, OpenSearch, S3, Lambda Functions) with LangGraph, MCP, GPT-4o, and FastAPI
              </li>
            </ul>
          </div>

          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h3 className="text-2xl font-bold text-accent">
                Machine Learning Consultant
              </h3>
              <span className="text-ink-muted">March 2023 - November 2024</span>
            </div>
            <h4 className="text-xl text-brand mb-4">M. FORSTER</h4>
            <ul className="space-y-3 text-ink-muted">
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Performed unsupervised learning Topic Modeling (BERTopic, LDA) on survey open textual responses in AWS SageMaker
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Implemented few-shot prompting with Anthropic Claude for extractive summarization on demographic cross-tab tables
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Built anomaly detection systems using isolation forest and CNN residence classification for small business analysis in Azure
              </li>
            </ul>
          </div>

          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h3 className="text-2xl font-bold text-accent">
                Data Scientist & Machine Learning Engineer
              </h3>
              <span className="text-ink-muted">April 2017 - April 2022</span>
            </div>
            <h4 className="text-xl text-brand mb-4">IBM</h4>
            <ul className="space-y-3 text-ink-muted">
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Implemented an extractive multi-doc summarization utilized on an internal dashboard for deriving insights about COVID-19
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Built an ensemble of 52 machine learning models to predict fantasy golf player positions at the Masters Fantasy mobile app
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Constructed end-to-end Natural Language Processing pipeline trained on 250 Gigabytes of data for ESPN&apos;s Fantasy Football platform
              </li>
            </ul>
          </div>

          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h3 className="text-2xl font-bold text-accent">
                Machine Learning Engineer & Full Stack Developer
              </h3>
              <span className="text-ink-muted">August 2015 - April 2017</span>
            </div>
            <h4 className="text-xl text-brand mb-4">IBM</h4>
            <ul className="space-y-3 text-ink-muted">
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Team-lead for deployment of Watson in the Wall at the Masters using facial recognition and natural language conversation
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Led the development of conversational agents on Pepper robots integrated with Watson AI SDK at the US Open Tennis event
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                Developed front-end for robotic gateway that allowed users to configure registered devices with Watson AI services
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
