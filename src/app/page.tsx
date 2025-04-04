import Link from 'next/link';
import { Navbar } from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Track Your Culinary Adventures
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                Create lists of restaurants to visit, log your experiences, and share recommendations with friends.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="text-blue-600 text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2">Restaurant Lists</h3>
                <p className="text-gray-600">
                  Create custom lists for different occasions, cities, or cuisines. Keep track of places you want to visit.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="text-blue-600 text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">Personal Notes</h3>
                <p className="text-gray-600">
                  Write detailed notes about your experiences, upload photos, and rate restaurants.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="text-blue-600 text-4xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2">Collaboration</h3>
                <p className="text-gray-600">
                  Share lists with friends and family. Collaborate on planning your next dining adventure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">AI-Powered Insights</h2>
            <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
              Leverage the power of AI to enhance your restaurant experiences
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Smart Tagging</h3>
                <p className="text-gray-600 mb-4">
                  Our AI automatically generates relevant tags based on your notes, making it easier to find restaurants that match your preferences.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Note Summarization</h3>
                <p className="text-gray-600 mb-4">
                  Turn your detailed notes into concise summaries with key points highlighted.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Restaurant Recommendations</h3>
                <p className="text-gray-600 mb-4">
                  Get personalized restaurant suggestions based on your preferences and past ratings.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Trend Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Visualize your dining patterns and preferences over time with interactive charts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Culinary Journey?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join Restaurant Notebook today and never forget a great dining experience again.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Restaurant Notebook</h3>
              <p className="text-gray-400">
                Your personal restaurant tracking and recommendation platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/auth/signin" className="text-gray-400 hover:text-white">Sign In</Link></li>
                <li><Link href="/auth/signup" className="text-gray-400 hover:text-white">Sign Up</Link></li>
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                support@restaurantnotebook.com
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Restaurant Notebook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
