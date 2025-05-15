import React, { useState } from "react";

const OutreachGoalsStep = ({ userData, updateUserData, nextStep, prevStep, currentStep, totalSteps }) => {
  const [otherGoal, setOtherGoal] = useState("");
  
  const outreachGoalOptions = [
    { id: "leads", label: "Generate qualified leads" },
    { id: "meetings", label: "Book more meetings" },
    { id: "sales", label: "Increase sales" },
    { id: "awareness", label: "Build brand awareness" },
    { id: "partnerships", label: "Form strategic partnerships" },
    { id: "recruitment", label: "Recruit talent" },
    { id: "other", label: "Other" }
  ];
  
  const toggleGoalOption = (id) => {
    const currentSelections = [...userData.outreachGoals];
    if (currentSelections.includes(id)) {
      updateUserData({ 
        outreachGoals: currentSelections.filter(item => item !== id) 
      });
    } else {
      updateUserData({ 
        outreachGoals: [...currentSelections, id] 
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save other goal if selected
    if (userData.outreachGoals.includes("other") && otherGoal) {
      updateUserData({ otherGoalValue: otherGoal });
    }
    
    nextStep();
  };

  return (
    <div>
      <p className="text-neutral-300 mb-8 text-lg">
        What are your primary outreach goals? This will help us customize your dashboard and templates.
      </p>
      
      <form onSubmit={handleSubmit} className="bg-[#212121] rounded-lg border border-[#333333] p-6 space-y-8">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-3">
            Select your goals (choose up to 3)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {outreachGoalOptions.map((option) => (
              <div 
                key={option.id}
                onClick={() => userData.outreachGoals.length < 3 || userData.outreachGoals.includes(option.id) ? toggleGoalOption(option.id) : null}
                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                  userData.outreachGoals.includes(option.id) 
                    ? "bg-green-500/10 border-green-500 text-white" 
                    : userData.outreachGoals.length >= 3
                    ? "bg-[#262626] border-[#404040] text-neutral-500 opacity-60 cursor-not-allowed"
                    : "bg-[#262626] border-[#404040] text-neutral-300 hover:bg-[#303030]"
                }`}
              >
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-sm mr-2 flex items-center justify-center ${
                    userData.outreachGoals.includes(option.id)
                      ? "bg-green-500"
                      : "border border-[#505050]"
                  }`}>
                    {userData.outreachGoals.includes(option.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                  {option.label}
                </div>
              </div>
            ))}
          </div>
          
          {userData.outreachGoals.includes("other") && (
            <div className="mt-3">
              <input 
                type="text"
                value={otherGoal}
                onChange={(e) => setOtherGoal(e.target.value)}
                placeholder="Please specify other goal" 
                required 
                className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <label htmlFor="monthlyProspects" className="text-sm font-medium text-neutral-400">
            How many prospects do you plan to contact monthly?
          </label>
          <select 
            id="monthlyProspects"
            value={userData.monthlyProspects}
            onChange={(e) => updateUserData({ monthlyProspects: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="" disabled>Select a range</option>
            <option value="less-50">Less than 50</option>
            <option value="50-200">50 - 200</option>
            <option value="200-500">200 - 500</option>
            <option value="500-1000">500 - 1,000</option>
            <option value="1000-plus">More than 1,000</option>
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

export default OutreachGoalsStep; 