import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Link from "next/link";
import Image from "next/image";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <>
      {/* Login Form Section (40% width) - Dark themed */}
      <div className="w-full md:w-2/5 flex flex-col justify-center min-h-screen bg-[#212121] text-white p-10 md:p-16 lg:p-20">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8">
            <div className="flex items-center mb-12">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black mr-3">C</div>
              <span className="text-white text-xl font-medium">Contacted.ai</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-neutral-400">Sign in to your account to continue</p>
          </div>
          
          {/* Google sign-in button */}
          <button 
            className="w-full mb-3 bg-transparent hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-md transition-colors border border-neutral-700 flex items-center justify-center gap-2"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M17.13 17.21c-.73.47-1.58.82-2.44 1-1.89.37-3.88.07-5.5-.89-2.36-1.41-3.66-4.12-3.19-6.82.49-2.89 2.95-5.34 5.89-5.78 1.96-.27 4 .22 5.55 1.44"/><path d="M8.48 12h7.08"/></svg>
            <span>Continue with Google</span>
          </button>
          
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#212121] text-neutral-500">or</span>
            </div>
          </div>
          
          <form className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-neutral-400">Email</label>
        <input 
          name="email" 
                type="email"
          placeholder="you@example.com" 
          required 
                className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
        />
            </div>
            
            <div className="space-y-1.5">
        <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium text-neutral-400">Password</label>
          <Link
                  className="text-xs text-neutral-400 hover:text-green-500 transition-colors"
            href="/forgot-password"
          >
                  Forgot password?
          </Link>
        </div>
        <input
          type="password"
          name="password"
                placeholder="••••••••••••" 
          required
                className="w-full px-4 py-3 rounded-md bg-[#303030] border border-[#404040] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
        />
            </div>

        <button 
              className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-md transition-colors"
          type="submit"
          formAction={signInAction}
        >
              Sign In
        </button>
            
        <FormMessage message={searchParams} />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Don't have an account?{" "}
                <Link className="text-green-500 hover:text-green-400 font-medium" href="/sign-up">
                  Sign Up Now
                </Link>
              </p>
            </div>
          </form>
          
          <div className="mt-20 pt-6 border-t border-[#404040]/30">
            <p className="text-xs text-neutral-600 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
      
      {/* Visual Section (60% width) */}
      <div className="hidden md:flex flex-col justify-center w-3/5 bg-[#181818] text-white p-16 relative">        
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col h-full justify-center">
            <div className="text-6xl font-bold text-neutral-700 mb-6">"</div>
            <blockquote className="text-2xl font-medium text-white mb-8">
              @contacted.ai is lit. It took me less than 10 minutes to setup, the interface is just amazing.
            </blockquote>
            
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-[#262626] mr-4"></div>
              <div>
                <p className="font-medium text-white">Sarah Johnson</p>
                <p className="text-neutral-400">@sarahjohnson</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
