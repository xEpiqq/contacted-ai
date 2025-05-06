import { Message } from "@/components/form-message";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return <ResetPasswordForm message={searchParams} />;
} 