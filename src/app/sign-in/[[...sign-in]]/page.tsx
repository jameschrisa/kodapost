import { SignIn } from "@clerk/nextjs";
import { PageTransition } from "@/components/shared/PageTransition";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <PageTransition className="flex min-h-screen items-center justify-center bg-background">
      <SignIn />
    </PageTransition>
  );
}
