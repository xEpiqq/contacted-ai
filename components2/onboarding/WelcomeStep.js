import React, { useState } from "react";
import { motion } from "framer-motion";

const WelcomeStep = ({ nextStep, userData, currentStep, totalSteps }) => {
  const [videoWatched, setVideoWatched] = useState(false);
  const videoId = "6fnmXX8RK0s";
  
  const handleVideoEnd = () => {
    setVideoWatched(true);
  };
  
  // Set up event listener for YouTube API messages
  React.useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== "https://www.youtube.com") return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === "onStateChange" && data.info === 0) {
          handleVideoEnd();
        }
      } catch (e) {
        // Not a JSON message or not the expected format
      }
    }
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div>
      <p className="text-neutral-400 text-lg mb-8">
        Welcome to Contacted.ai! Your account comes with 10,000 credits to kickstart your outreach campaigns.
      </p>
      
      <div className="mb-10">
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-4">
            Want 2,000 more credits? Watch our quick tutorial
          </h2>
          
          <div className="relative aspect-video max-w-2xl bg-black rounded-lg mb-3 overflow-hidden">
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&controls=0&disablekb=1&rel=0`}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              id="welcome-video"
            ></iframe>
            
            {!videoWatched && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-2 px-4">
                <p className="text-sm text-white">Watch the full video to earn your bonus credits</p>
              </div>
            )}
          </div>
          
          {videoWatched ? (
            <div className="bg-green-500/20 text-green-500 py-3 px-4 rounded-md flex items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span className="font-medium">2,000 bonus credits added! You now have 12,000 total credits</span>
            </div>
          ) : (
            <p className="text-neutral-500 mb-6">Tutorial completion unlocks 2,000 bonus credits</p>
          )}
        </div>
        
        <div className="bg-[#212121] border border-[#333333] rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-4">What you can do with your credits:</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full flex-shrink-0 bg-green-500 flex items-center justify-center mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>Generate prospect lists for your target industries</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full flex-shrink-0 bg-green-500 flex items-center justify-center mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>Create and send cold outreach campaigns</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full flex-shrink-0 bg-green-500 flex items-center justify-center mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span>Use our AI to generate personalized templates</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        {videoWatched ? (
          <button
            onClick={nextStep}
            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors"
          >
            Continue
          </button>
        ) : (
          <>
            <button
              onClick={nextStep}
              className="px-6 py-2.5 bg-transparent hover:bg-[#333333] text-neutral-400 border border-[#333333] rounded-md transition-colors"
            >
              Skip (no bonus credits)
            </button>
            <button
              onClick={nextStep}
              disabled={!videoWatched}
              className="px-6 py-2.5 bg-neutral-700 text-neutral-400 rounded-md cursor-not-allowed"
            >
              Continue with bonus
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WelcomeStep; 