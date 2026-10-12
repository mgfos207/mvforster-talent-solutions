export default function SkillsExpertise() {
  return (
    <section className="py-20 bg-surface-muted">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-bold mb-12 text-brand">Skills & Expertise</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-accent">Technical Skills</h3>
            <ul className="space-y-3 text-ink-muted">
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>Languages: Python (Pandas, Numpy, scikit-learn, Tensorflow, PyTorch, Keras)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>Machine Learning: Topic Modeling, LLM, Regression, Decision Trees, RandomForest, XGBoost, SVM, K-Means, Word Embeddings, Computer Vision</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>Data Management: SQL, PySpark, EDA, ETL, Data Wrangling, Feature Engineering, S3, OpenSearch</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>Container Technologies: Docker, Kubernetes, ECS</span>
              </li>
            </ul>
          </div>

          <div className="bg-surface p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-accent">Advanced Techniques</h3>
            <ul className="space-y-3 text-ink-muted">
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>Statistical Methods: Regression, Classification, Clustering, Statistical Learning, Hypothesis Testing, A/B Testing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>AI Platforms: IBM AutoAI, AWS SageMaker</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>DevOps/MLOps: GitLab, CI/CD pipelines</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand mt-1.5">•</span>
                <span>Cloud: AWS, Azure, Google Cloud Platform</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
