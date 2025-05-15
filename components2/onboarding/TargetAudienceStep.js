import React, { useState } from "react";

const TargetAudienceStep = ({ userData, updateUserData, nextStep, prevStep, currentStep, totalSteps }) => {
  const [otherAudience, setOtherAudience] = useState("");
  const [otherIndustry, setOtherIndustry] = useState("");
  
  const targetAudienceOptions = [
    { id: "ceos", label: "CEOs & Founders" },
    { id: "marketing", label: "Marketing Directors" },
    { id: "sales", label: "Sales Directors" },
    { id: "hr", label: "HR Managers" },
    { id: "operations", label: "Operations Managers" },
    { id: "finance", label: "Finance Directors" },
    { id: "it", label: "IT Decision Makers" },
    { id: "smb", label: "Small Business Owners" },
    { id: "other", label: "Other" }
  ];
  
  const industryOptions = [
    { id: "tech", label: "Technology" },
    { id: "finance", label: "Finance & Banking" },
    { id: "healthcare", label: "Healthcare" },
    { id: "ecommerce", label: "E-commerce & Retail" },
    { id: "education", label: "Education" },
    { id: "manufacturing", label: "Manufacturing" },
    { id: "media", label: "Media & Entertainment" },
    { id: "real-estate", label: "Real Estate" },
    { id: "legal", label: "Legal Services" },
    { id: "hospitality", label: "Hospitality & Travel" },
    { id: "other", label: "Other" }
  ];
  
  const toggleAudienceOption = (id) => {
    const currentSelections = [...userData.targetAudience];
    if (currentSelections.includes(id)) {
      updateUserData({ 
        targetAudience: currentSelections.filter(item => item !== id) 
      });
    } else {
      updateUserData({ 
        targetAudience: [...currentSelections, id] 
      });
    }
  };
  
  const toggleIndustryOption = (id) => {
    const currentSelections = [...userData.targetIndustries];
    if (currentSelections.includes(id)) {
      updateUserData({ 
        targetIndustries: currentSelections.filter(item => item !== id) 
      });
    } else {
      updateUserData({ 
        targetIndustries: [...currentSelections, id] 
      });
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save other audience and industry if selected
    if (userData.targetAudience.includes("other") && otherAudience) {
      updateUserData({ otherAudienceValue: otherAudience });
    }
    
    if (userData.targetIndustries.includes("other") && otherIndustry) {
      updateUserData({ otherIndustryValue: otherIndustry });
    }
    
    nextStep();
  };

  return (
    <div>
      <p className="text-neutral-300 mb-8 text-lg">
        Who are you looking to contact? Select all that apply.
      </p>
      
      <form onSubmit={handleSubmit} className="bg-[#212121] rounded-lg border border-[#333333] p-6">
        <div className="mb-8">
          <label className="block text-sm font-medium text-neutral-400 mb-3">
            Target audience roles
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {targetAudienceOptions.map((option) => (
              <div 
                key={option.id}
                onClick={() => toggleAudienceOption(option.id)}
                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                  userData.targetAudience.includes(option.id) 
                    ? "bg-green-500/10 border-green-500 text-white" 
                    : "bg-[#262626] border-[#404040] text-neutral-300 hover:bg-[#303030]"
                }`}
              >
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-sm mr-2 flex items-center justify-center ${
                    userData.targetAudience.includes(option.id)
                      ? "bg-green-500"
                      : "border border-[#505050]"
                  }`}>
                    {userData.targetAudience.includes(option.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                  {option.label}
                </div>
              </div>
            ))}
          </div>
          
          {userData.targetAudience.includes("other") && (
            <div className="mt-3">
              <input 
                type="text"
                value={otherAudience}
                onChange={(e) => setOtherAudience(e.target.value)}
                placeholder="Please specify other target audience" 
                required 
                className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <label className="block text-sm font-medium text-neutral-400 mb-3">
            Target industries
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {industryOptions.map((option) => (
              <div 
                key={option.id}
                onClick={() => toggleIndustryOption(option.id)}
                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                  userData.targetIndustries.includes(option.id) 
                    ? "bg-green-500/10 border-green-500 text-white" 
                    : "bg-[#262626] border-[#404040] text-neutral-300 hover:bg-[#303030]"
                }`}
              >
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-sm mr-2 flex items-center justify-center ${
                    userData.targetIndustries.includes(option.id)
                      ? "bg-green-500"
                      : "border border-[#505050]"
                  }`}>
                    {userData.targetIndustries.includes(option.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                  {option.label}
                </div>
              </div>
            ))}
          </div>
          
          {userData.targetIndustries.includes("other") && (
            <div className="mt-3">
              <input 
                type="text"
                value={otherIndustry}
                onChange={(e) => setOtherIndustry(e.target.value)}
                placeholder="Please specify other industry" 
                required 
                className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}
        </div>
        
        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="px-6 py-3 bg-transparent hover:bg-[#303030] text-white font-medium rounded-md transition-colors border border-[#404040] flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back
          </button>
          
          <button
            type="submit"
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors flex items-center"
          >
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TargetAudienceStep; 