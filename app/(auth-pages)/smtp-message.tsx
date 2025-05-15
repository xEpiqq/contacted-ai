import { ArrowUpRight, InfoIcon } from "lucide-react";
import Link from "next/link";

export function SmtpMessage() {
  return (
    <div className="flex gap-3">
      <InfoIcon size={16} className="text-zinc-500 mt-0.5 flex-shrink-0" />
      <div className="flex flex-col gap-1">
        <small className="text-sm text-zinc-400">
          <strong className="text-zinc-300">Note:</strong> Emails are rate limited. Enable Custom SMTP to
          increase the rate limit.
        </small>
        <div>
          <Link
            href="https://supabase.com/docs/guides/auth/auth-smtp"
            target="_blank"
            className="text-green-500/80 hover:text-green-400 flex items-center text-xs gap-1 transition-colors"
          >
            Learn more <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
