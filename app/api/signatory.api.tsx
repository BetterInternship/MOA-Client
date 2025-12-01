import { signatoryAccountsControllerUpdateSelf } from "./app/api/endpoints/signatory-accounts/signatory-accounts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSignatoryAccountActions = () => {
  console.log("useSignatoryAccountActions called");
  const queryClient = useQueryClient();

  const actions = {
    update: useMutation({
      mutationFn: signatoryAccountsControllerUpdateSelf,
      onSettled: () => queryClient.invalidateQueries({ queryKey: ["my-profile"] }),
    }),
  };

  return actions;
};
