export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-8" role="main">
      <div className="max-w-4xl mx-auto">
        {/* Skip link for screen readers */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-indigo-900">
          Skip to main content
        </a>
        
        <header className="text-center mb-12" role="banner">
          <h1 className="text-4xl font-bold text-indigo-900 mb-4" tabIndex={0}>My Journey to Freedom</h1>
          <p className="text-lg text-gray-800" tabIndex={0}>Building a future for my family</p>
        </header>

        <div id="main-content" className="grid md:grid-cols-2 gap-8 mb-12">
          <figure className="relative group" role="img" aria-label="Family photo representing my motivation">
            <img 
              src="/family/family1.jpg" 
              alt="A cherished moment with my baby, representing what I'm working towards"
              className="w-full h-64 object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" aria-hidden="true"></div>
          </figure>
          <section className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300" aria-labelledby="income-goals">
            <h2 id="income-goals" className="text-2xl font-bold text-indigo-900 mb-6" tabIndex={0}>Income Goals</h2>
            <dl className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <dt className="font-semibold">Monthly Target</dt>
                <dd className="text-xl text-indigo-900 font-bold" aria-label="Monthly target: 10,000 dollars">$10,000</dd>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <dt className="font-semibold">Quarterly Target</dt>
                <dd className="text-xl text-indigo-900 font-bold" aria-label="Quarterly target: 30,000 dollars">$30,000</dd>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <dt className="font-semibold">Half-Year Target</dt>
                <dd className="text-xl text-indigo-900 font-bold" aria-label="Half-year target: 60,000 dollars">$60,000</dd>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <dt className="font-semibold">3-Year Target</dt>
                <dd className="text-xl text-indigo-900 font-bold" aria-label="Three year target: 200,000 dollars">$200,000</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <section className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300" aria-labelledby="milestone">
            <h2 id="milestone" className="text-2xl font-bold text-indigo-900 mb-6" tabIndex={0}>3-Month Milestone</h2>
            <div className="p-6 bg-indigo-50 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-900">Target Revenue</h3>
              <p className="text-3xl font-bold text-indigo-900 mt-2" aria-label="Target: 20,000 dollars or more">$20,000+</p>
              <p className="text-gray-800 mt-4">First major milestone towards financial freedom</p>
            </div>
          </section>
          <figure className="relative group" role="img" aria-label="Family photo showing our bond">
            <img 
              src="/family/family2.jpg" 
              alt="A joyful family moment that drives my goals"
              className="w-full h-64 object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" aria-hidden="true"></div>
          </figure>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <figure className="relative group" role="img" aria-label="Family photo embodying our future">
            <img 
              src="/family/family3.jpg" 
              alt="A loving family moment that inspires my journey"
              className="w-full h-64 object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" aria-hidden="true"></div>
          </figure>
          <section className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300" aria-labelledby="freedom">
            <h2 id="freedom" className="text-2xl font-bold text-indigo-900 mb-6" tabIndex={0}>Freedom Number</h2>
            <div className="p-6 bg-indigo-50 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-900">Annual Income Goal</h3>
              <p className="text-4xl font-bold text-indigo-900 mt-2" aria-label="Goal: 150,000 dollars per year">$150,000</p>
              <p className="text-gray-800 mt-4">The milestone that brings full independence</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
