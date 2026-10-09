"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { signUp } from "@/lib/auth/actions";
import Button from "../Button/Button";
import styles from "./AuthForm.module.css";

export interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  /** Already validated on the server: a path on this site. */
  callbackUrl: string;
}

const COPY = {
  "sign-in": {
    heading: "Welcome back",
    submit: "Sign in",
    switchText: "New here?",
    switchLabel: "Create an account",
    switchHref: "/sign-up",
  },
  "sign-up": {
    heading: "Create your account",
    submit: "Create account",
    switchText: "Have an account?",
    switchLabel: "Sign in",
    switchHref: "/sign-in",
  },
} as const;

/** Email and password form for both sign-in and sign-up. */
export default function AuthForm({ mode, callbackUrl }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const copy = COPY[mode];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const created = await signUp(form);
        if (!created.ok) return setError(created.error);
      }
      const result = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        callbackUrl,
        redirect: false,
      });
      if (!result?.ok) return setError("Email or password is incorrect.");
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  const switchHref = callbackUrl === "/" ? copy.switchHref : `${copy.switchHref}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <p className={styles.wordmark}>Flo</p>
        <p className={styles.tagline}>Your mat, your pace, your vibe.</p>
      </div>

      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.heading}>{copy.heading}</h1>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            className={styles.input}
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={mode === "sign-up" ? 8 : undefined}
            required
          />
        </label>

        <p className={styles.error} aria-live="polite">
          {error}
        </p>

        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {copy.submit}
        </Button>

        <p className={styles.switch}>
          {copy.switchText} <Link href={switchHref}>{copy.switchLabel}</Link>
        </p>
      </form>
    </main>
  );
}
