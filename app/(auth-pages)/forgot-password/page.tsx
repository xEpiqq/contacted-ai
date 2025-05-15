import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Link from "next/link";
import Image from "next/image";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <>
      {/* Forgot Password Form Section (40% width) - Dark themed */}
      <div className="w-full md:w-2/5 flex flex-col justify-center min-h-screen bg-[#212121] text-white p-10 md:p-16 lg:p-20">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-10">
            <div className="flex items-center mb-12">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-black mr-3">C</div>
              <span className="text-white text-xl font-medium">Contacted.ai</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">Reset password</h2>
            <p className="text-neutral-400">Enter your email and we'll send you a reset link</p>
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
            
            <button 
              className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-md transition-colors mt-4"
              type="submit"
              formAction={forgotPasswordAction}
            >
              Send Reset Link
            </button>
            
            <FormMessage message={searchParams} />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-400">
                Remember your password?{" "}
                <Link className="text-green-500 hover:text-green-400 font-medium" href="/sign-in">
                  Sign In
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
              The password reset process is quick and secure. Just another example of Contacted.ai's user-friendly approach.
            </blockquote>
            
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-[#262626] mr-4"></div>
              <div>
                <p className="font-medium text-white">Alex Rivera</p>
                <p className="text-neutral-400">@alexrivera</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
