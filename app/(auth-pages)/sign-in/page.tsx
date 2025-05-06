import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-sm text-foreground">
        Don't have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Sign up
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input 
          name="email" 
          placeholder="you@example.com" 
          required 
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        <input
          type="password"
          name="password"
          placeholder="Your password"
          required
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button 
          className="bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
          type="submit"
          formAction={signInAction}
        >
          Sign in
        </button>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
