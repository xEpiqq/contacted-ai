"use client";

import React, { useState } from "react";
import { ArrowRight, Check, Gem, CheckCircle, Mail, ChevronRight, Chrome, Database, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission - redirect to checkout or registration
    window.location.href = "/app";
  };

  return (
    <div className="min-h-screen bg-[#212121] text-white">
      {/* Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 border-b border-[#404040]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black">C</div>
          <span className="text-white text-xl font-medium">Contacted.ai</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-neutral-300 hover:text-white">Features</a>
          <a href="#testimonials" className="text-neutral-300 hover:text-white">Testimonials</a>
          <a href="#pricing" className="text-neutral-300 hover:text-white">Pricing</a>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/app" className="text-sm text-neutral-300 hover:text-white px-3 py-1.5">Sign In</Link>
          <Link 
            href="/app" 
            className="text-sm bg-white text-black hover:bg-neutral-200 px-4 py-1.5 rounded-md transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-20 pb-24 md:pt-28 md:pb-32 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-900/30 rounded-full border border-green-800/30 text-green-400 text-xs font-medium mb-2">
              <Zap className="h-3.5 w-3.5" />
              <span>LIMITED TIME OFFER</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Get 10,000 B2B Contacts For Just $1
            </h1>
            
            <p className="text-lg text-neutral-300 max-w-lg">
              Start your $1 trial, get 2 weeks free and 10,000 contacts.
            </p>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="flex-1">
                <input 
                  type="email" 
                  placeholder="chud@jack.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-[#2b2b2b] border border-[#404040] focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>Get 10K Contacts</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>$1 free trial (claim 10,000 leads)</span>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="relative bg-[#2b2b2b] border border-[#404040] rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-[#404040]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-neutral-400">Contacted.ai Dashboard</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Find Perfect Sales Prospects</h3>
                  <div className="bg-[#333333] p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">1</div>
                      <span className="text-sm font-medium">Select Target: People or Local Business</span>
                    </div>
                    <div className="px-4 py-3 bg-[#3a3a3a] rounded-md flex items-center justify-between">
                      <span className="text-sm">business owners, CEOs, marketing directors</span>
                      <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center">
                        <ChevronRight className="h-4 w-4 text-black" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-[#2b2b2b] flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-neutral-400">+240M verified contacts available</span>
                </div>
                
                <div className="pt-3 mt-2 border-t border-[#404040]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gem className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium">10,000 credits</span>
                    </div>
                    <span className="text-sm text-green-400 font-medium">$1.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof */}
      <section className="bg-[#1a1a1a] py-8 border-y border-[#404040]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">240M+</p>
              <p className="text-sm text-neutral-400">B2B Contacts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">1000+</p>
              <p className="text-sm text-neutral-400">Users getting contacts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">3.2M</p>
              <p className="text-sm text-neutral-400">Meetings Booked</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">AI-Powered Sales Prospecting</h2>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
            Contacted.ai uses artificial intelligence to find the exact decision-makers you need to reach, complete with verified contact details.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-medium">Verified Contact Details</h3>
            <p className="text-neutral-300">
              Direct emails and phone numbers for decision makers. No more gatekeepers or cold contact forms.
            </p>
          </div>
          
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-900/30 flex items-center justify-center text-green-400">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-medium">Targeted Filters</h3>
            <p className="text-neutral-300">
              Find exactly who you need by job title, industry, company size, location, and more.
            </p>
          </div>
          
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">
              <Chrome className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-medium">Browser Extension</h3>
            <p className="text-neutral-300">
              Enrich LinkedIn profiles with one click. Get contact info without leaving your browser.
            </p>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-[#1a1a1a] border-y border-[#404040]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Sales Pros Are Saying</h2>
            <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
              Thousands of businesses have transformed their outreach and meeting booking rates.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">M</div>
                <div>
                  <p className="font-medium">Michael T.</p>
                  <p className="text-xs text-neutral-400">VP of Sales, TechCorp</p>
                </div>
              </div>
              <p className="text-neutral-300 italic">
                "This tool has transformed our outreach process. We're connecting with the right decision-makers and seeing a 3x increase in response rates."
              </p>
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">S</div>
                <div>
                  <p className="font-medium">Sarah K.</p>
                  <p className="text-xs text-neutral-400">Marketing Director, GrowthIQ</p>
                </div>
              </div>
              <p className="text-neutral-300 italic">
                "We scaled our B2B prospecting while maintaining quality. The enrichment data is accurate and always up to date. It's literally paid for itself in the first week."
              </p>
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">J</div>
                <div>
                  <p className="font-medium">James L.</p>
                  <p className="text-xs text-neutral-400">Founder, LaunchPad</p>
                </div>
              </div>
              <p className="text-neutral-300 italic">
                "The data quality is exceptional. We're building targeted lists in minutes instead of days, and our SDRs are booking 40% more meetings with the same effort."
              </p>
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA / Pricing Section */}
      <section id="pricing" className="py-20 max-w-5xl mx-auto px-6">
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-blue-800/30 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 rounded-full border border-blue-800/30 text-blue-400 text-xs font-medium mb-4">
                <Gem className="h-3.5 w-3.5" />
                <span>10,000 CONTACTS FOR $1</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">End The Cold Outreach Struggle</h2>
              <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
                Get 10,000 credits - enough to build multiple targeted lists and start booking meetings immediately.
              </p>
            </div>
            
            <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6 md:p-8 max-w-xl mx-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Starter Pack</h3>
                  <p className="text-neutral-400">Perfect for your first campaign</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-sm line-through">$99</span>
                    <span className="text-2xl font-bold">$1</span>
                  </div>
                  <p className="text-xs text-neutral-400">One-time payment</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <p>10,000 credits (1 credit = 1 contact's details)</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <p>Full access to all search filters</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <p>Email and phone verification</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <p>CSV export of all your leads</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <p>Browser extension</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <p>14-day money back guarantee</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md bg-[#333333] border border-[#505050] focus:border-blue-500 focus:outline-none"
                  required
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-medium rounded-md transition-colors"
                >
                  Get 10,000 contacts for $1
                </button>
                <p className="text-xs text-center text-neutral-400">
                  Credit card required. Cancel future charges anytime.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-6">
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6">
            <h3 className="text-lg font-medium mb-2">How accurate is your contact data?</h3>
            <p className="text-neutral-300">
              Our database is continuously verified and updated, with 94% email accuracy. We check all contact information before it's made available to you.
            </p>
          </div>
          
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6">
            <h3 className="text-lg font-medium mb-2">What happens after I use my 10,000 credits?</h3>
            <p className="text-neutral-300">
              You can purchase additional credits starting at $99 for 20,000 credits. We offer volume discounts for larger purchases.
            </p>
          </div>
          
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6">
            <h3 className="text-lg font-medium mb-2">Is there a limit to how many contacts I can export?</h3>
            <p className="text-neutral-300">
              No. You can export as many contacts as you have credits for. Each contact's complete information costs 1 credit.
            </p>
          </div>
          
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-xl p-6">
            <h3 className="text-lg font-medium mb-2">How does your data compare to LinkedIn Sales Navigator?</h3>
            <p className="text-neutral-300">
              Unlike Sales Navigator, we provide direct contact information including verified emails and phone numbers, saving you hours of manual research per prospect.
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-16 bg-[#1a1a1a] border-t border-[#404040]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to fill your calendar with sales calls?</h2>
          <div className="max-w-md mx-auto">
            <Link 
              href="/app" 
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2 text-lg"
            >
              <span>Get 10,000 Contacts for $1</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-[#212121] border-t border-[#404040]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black">C</div>
              <span className="text-white text-xl font-medium">Contacted.ai</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-6 md:mb-0">
              <a href="#" className="text-sm text-neutral-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-sm text-neutral-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-sm text-neutral-400 hover:text-white">Support</a>
              <a href="#" className="text-sm text-neutral-400 hover:text-white">Blog</a>
            </div>
            
            <div className="text-sm text-neutral-500">
              © 2023 Contacted.ai. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 