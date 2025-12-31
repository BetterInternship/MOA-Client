import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signatoryControllerUpdateSelf } from "./app/api/endpoints/signatory/signatory";

export const useSignatoryAccountActions = () => {
  const queryClient = useQueryClient();

  const actions = {
    update: useMutation({
      mutationFn: signatoryControllerUpdateSelf,
      onSettled: () => queryClient.invalidateQueries({ queryKey: ["my-profile"] }),
    }),
  };

  return actions;
};
