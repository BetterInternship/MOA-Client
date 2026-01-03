import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useModalRegistry from "../modal-registry";

function AnimatedCheck() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 52 52"
      fill="none"
      className="text-green-700"
    >
      <path
        d="M14 27 L22 35 L38 18"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        className="check-path"
      />
    </svg>
  );
}

export const FormContinuationSuccessModal = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const modalRegistry = useModalRegistry();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigateToForms = () => {
    setLoading(true);
    router.push("/dashboard");
    setTimeout(() => modalRegistry.formContinuationSuccess.close(), 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10 text-center mt-2">
      <style>{`
        .check-path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: drawCheck 300ms ease-out forwards;
        }

        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pop {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-green-100 ${
          show ? "animate-[pop_220ms_ease-out]" : "opacity-0"
        }`}
      >
        <AnimatedCheck />
      </div>

      <div className="">
        <h2 className="text-2xl font-semibold text-foreground">
          Form sent successfully
        </h2>
        <p className="text-sm text-muted-foreground">
          You can now view and manage it in your forms.
        </p>
      </div>

      <Button
        size="lg"
        className="mt-2 w-full"
        disabled={loading}
        onClick={handleNavigateToForms}
      >
        {loading ? "Redirecting..." : "View my forms"}
      </Button>
    </div>
  );
};