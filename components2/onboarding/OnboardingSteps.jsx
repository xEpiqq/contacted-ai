import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Business Info Step Component
 */
export const BusinessInfoStep = ({ userData, updateUserData, nextStep, prevStep }) => {
  const [showTeamSize, setShowTeamSize] = useState(!!userData.businessType);
  const [showName, setShowName] = useState(!!userData.teamSize);
  const [canProceed, setCanProceed] = useState(false);
  
  const nameInputRef = useRef(null);
  const businessTypeRef = useRef(null);
  
  const businessTypes = [
    { id: "agency", label: "Marketing Agency" },
    { id: "saas", label: "SaaS Company" },
    { id: "ecommerce", label: "E-commerce" },
    { id: "consulting", label: "Consulting" },
    { id: "freelance", label: "Freelancer" },
    { id: "other", label: "Other" }
  ];
  
  const teamSizes = [
    { id: "solo", label: "Just me" },
    { id: "small", label: "2-10" },
    { id: "medium", label: "11-50" },
    { id: "large", label: "51-200" },
    { id: "enterprise", label: "200+" }
  ];
  
  // Validate when form can proceed
  useEffect(() => {
    if (userData.name && userData.businessType && userData.teamSize) {
      if (userData.businessType === "other") {
        setCanProceed(!!userData.otherBusinessTypeValue);
      } else {
        setCanProceed(true);
      }
    } else {
      setCanProceed(false);
    }
  }, [userData]);
  
  // Handle business type selection
  const handleBusinessTypeSelect = (typeId) => {
    updateUserData({ businessType: typeId });
    setShowTeamSize(true);
    
    // Clear other business type value if something other than "other" is selected
    if (typeId !== "other" && userData.otherBusinessTypeValue) {
      updateUserData({ otherBusinessTypeValue: "" });
    }
  };
  
  // Handle team size selection
  const handleTeamSizeSelect = (sizeId) => {
    updateUserData({ teamSize: sizeId });
    setShowName(true);
    
    // Focus the name input when it appears
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 300);
  };
  
  // Handle name input
  const handleNameChange = (e) => {
    updateUserData({ name: e.target.value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (canProceed) {
      nextStep();
    }
  };
  
  return (
    <div>
      <p className="text-neutral-400 mb-10 text-sm">
        Tell us about yourself and your business.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Type Section */}
        <div className="transition-all">
          <label className="text-sm font-medium text-neutral-300 mb-2 block">
            What type of business do you have?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {businessTypes.map(type => (
              <button
                key={type.id}
                type="button"
                ref={type.id === "agency" ? businessTypeRef : null}
                onClick={() => handleBusinessTypeSelect(type.id)}
                className={`text-sm py-2 px-3 rounded-md transition-colors ${
                  userData.businessType === type.id
                    ? "bg-green-500 text-black font-medium"
                    : "bg-[#212121] hover:bg-[#252525] text-neutral-300 border border-[#333333]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
          
          {userData.businessType === "other" && (
            <input 
              type="text"
              value={userData.otherBusinessTypeValue || ""}
              onChange={(e) => updateUserData({ otherBusinessTypeValue: e.target.value })}
              placeholder="Please specify" 
              required 
              className="w-full mt-2 px-3 py-2 rounded-md bg-[#212121] border border-[#333333] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
              autoFocus
            />
          )}
        </div>
        
        {/* Team Size Section */}
        <AnimatePresence>
          {showTeamSize && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                How many people are on your team?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {teamSizes.map(size => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleTeamSizeSelect(size.id)}
                    className={`text-sm py-2 px-3 rounded-md transition-colors ${
                      userData.teamSize === size.id
                        ? "bg-green-500 text-black font-medium"
                        : "bg-[#212121] hover:bg-[#252525] text-neutral-300 border border-[#333333]"
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Business Name Section */}
        <AnimatePresence>
          {showName && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label htmlFor="name" className="text-sm font-medium text-neutral-300 mb-2 block">
                What's your business name?
              </label>
              <input 
                id="name"
                ref={nameInputRef}
                type="text"
                value={userData.name || ""}
                onChange={handleNameChange}
                placeholder="Your business name" 
                required 
                className="w-full px-3 py-2 rounded-md bg-[#212121] border border-[#333333] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={!canProceed}
            className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors flex items-center text-sm ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Target Audience Step Component
 */
export const TargetAudienceStep = ({ userData, updateUserData, nextStep, prevStep, currentStep, totalSteps }) => {
  const [hasNiche, setHasNiche] = useState(userData.hasNiche);
  const [showNicheOptions, setShowNicheOptions] = useState(!!userData.hasNiche);
  const [canProceed, setCanProceed] = useState(false);
  
  const nicheOptions = [
    { id: "accountants", label: "Accountants" },
    { id: "auto-body", label: "Auto Body Repair" },
    { id: "carpet-cleaning", label: "Carpet Cleaning" },
    { id: "chiropractors", label: "Chiropractors" },
    { id: "cleaning", label: "Cleaning Companies" },
    { id: "construction", label: "Construction Companies" },
    { id: "contractors", label: "Contractors" },
    { id: "dentists", label: "Dentists" },
    { id: "ecommerce", label: "E-commerce" },
    { id: "electricians", label: "Electricians" },
    { id: "fencing", label: "Fencing Contractors" },
    { id: "financial", label: "Financial Advisors" },
    { id: "flooring", label: "Flooring" },
    { id: "gyms", label: "Gyms" },
    { id: "home-inspection", label: "Home Inspectors" },
    { id: "hvac", label: "HVAC" },
    { id: "insurance", label: "Insurance Agents" },
    { id: "it", label: "IT Services" },
    { id: "jewelry", label: "Jewelry Shops" },
    { id: "junk-removal", label: "Junk Removal" },
    { id: "landscaping", label: "Landscaping" },
    { id: "law-firms", label: "Law Firms" },
    { id: "logistics", label: "Logistics" },
    { id: "marketing", label: "Marketing Agencies" },
    { id: "martial-arts", label: "Martial Arts" },
    { id: "medspas", label: "Med Spas" },
    { id: "merchant", label: "Merchant Services" },
    { id: "mortgage", label: "Mortgage Brokers" },
    { id: "moving", label: "Moving Companies" },
    { id: "pest-control", label: "Pest Control" },
    { id: "photographers", label: "Photographers/Videographers" },
    { id: "pr", label: "Public Relations" },
    { id: "real-estate", label: "Real Estate Agents" },
    { id: "real-estate-inv", label: "Real Estate Investors" },
    { id: "remodeling", label: "Remodeling" },
    { id: "restaurants", label: "Restaurants" },
    { id: "roofing", label: "Roofing" },
    { id: "software", label: "Software Companies" },
    { id: "solar", label: "Solar" },
    { id: "staffing", label: "Staffing Agencies" },
    { id: "storage", label: "Storage Facilities" },
    { id: "therapists", label: "Therapists" },
    { id: "tree-service", label: "Tree Service" },
    { id: "other", label: "Other" }
  ];
  
  // Check if can proceed
  useEffect(() => {
    if (hasNiche === false) {
      setCanProceed(true);
    } else if (hasNiche === true) {
      setCanProceed(userData.targetNiche && userData.targetNiche.length > 0);
    } else {
      setCanProceed(false);
    }
  }, [hasNiche, userData.targetNiche]);
  
  const handleHasNicheSelect = (value) => {
    setHasNiche(value);
    updateUserData({ hasNiche: value });
    
    if (value) {
      setShowNicheOptions(true);
    } else {
      // If No selected, clear any previously selected niches and proceed immediately
      updateUserData({ targetNiche: [] });
      nextStep();
    }
  };
  
  const toggleNicheOption = (id) => {
    // For this step, we're only allowing a single niche selection or "other"
    updateUserData({ targetNiche: [id] });
  };
  
  const handleOtherNicheChange = (e) => {
    updateUserData({ otherNicheValue: e.target.value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (canProceed) {
      nextStep();
    }
  };

  return (
    <div>
      <p className="text-neutral-400 mb-10 text-sm">
        Let's find out if you have a specific business niche you want to target.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Has Niche Question */}
        <div className="transition-all">
          <label className="text-sm font-medium text-neutral-300 mb-2 block">
            Do you have a niche?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleHasNicheSelect(true)}
              className={`text-sm py-2 px-4 rounded-md transition-colors ${
                hasNiche === true
                  ? "bg-green-500 text-black font-medium"
                  : "bg-[#212121] hover:bg-[#252525] text-neutral-300 border border-[#333333]"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleHasNicheSelect(false)}
              className={`text-sm py-2 px-4 rounded-md transition-colors ${
                hasNiche === false
                  ? "bg-green-500 text-black font-medium"
                  : "bg-[#212121] hover:bg-[#252525] text-neutral-300 border border-[#333333]"
              }`}
            >
              No
            </button>
          </div>
        </div>
        
        {/* Niche Options */}
        <AnimatePresence>
          {showNicheOptions && hasNiche && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden transition-all"
            >
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Select your target niche
              </label>
              <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto pr-1">
                {nicheOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleNicheOption(option.id)}
                    className={`text-sm py-2 px-3 rounded-md transition-colors w-[calc(50%_-_4px)] sm:w-[calc(33.333%_-_5.333px)] md:w-[calc(25%_-_6px)] ${
                      userData.targetNiche && userData.targetNiche.includes(option.id)
                        ? "bg-green-500 text-black font-medium"
                        : "bg-[#212121] hover:bg-[#252525] text-neutral-300 border border-[#333333]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {userData.targetNiche && userData.targetNiche.includes("other") && (
                <input 
                  type="text"
                  value={userData.otherNicheValue || ""}
                  onChange={handleOtherNicheChange}
                  placeholder="Please specify your niche" 
                  className="w-full mt-2 px-3 py-2 rounded-md bg-[#212121] border border-[#333333] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                  autoFocus
                  required
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="pt-2 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 bg-transparent hover:bg-[#252525] text-white font-medium rounded-md transition-colors border border-[#333333] flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back
          </button>
          
          <button
            type="submit"
            disabled={!canProceed}
            className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors flex items-center text-sm ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Outreach Goals Step Component
 */
export const OutreachGoalsStep = ({ userData, updateUserData, nextStep, prevStep, currentStep, totalSteps }) => {
  const [showGoals, setShowGoals] = useState(!!userData.monthlyProspects);
  const [canProceed, setCanProceed] = useState(false);
  
  const outreachGoalOptions = [
    { id: "leads", label: "Generate qualified leads" },
    { id: "meetings", label: "Book more meetings" },
    { id: "sales", label: "Increase sales" },
    { id: "awareness", label: "Build brand awareness" },
    { id: "partnerships", label: "Strategic partnerships" },
    { id: "recruitment", label: "Recruit talent" }
  ];
  
  const prospectRanges = [
    { id: "0-500", label: "0-500" },
    { id: "500-2500", label: "500-2500" },
    { id: "2500-10000", label: "2500-10000" },
    { id: "10000-25000", label: "10000-25000" },
    { id: "25000-50000", label: "25000-50000" },
    { id: "50000-plus", label: "50000+" }
  ];
  
  // Validate when form can proceed
  useEffect(() => {
    if (userData.monthlyProspects && userData.outreachGoals && userData.outreachGoals.length > 0) {
      setCanProceed(true);
    } else {
      setCanProceed(false);
    }
  }, [userData.monthlyProspects, userData.outreachGoals]);
  
  const handleProspectsSelect = (rangeId) => {
    updateUserData({ monthlyProspects: rangeId });
    setShowGoals(true);
  };
  
  const toggleGoalOption = (id) => {
    const currentSelections = [...(userData.outreachGoals || [])];
    if (currentSelections.includes(id)) {
      updateUserData({ 
        outreachGoals: currentSelections.filter(item => item !== id) 
      });
    } else if (currentSelections.length < 3) {
      updateUserData({ 
        outreachGoals: [...currentSelections, id] 
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canProceed) {
      nextStep();
    }
  };

  return (
    <div>
      <p className="text-neutral-400 mb-10 text-sm">
        Tell us about your outreach goals so we can personalize your experience. This is the final step of the setup process.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Monthly Prospects */}
        <div className="transition-all">
          <label className="text-sm font-medium text-neutral-300 mb-2 block">
            Monthly prospects you plan to contact
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {prospectRanges.map(range => (
              <button
                key={range.id}
                type="button"
                onClick={() => handleProspectsSelect(range.id)}
                className={`text-sm py-2 px-3 rounded-md transition-colors ${
                  userData.monthlyProspects === range.id
                    ? "bg-green-500 text-black font-medium"
                    : "bg-[#212121] hover:bg-[#252525] text-neutral-300 border border-[#333333]"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Outreach Goals */}
        <AnimatePresence>
          {showGoals && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label className="text-sm font-medium text-neutral-300 mb-2 block">
                Select your primary goals (up to 3)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {outreachGoalOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleGoalOption(option.id)}
                    className={`text-sm py-2 px-3 rounded-md transition-colors ${
                      userData.outreachGoals && userData.outreachGoals.includes(option.id) 
                        ? "bg-[#212121] text-green-500 font-medium border-2 border-green-500" 
                        : userData.outreachGoals && userData.outreachGoals.length >= 3
                        ? "bg-[#212121] hover:bg-[#252525] text-neutral-500 opacity-60 cursor-not-allowed border border-[#333333]"
                        : "bg-[#212121] hover:bg-[#252525] text-neutral-300 border border-[#333333]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {userData.outreachGoals && userData.outreachGoals.length > 0 && (
                <div className="mt-2 text-xs text-neutral-500">
                  {userData.outreachGoals.length}/3 selected
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="pt-2 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 bg-transparent hover:bg-[#252525] text-white font-medium rounded-md transition-colors border border-[#333333] flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back
          </button>
          
          <button
            type="submit"
            disabled={!canProceed}
            className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-medium rounded-md transition-colors flex items-center text-sm ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Finish
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </form>
    </div>
  );
}; 