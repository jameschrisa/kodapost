import { SignUp } from "@clerk/nextjs";
import { PageTransition } from "@/components/shared/PageTransition";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <PageTransition className="flex min-h-screen items-center justify-center bg-background">
      <SignUp />
    </PageTransition>
  );
}
