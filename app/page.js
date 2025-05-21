'use client';

import Link from 'next/link';
import NavMenu from '@/app/components/NavMenu';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full text-white">
        <NavMenu />
        
        <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Database Selector</h1>
          <p className="text-neutral-300 mb-6">
            This tool helps you determine which database is most appropriate for your search query.
            Select one of the options below to get started.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Link 
              href="/database-selector-basic"
              className="p-4 bg-[#303030] hover:bg-[#353535] border border-[#505050] rounded-lg transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2 text-blue-300">Basic Selector</h2>
              <p className="text-sm text-neutral-400">
                Chooses between USA Professionals and US Local Businesses databases.
              </p>
            </Link>
            
            <Link 
              href="/test/database-selector"
              className="p-4 bg-[#303030] hover:bg-[#353535] border border-[#505050] rounded-lg transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2 text-green-300">Full Database Selector</h2>
              <p className="text-sm text-neutral-400">
                Advanced selector with all four databases and follow-up questions.
              </p>
            </Link>
          </div>
        </div>
        
        <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Available Databases</h2>
          <ul className="space-y-2">
            <li className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-md">
              <strong className="text-blue-300">USA Professionals (usa4_new_v2):</strong>
              <p className="text-sm text-neutral-400 mt-1">
                Individual professionals located in the United States.
              </p>
            </li>
            <li className="p-3 bg-green-900/20 border border-green-800/30 rounded-md">
              <strong className="text-green-300">US Local Businesses (deez_3_v3):</strong>
              <p className="text-sm text-neutral-400 mt-1">
                Local business establishments in the United States.
              </p>
            </li>
            <li className="p-3 bg-purple-900/20 border border-purple-800/30 rounded-md">
              <strong className="text-purple-300">International Professionals (otc1_new_v2):</strong>
              <p className="text-sm text-neutral-400 mt-1">
                Professionals located outside the United States.
              </p>
            </li>
            <li className="p-3 bg-orange-900/20 border border-orange-800/30 rounded-md">
              <strong className="text-orange-300">Global B2B Contacts (eap1_new_v2):</strong>
              <p className="text-sm text-neutral-400 mt-1">
                Business contacts with emails from around the world.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 