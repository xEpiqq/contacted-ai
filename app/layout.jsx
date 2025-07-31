"use client";

import { Inter } from 'next/font/google';
import './globals.css';
import CreditsScreen from '@/components2/layout/CreditsScreen';
import EnrichmentDrawer from '@/components2/layout/EnrichmentDrawer';
import ExportsDrawer from '@/components2/layout/ExportsDrawer';
import Toasts from '@/components/toasts';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  
  // Credits Screen state
  const [creditsScreenOpen, setCreditsScreenOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Global drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportsDrawerOpen, setExportsDrawerOpen] = useState(false);
  const [toastConfig, setToastConfig] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(1000);

  // Guide state
  const [guideOpen, setGuideOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(true); // Controls when guide should be visible

  // Simple guide content for main search page
  const GuideContent = () => (
    <>
      <div>
        <p className="font-medium">
          1. People
        </p>
        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300 mt-2">
          <p>
            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
              software engineers in San Francisco
            </code>
          </p>
        </div>
      </div>

      <div>
        <p className="font-medium">
          2. Local businesses
        </p>

        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
          <p>
            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
              restaurants in downtown Seattle
            </code>
          </p>
        </div>
      </div>
    </>
  );

  // Fetch user data for CreditsScreen and Navbar
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Fetch user profile from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, []);

  // Listen for custom events from child components
  useEffect(() => {
    const handleOpenCreditsScreen = () => {
      setCreditsScreenOpen(true);
      // Notify other components that credits screen opened
      window.dispatchEvent(new CustomEvent('creditsScreenStateChanged', { detail: true }));
    };
    const handleOpenEnrichmentDrawer = () => setDrawerOpen(true);
    const handleOpenExportsDrawer = () => setExportsDrawerOpen(true);
    const handleShowToast = (event) => setToastConfig(event.detail);
    const handleUpdateCredits = (event) => setCreditsRemaining(event.detail);
    const handleShowGuide = () => setShowGuide(true);
    const handleHideGuide = () => setShowGuide(false);

    window.addEventListener('openCreditsScreen', handleOpenCreditsScreen);
    window.addEventListener('openEnrichmentDrawer', handleOpenEnrichmentDrawer);
    window.addEventListener('openExportsDrawer', handleOpenExportsDrawer);
    window.addEventListener('showToast', handleShowToast);
    window.addEventListener('updateCredits', handleUpdateCredits);
    window.addEventListener('showGuide', handleShowGuide);
    window.addEventListener('hideGuide', handleHideGuide);
    
    return () => {
      window.removeEventListener('openCreditsScreen', handleOpenCreditsScreen);
      window.removeEventListener('openEnrichmentDrawer', handleOpenEnrichmentDrawer);
      window.removeEventListener('openExportsDrawer', handleOpenExportsDrawer);
      window.removeEventListener('showToast', handleShowToast);
      window.removeEventListener('updateCredits', handleUpdateCredits);
      window.removeEventListener('showGuide', handleShowGuide);
      window.removeEventListener('hideGuide', handleHideGuide);
    };
  }, []);

  // Notify other components when credits screen state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('creditsScreenStateChanged', { detail: creditsScreenOpen }));
  }, [creditsScreenOpen]);

  return (
    <html lang="en">
      <head>
        <title>Contacted Agent</title>
        <meta name="description" content="AI-powered lead generation platform" />
      </head>
      <body className={`${inter.className} bg-[#212121] text-white`} cz-shortcut-listen="true"
      >
        
        {/* Credits Screen - Global overlay */}
        <div className="z-50">
          <AnimatePresence mode="wait">
            {creditsScreenOpen && (
              <CreditsScreen 
                onClose={() => {
                  setCreditsScreenOpen(false);
                  // Notify other components that credits screen closed
                  window.dispatchEvent(new CustomEvent('creditsScreenStateChanged', { detail: false }));
                }}
                user={user}
                profile={profile}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Enrichment Drawer - Global overlay */}
        <div className="z-40">
          <EnrichmentDrawer 
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
            setToastConfig={setToastConfig}
            creditsRemaining={creditsRemaining}
            setCreditsRemaining={setCreditsRemaining}
          />
        </div>

        {/* Exports Drawer - Global overlay */}
        <div className="z-40">
          <ExportsDrawer 
            exportsDrawerOpen={exportsDrawerOpen}
            setExportsDrawerOpen={setExportsDrawerOpen}
            user={user}
          />
        </div>

        {/* Toast Notifications - Global overlay */}
        <div className="z-50">
          <Toasts 
            toastConfig={toastConfig}
            setToastConfig={setToastConfig}
          />
        </div>

        {/* Guide - Global overlay */}
        <div className="z-30">
          {showGuide && (
            <div className="fixed top-24 right-0 bottom-0 w-auto z-10">
              <AnimatePresence>
                {guideOpen ? (
                  <motion.aside
                    key="guide"
                    initial={{ x: 320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 320, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-24 right-4 max-w-[90vw] bg-[#2b2b2b] border border-[#404040] rounded-2xl shadow-lg text-sm text-neutral-200 z-20 pointer-events-auto overflow-hidden"
                    style={{ width: '320px' }}
                  >
                    <button
                      aria-label="minimize guide"
                      onClick={() => setGuideOpen(false)}
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white z-10"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>

                    {/* Guide Content */}
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key="guide-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="p-4 space-y-3"
                      >
                        <h3 className="text-base font-semibold">Guide</h3>
                        
                        <GuideContent />
                      </motion.div>
                    </AnimatePresence>
                  </motion.aside>
                ) : (
                  <motion.button
                    key="guide-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    aria-label="open guide"
                    onClick={() => setGuideOpen(true)}
                    className="fixed top-1/2 right-2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white pointer-events-auto cursor-pointer"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className='z-10'>
        {children}

        </div>
      </body>
    </html>
  );
} 