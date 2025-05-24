'use client';

import { useEffect } from 'react';
import TestSWR from './test-swr';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { API_BASE_URL } from '@/lib/config';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    console.log('DEBUG API_BASE_URL:', API_BASE_URL);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="max-w-5xl mx-auto px-4 py-4 sm:px-6">
        {/* Hero Section */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Welcome to <span className="text-primary-600 dark:text-primary-400">Speedrun Coding</span>
          </h1>
          <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
            Master coding speed, not just algorithms
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center space-x-4">
          <Link
            href="/random_problem"
            className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Start Practicing
          </Link>
          
          {!isAuthenticated && (
            <>
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                Register
              </Link>
            </>
          )}
        </div>


        {/* FAQ Content */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">What is Speedrun coding?</h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Speedrun coding is a special code kata repetitive exercise focusing on speed. Algorithm and data structure are of secondary priority.
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Who is it for?</h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
              Professionals who want to prepare for coding interview efficiently.
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">How is it done?</h2>
            <p className="text-base font-bold text-green-500 dark:text-green-400">
              The problem solution is provided and you need to read it <br/>
              (don't waste time trying to come up with the solution) <br/>
              Your job is to code it, FAST!
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">There is only like 10 problems to practice here and they are so easy</h2>
            <p className="text-base text-gray-600 dark:text-gray-300">
            Repetition is the key to develop the speedrunning muscle. Yes, repeat the same problems.
            </p>
          </div>
        </div>

        {/* Quote - Now at bottom */}
        <div className="mt-6 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-primary-500">
          <blockquote className="text-lg italic text-gray-700 dark:text-gray-200">
            "I care not the man who has practiced 10,000 coding problems, but I'd strong hire the man who has practiced 1 problem 10,000 times"
          </blockquote>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">- Sun Tzu</p>
        </div>


        {/* Call to Action */}
        <div className="text-center space-x-4">
          <Link
            href="/random_problem"
            className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Start Practicing
          </Link>
          
          {!isAuthenticated && (
            <>
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export function HomeTest() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400">
          Welcome to <span className="text-primary-700 dark:text-primary-300">Speedrun Coding v2</span>
        </h1>

        {isAuthenticated && user && (
          <p className="mt-3 text-xl text-primary-500 dark:text-primary-400">
            Hello, <span className="font-semibold">{user.username}</span>!
          </p>
        )}

        <p className="mt-3 text-2xl text-gray-700 dark:text-gray-300">
          A LeetCode-style web application focused on coding speed
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <a
            href="#"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-primary-600 focus:text-primary-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 dark:hover:text-primary-400 dark:focus:text-primary-400"
          >
            <h3 className="text-2xl font-bold">Problems &rarr;</h3>
            <p className="mt-4 text-xl">
              Browse and solve coding challenges with timed conditions.
            </p>
          </a>

          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-primary-600 focus:text-primary-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 dark:hover:text-primary-400 dark:focus:text-primary-400"
              >
                <h3 className="text-2xl font-bold">Login &rarr;</h3>
                <p className="mt-4 text-xl">
                  Sign in to track your progress and performance.
                </p>
              </Link>
              
              <Link
                href="/register"
                className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-primary-600 focus:text-primary-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 dark:hover:text-primary-400 dark:focus:text-primary-400"
              >
                <h3 className="text-2xl font-bold">Register &rarr;</h3>
                <p className="mt-4 text-xl">
                  Create an account to start coding.
                </p>
              </Link>
            </>
          ) : (
            <Link
              href="/logout"
              className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-primary-600 focus:text-primary-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 dark:hover:text-primary-400 dark:focus:text-primary-400"
            >
              <h3 className="text-2xl font-bold">Logout &rarr;</h3>
              <p className="mt-4 text-xl">
                Sign out of your account.
              </p>
            </Link>
          )}
          
          <Link
            href="/test-monaco"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-primary-600 focus:text-primary-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 dark:hover:text-primary-400 dark:focus:text-primary-400"
          >
            <h3 className="text-2xl font-bold">Test Monaco Editor &rarr;</h3>
            <p className="mt-4 text-xl">
              Try out the code editor component.
            </p>
          </Link>

          <Link
            href="/test-env"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-primary-600 focus:text-primary-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 dark:hover:text-primary-400 dark:focus:text-primary-400"
          >
            <h3 className="text-2xl font-bold">Test Environment Variables &rarr;</h3>
            <p className="mt-4 text-xl">
              View the configured environment variables.
            </p>
          </Link>
        </div>

        <div className="mt-10 w-full max-w-4xl">
          <TestSWR />
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">Powered by Next.js and Django</p>
      </footer>
    </div>
  );
} 