import { CompanyRegisterForm } from "@/components/auth/CompanyRegisterForm";

export default function CompanyRegisterPage() {
  return (
    <div className="relative grid min-h-[100svh] w-full items-stretch lg:grid-cols-2 lg:px-0">
      {/* Left panel (form) */}
      <div className="flex h-full items-center justify-center p-6 lg:p-8">
        <CompanyRegisterForm />
      </div>

      {/* Right panel - only shown on desktop */}
      <div className="text-primary bg-primary/5 relative hidden flex-col items-end border-l p-10 text-right lg:flex">
        <div className="text-primary relative z-20 flex items-center text-lg font-semibold">
          BetterInternship | De La Salle University
        </div>
        <div className="text-muted-foreground relative z-20 mt-auto text-sm">
          <p>Welcome to the MOA Management Platform.</p>
          <p className="mt-1">For inquiries, contact legal@dlsu.edu.ph</p>
        </div>
      </div>
    </div>
  );
}
