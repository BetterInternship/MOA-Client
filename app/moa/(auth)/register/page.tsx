import { CompanyRegisterForm } from "@/components/auth/CompanyRegisterForm";

export default function CompanyRegisterPage() {
  return (
    <div className="relative grid w-full min-h-[100svh] items-stretch lg:grid-cols-2 lg:px-0">
      {/* Left panel (form) */}
      <div className="flex items-center justify-center h-full p-6 lg:p-8">
        <CompanyRegisterForm />
      </div>

      {/* Right panel - only shown on desktop */}
      <div className="hidden lg:flex text-primary relative flex-col p-10 border-l bg-primary/5 text-right items-end">
        <div className="relative z-20 flex items-center text-lg font-semibold text-primary">
          BetterInternship | De La Salle University
        </div>
        <div className="relative z-20 mt-auto text-muted-foreground text-sm">
          <p>Welcome to the MOA Management Platform.</p>
          <p className="mt-1">For inquiries, contact legal@dlsu.edu.ph</p>
        </div>
      </div>
    </div>
  );
}
