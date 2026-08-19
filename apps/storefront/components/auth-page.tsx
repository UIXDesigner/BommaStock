import type { ReactNode } from "react";
import Link from "next/link";

function AuthMark() {
  return (
    <Link
      href="/"
      className="relative mx-auto flex size-[72px] items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="absolute -inset-[3px] rounded-full opacity-80"
        style={{
          background:
            "conic-gradient(from 210deg, #c4b5fd, #f9a8d4, #93c5fd, #ddd6fe, #c4b5fd)",
        }}
      />
      <span className="relative flex size-[66px] overflow-hidden rounded-full bg-white p-[3px]">
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-[#EEEAF8]">
          <img
            src="/logo.png"
            alt="Bommastock"
            width={285}
            height={40}
            className="h-auto w-[85%] object-contain"
            decoding="async"
          />
        </span>
      </span>
    </Link>
  );
}

export function AuthPage({
  title,
  description,
  footer,
  children,
}: {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col justify-center px-4 py-10"
    >
      <div className="mx-auto w-full max-w-[400px]">
        <div className="rounded-2xl bg-white px-8 py-10 shadow-[0_10px_40px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex justify-center">
            <AuthMark />
          </div>
          <div className="mb-6">
            <h1 className="text-[30px] leading-9 font-bold tracking-tight text-black">
              {title}
            </h1>
            <p className="mt-1 text-[15px] leading-6 font-normal text-[#6B7280]">
              {description}
            </p>
          </div>
          {children}
        </div>
        {footer ? (
          <p className="mt-5 text-center text-[13px] leading-5 text-[#9CA3AF]">
            {footer}
          </p>
        ) : null}
      </div>
    </main>
  );
}
