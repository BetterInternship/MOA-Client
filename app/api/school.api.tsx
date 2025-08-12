import {
  useSchoolEntitiesControllerApproveRequest,
  useSchoolEntitiesControllerDenyRequest,
  useSchoolEntitiesControllerGetMyPartners,
  useSchoolEntitiesControllerGetMyRequests,
} from "./app/api/endpoints/school-entities/school-entities";
import {
  useSchoolMoaControllerApprove,
  useSchoolMoaControllerDeny,
  useSchoolMoaControllerGetMine,
} from "./app/api/endpoints/school-moa/school-moa";

export const useEntities = () => {
  const entities = useSchoolEntitiesControllerGetMyPartners();

  return {
    entities: entities.data,
  };
};

export const useMoaRequests = () => {
  const requests = useSchoolMoaControllerGetMine();
  const approve = useSchoolMoaControllerApprove();
  const deny = useSchoolMoaControllerDeny();

  return {
    requests: requests.data,
    approve: approve.mutateAsync,
    deny: deny.mutateAsync,
  };
};

export const useNewEntityRequests = () => {
  const requests = useSchoolEntitiesControllerGetMyRequests();
  const approve = useSchoolEntitiesControllerApproveRequest();
  const deny = useSchoolEntitiesControllerDenyRequest();

  return {
    requests: requests.data,
    approve: approve.mutateAsync,
    deny: deny.mutateAsync,
  };
};
