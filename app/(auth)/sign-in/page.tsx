import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm/AuthForm";
import { callbackFromSearchParams } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Sign in · Flo" };

export default async function Page({ searchParams }: PageProps<"/sign-in">) {
  return <AuthForm mode="sign-in" callbackUrl={await callbackFromSearchParams(searchParams)} />;
}
