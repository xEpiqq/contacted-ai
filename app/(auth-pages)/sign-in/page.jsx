import { signInAction, signInWithGoogleAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Link from "next/link";
import Image from "next/image";

export default async function Login(props) {
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
          <form action={signInWithGoogleAction}>
            <button 
              className="w-full mb-3 bg-transparent hover:bg-neutral-800 text-white font-medium py-3 px-4 rounded-md transition-colors border border-neutral-700 flex items-center justify-center gap-2"
              type="submit"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
          
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