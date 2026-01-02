import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const FormContinuationSuccessModal = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <div className="flex w-full flex-col items-center space-y-2">
      <div className="p-5">
        <CheckCircle2 className="text-supportive h-20 w-20"></CheckCircle2>
      </div>
      <Button
        className="w-full"
        variant="outline"
        disabled={loading}
        scheme="secondary"
        onClick={() => (setLoading(true), alert(loading), router.push("/dashboard"))}
      >
        {loading && <Loader2 className="animate-spin"></Loader2>}
        View my forms
      </Button>
    </div>
  );
};
