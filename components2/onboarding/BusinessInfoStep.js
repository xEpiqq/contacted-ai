import React, { useState } from "react";

const BusinessInfoStep = ({ userData, updateUserData, nextStep, prevStep, currentStep, totalSteps }) => {
  const [otherBusinessType, setOtherBusinessType] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Add other business type if needed
    if (userData.businessType === "other" && otherBusinessType) {
      updateUserData({ otherBusinessTypeValue: otherBusinessType });
    }
    
    nextStep();
  };

  return (
    <div>
      <p className="text-neutral-300 mb-8 text-lg">
        Tell us a bit about your business so we can customize your experience.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-[#212121] rounded-lg border border-[#333333] p-6">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-neutral-400">Your name</label>
          <input 
            id="name"
            type="text"
            value={userData.name}
            onChange={(e) => updateUserData({ name: e.target.value })}
            placeholder="John Doe" 
            required 
            className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="businessName" className="text-sm font-medium text-neutral-400">Business or agency name</label>
          <input 
            id="businessName"
            type="text"
            value={userData.businessName}
            onChange={(e) => updateUserData({ businessName: e.target.value })}
            placeholder="Acme Agency" 
            required 
            className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="businessType" className="text-sm font-medium text-neutral-400">Business type</label>
          <select 
            id="businessType"
            value={userData.businessType}
            onChange={(e) => updateUserData({ businessType: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="" disabled>Select business type</option>
            <option value="agency">Marketing Agency</option>
            <option value="saas">SaaS Company</option>
            <option value="ecommerce">E-commerce</option>
            <option value="consulting">Consulting Firm</option>
            <option value="freelance">Freelancer</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {userData.businessType === "other" && (
          <div className="space-y-1.5">
            <label htmlFor="otherBusinessType" className="text-sm font-medium text-neutral-400">Specify your business type</label>
            <input 
              id="otherBusinessType"
              type="text"
              value={otherBusinessType}
              onChange={(e) => setOtherBusinessType(e.target.value)}
              placeholder="Please specify" 
              required 
              className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        )}
        
        <div className="space-y-1.5">
          <label htmlFor="teamSize" className="text-sm font-medium text-neutral-400">Team size</label>
          <select 
            id="teamSize"
            value={userData.teamSize}
            onChange={(e) => updateUserData({ teamSize: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="" disabled>Select team size</option>
            <option value="solo">Just me</option>
            <option value="small">2-10 employees</option>
            <option value="medium">11-50 employees</option>
            <option value="large">51-200 employees</option>
            <option value="enterprise">200+ employees</option>
          </select>
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

export default BusinessInfoStep; 