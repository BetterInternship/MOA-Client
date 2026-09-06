import { mqJobsControllerGetMqJob } from "@/app/api";
import type { MQJob } from "@betterinternship/components";

/**
 * The `poll` fn `<MQJobsProvider>` needs — adapts Docs-Server's
 * `{success, job, message}` wrapper into the bare job `useMQJob`/`useMQJobs`
 * expect. Polled directly against Docs-Server (no Career-Server proxy):
 * `GET /api/mq-jobs/:id` is already `SignatoryAuthGuard` + owner-checked,
 * the same auth this app already uses everywhere else.
 */
export const pollMqJob = async (jobId: string): Promise<MQJob> => {
  const response = await mqJobsControllerGetMqJob(jobId);
  if (!response.success || !response.job) {
    throw new Error(response.message ?? "Job not found.");
  }
  // The generated DTO widens `status` to `string` (Swagger has no literal-union
  // annotation for it); the server only ever writes one of `MQJobStatus`'s
  // four values (`MqJobsService.toPublicJob` passes the DB enum straight
  // through), so this narrows a real contract the OpenAPI schema can't express.
  return response.job as MQJob;
};
