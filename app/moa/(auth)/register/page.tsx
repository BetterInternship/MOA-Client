import { CompanyRegisterForm } from "@/components/moa/auth/CompanyRegisterForm";

export default function CompanyRegisterPage() {
  return (
    <div className="relative grid min-h-[100svh] w-full items-stretch lg:grid-cols-2 lg:px-0">
      {/* Left panel (form) */}
      <div className="flex h-full items-center justify-center p-6 lg:p-8">
        <CompanyRegisterForm />
      </div>

      {/* Right panel - only shown on desktop */}
      <div
        className="relative hidden flex-col items-end border-l bg-cover bg-center p-10 text-right lg:flex"
        style={{
          backgroundImage: "url('backgrounds/moa-login.jpg')",
        }}
      >
        {/* Overlay */}
        <div className="bg-primary/60 absolute inset-0" />

        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold text-white">
          <img src="/betterinternship-logo.png" alt="Logo" width={28} height={28} />
          <img src="/dlsu-logo.png" alt="Logo" width={28} height={28} />
          BetterInternship | De La Salle University
        </div>

        <div className="relative z-20 mt-auto text-sm text-white/90">
          <p>Welcome to the MOA Management Platform.</p>
          <p className="mt-1">For inquiries, contact legal@dlsu.edu.ph</p>
        </div>
      </div>
    </div>
  );
}
