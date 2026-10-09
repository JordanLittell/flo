import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm/AuthForm";
import { callbackFromSearchParams } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Create account · Flo" };

export default async function Page({ searchParams }: PageProps<"/sign-up">) {
  return <AuthForm mode="sign-up" callbackUrl={await callbackFromSearchParams(searchParams)} />;
}
