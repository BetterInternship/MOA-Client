import { Loader } from "@/components/ui/loader";
import { useSchoolAuth } from "../providers/school-auth-provider";

export const SchoolAuthLoader = ({ children }: { children: React.ReactNode }) => {
  const auth = useSchoolAuth();
  return auth.isLoading ? <Loader></Loader> : <>{children}</>;
};
