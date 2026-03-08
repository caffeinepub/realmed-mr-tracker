import { Button } from "@/components/ui/button";
import { Bell, ClipboardList, Loader2, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const FEATURES = [
  { icon: Users, text: "Manage doctor profiles & territories" },
  { icon: ClipboardList, text: "Log calls & track visit outcomes" },
  { icon: Bell, text: "Smart reminders & follow-ups" },
];

export default function LoginPage() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="min-h-screen bg-navy flex flex-col overflow-hidden relative">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, oklch(0.62 0.13 195) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, oklch(0.55 0.14 200) 0%, transparent 50%)`,
        }}
        aria-hidden="true"
      />

      {/* Decorative pattern */}
      <div
        className="absolute top-0 right-0 w-80 h-80 opacity-5"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full text-teal"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }, (_, i) =>
            Array.from({ length: 10 }, (_, j) => (
              <ellipse
                key={`eye-${i * 10 + j}`}
                cx={i * 20 + 10}
                cy={j * 20 + 10}
                rx={6}
                ry={3}
              />
            )),
          )}
        </svg>
      </div>

      <div className="relative flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center space-y-8 max-w-sm"
          >
            {/* Logo */}
            <div className="bg-white rounded-2xl px-6 py-4 shadow-xl">
              <img
                src="/assets/uploads/REALMED-PHARMA-1.png"
                alt="Realmed Pharma"
                className="h-16 w-auto object-contain"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold text-white tracking-tight">
                Realmed MR Tracker
              </h1>
              <p className="text-white/50 text-sm font-sans">
                Realmed Pharma · Ophthalmology Division
              </p>
            </div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full space-y-3"
            >
              {FEATURES.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal/20 flex items-center justify-center text-teal flex-shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <p className="text-white/70 text-sm font-sans">{item.text}</p>
                </div>
              ))}
            </motion.div>

            {/* Login */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="w-full space-y-4"
            >
              <Button
                data-ocid="login.primary_button"
                onClick={login}
                disabled={isLoggingIn}
                size="lg"
                className="w-full h-14 text-base font-semibold rounded-xl text-white border-0 shadow-lg transition-all"
                style={{ backgroundColor: "oklch(0.62 0.13 195)" }}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Sign In Securely
                  </>
                )}
              </Button>

              {isLoginError && (
                <p
                  data-ocid="login.error_state"
                  className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg px-3 py-2"
                >
                  {loginError?.message ?? "Login failed. Please try again."}
                </p>
              )}

              <p className="text-white/30 text-xs text-center">
                Secured by Internet Identity · Realmed Pharma Internal Use
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline hover:text-white/40 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
