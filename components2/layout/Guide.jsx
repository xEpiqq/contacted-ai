"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useSearchContext } from "../context/SearchContext";

function Guide() {
  const { 
    currentStep, 
    guideOpen, 
    setGuideOpen,
    answerType,
    brainstorm
  } = useSearchContext();

  // Only show guide for steps 0-2
  if (currentStep > 2) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none z-50">
      <AnimatePresence>
        {(currentStep === 0 ||
          currentStep === 1 ||
          currentStep === 2) &&
          (guideOpen ? (
            <motion.aside
              key="guide"
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-24 right-4 w-80 max-w-[90vw] bg-[#2b2b2b] border border-[#404040] rounded-2xl shadow-lg text-sm text-neutral-200 z-50 pointer-events-auto"
            >
              <button
                aria-label="minimize guide"
                onClick={() => setGuideOpen(false)}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>

              {/* ---------- GUIDE CONTENT ---------- */}
              {currentStep === 0 ? (
                /* STEP 1 GUIDE */
                <div className="p-4 space-y-3">
                  <h3 className="text-base font-semibold">B2B List Types</h3>

                  <p className="font-medium">1. People.</p>
                  <div className="bg-[#1f1f1f] border border-[#404040] rounded-md overflow-hidden">
                    <table className="w-full border-collapse text-[11px] text-neutral-300">
                      <thead>
                        <tr>
                          <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                            Name
                          </th>
                          <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                            Phone
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-[#404040] px-2 py-1">
                            john doe
                          </td>
                          <td className="border border-[#404040] px-2 py-1">
                            (555) 111-2222
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-[#404040] px-2 py-1">
                            obama obama
                          </td>
                          <td className="border border-[#404040] px-2 py-1">
                            (555) 333-4444
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-center text-neutral-400 text-xs my-1">or</p>

                  <p className="font-medium">2. Local Biz.</p>
                  <div className="bg-[#1f1f1f] border border-[#404040] rounded-md overflow-hidden">
                    <table className="w-full border-collapse text-[11px] text-neutral-300">
                      <thead>
                        <tr>
                          <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                            Local Biz
                          </th>
                          <th className="border border-[#404040] px-2 py-1 text-left font-normal">
                            Phone
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-[#404040] px-2 py-1">
                            joe's pizza
                          </td>
                          <td className="border border-[#404040] px-2 py-1">
                            (555) 555-5555
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-[#404040] px-2 py-1">
                            main street cleaners
                          </td>
                          <td className="border border-[#404040] px-2 py-1">
                            (555) 123-4567
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : currentStep === 1 ? (
                /* STEP 2 GUIDE */
                <div className="p-4 space-y-3">
                  <h3 className="text-base font-semibold">Guide</h3>

                  {brainstorm ? (
                    <>
                      <div>
                        <p className="font-medium">Brainstorm with AI</p>
                        <ul className="text-xs text-neutral-400 mt-2 space-y-2">
                          <li className="flex gap-2">
                            <span>1.</span>
                            <p>Describe your product or service</p>
                          </li>
                          <li className="flex gap-2">
                            <span>2.</span>
                            <p>AI will suggest relevant job titles</p>
                          </li>
                          <li className="flex gap-2">
                            <span>3.</span>
                            <p>Select titles you want to target</p>
                          </li>
                          <li className="flex gap-2">
                            <span>4.</span>
                            <p>Add them to your search with one click</p>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-green-400">
                        <p>
                          <span className="font-medium">Pro tip:</span> Be
                          specific about your customers. The more detailed you
                          are, the better the AI suggestions will be.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium">
                          1. Multiple job titles? use commas
                        </p>
                        <p className="text-neutral-400 text-xs mt-0.5 italic">
                          ceo, owner, founder
                        </p>
                      </div>

                      <div>
                        <p className="font-medium">
                          2. Want an exact match? use quotes
                        </p>

                        <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
                          <p>
                            type{" "}
                            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                              ceo
                            </code>{" "}
                            (no quotes) and you might find a man whose title is{" "}
                            <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                              'best ceo ever'
                            </code>
                          </p>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="bg-[#1f1f1f] border border-[#404040] rounded-md p-2 text-[11px] text-neutral-300">
                            <p>
                              type{" "}
                              <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                                "ceo"
                              </code>{" "}
                              and every person will have the exact title of{" "}
                              <code className="px-1 py-0.5 bg-[#2c2c2c] rounded">
                                "ceo"
                              </code>
                            </p>
                          </div>
                          <p className="text-neutral-400 text-xs mt-2 italic">
                            "ceo", "owner", "founder" is allowed
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* STEP 3 GUIDE */
                <div className="p-4 space-y-3">
                  <h3 className="text-base font-semibold">Industry Guide</h3>
                  <div>
                    <p className="font-medium">
                      1. Multiple industries? use commas
                    </p>
                    <p className="text-neutral-400 text-xs mt-0.5 italic">
                      software, healthcare, finance
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">
                      2. Think broadly or get specific
                    </p>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      e.g. renewable energy <span className="italic">vs.</span>{" "}
                      solar panel installers
                    </p>
                  </div>
                </div>
              )}
            </motion.aside>
          ) : (
            <motion.button
              key="guide-tab"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              aria-label="open guide"
              onClick={() => setGuideOpen(true)}
              className="fixed top-1/2 right-2 -translate-y-1/2 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3a3a] text-neutral-400 hover:text-white pointer-events-auto"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </motion.button>
          ))}
      </AnimatePresence>
    </div>
  );
}

export default Guide; 