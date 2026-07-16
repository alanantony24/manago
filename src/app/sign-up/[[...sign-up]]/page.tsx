import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

const customLocalization = {
  signUp: {
    start: {
      title: "Create your ManaGo account",
      subtitle: " ",
    },
  },
};

export default function Page() {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-900">
      <div className="absolute left-0 top-0 bottom-0 w-full md:w-1/2 bg-slate-900">
        <iframe
          className="w-full h-full opacity-40 grayscale invert contrast-125 pointer-events-none"
          src="https://www.openstreetmap.org/export/embed.html?bbox=103.8400%2C1.2900%2C103.8600%2C1.3050&amp;layer=mapnik"
          style={{ border: 0 }}
          title="Singapore Map Preview"
        />
      </div>

      <div className="z-10 w-full h-full flex items-center justify-center p-6 bg-transparent md:bg-[#82C4D1] md:absolute md:right-0 md:top-0 md:bottom-0 md:w-1/2 md:bg-[#82C4D1]">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.png"
            alt="Manago Logo"
            width={300}
            height={300}
          />
          <SignUp
            localization={customLocalization}
            appearance={{
              elements: {
                headerTitle:
                  "text-lg font-semibold text-slate-800 tracking-tight",
                headerSubtitle: "text-xs text-slate-500",
                card: "shadow-xl border border-slate-100",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
