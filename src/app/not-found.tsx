import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsl(270 70% 55% / 0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-md">
        <p className="mb-4 text-7xl font-black tracking-tight text-white/10 sm:text-9xl">
          404
        </p>

        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Page Not Found
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-white/45">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-400 hover:shadow-purple-500/30"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
