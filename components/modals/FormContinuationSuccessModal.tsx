import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useModalRegistry from "../modal-registry";

const checkPathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      delay: 0.12,
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const iconAnimation = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.22, ease: "easeOut" },
};

const contentAnimation = {
  initial: { y: 8, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { delay: 0.08, duration: 0.24, ease: "easeOut" },
};

const buttonAnimation = {
  initial: { y: 8, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { delay: 0.14, duration: 0.24, ease: "easeOut" },
};

function AnimatedCheck() {
  return (
    <motion.svg
      width="64"
      height="64"
      viewBox="0 0 52 52"
      fill="none"
      className="text-green-700"
      initial="hidden"
      animate="visible"
    >
      <motion.path
        d="M14 27 L22 35 L38 18"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={checkPathVariants}
      />
    </motion.svg>
  );
}

type FormContinuationSuccessModalProps = {
  title?: string;
  description?: string;
  buttonLabel?: string;
  redirectPath?: string;
  onClose?: () => void;
};

export const FormContinuationSuccessModal = ({
  title = "Form signed successfully",
  description = "You can now view and manage it in your forms.",
  buttonLabel = "Go To My Forms",
  redirectPath = "/dashboard",
  onClose,
}: FormContinuationSuccessModalProps = {}) => {
  const [loading, setLoading] = useState(false);
  const modalRegistry = useModalRegistry();
  const router = useRouter();

  const handleNavigateToForms = () => {
    setLoading(true);
    router.push(redirectPath);
    setTimeout(() => {
      onClose?.();
      modalRegistry.formContinuationSuccess.close();
    }, 1000);
  };

  return (
    <div className="mt-2 flex flex-col items-start gap-2 px-6 py-10 text-center">
      <h2 className="text-foreground flex flex-row items-center text-left text-3xl font-semibold">
        <span className="mt-1 mr-2">Form signed successfully</span>
        <AnimatedCheck />
      </h2>

      <div className="mt-5 flex w-full flex-col items-start rounded-[0.33em] bg-gray-100 p-4 sm:mt-8 sm:p-5 sm:px-6">
        <div className="text-left">
          You will be emailed the final document once all signatories have signed.
        </div>
        <div className="mt-5 text-left">
          If you are the last person to sign this form, you should expect to receive it soon.
        </div>
      </div>
      <div>
        <div className="mt-4 mb-2 text-left text-gray-500 italic">
          For help or concerns, contact us at{" "}
          <a href="https://facebook.com/shi.sherwin">facebook.com/shi.sherwin</a>.
        </div>
      </div>

      <motion.div
        className="mt-2 w-full"
        initial={buttonAnimation.initial}
        animate={buttonAnimation.animate}
        transition={buttonAnimation.transition}
      >
        <Button size="lg" className="w-full" disabled={loading} onClick={handleNavigateToForms}>
          {loading ? "Redirecting..." : buttonLabel}
        </Button>
      </motion.div>
    </div>
  );
};
