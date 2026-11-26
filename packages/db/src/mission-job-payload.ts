import { z } from 'zod';

export const missionJobTypeSchema = z.enum(['mission_tick', 'mission_nudge', 'mission_expire']);

export type MissionJobType = z.infer<typeof missionJobTypeSchema>;

export const missionJobPayloadSchema = z
  .object({
    type: missionJobTypeSchema,
    missionId: z.string().uuid(),
    idempotencyKey: z.string().min(1).optional(),
    attempts: z.number().int().nonnegative().optional(),
    enqueuedAt: z.string().datetime().optional(),
  })
  .strict();

export type MissionJobPayload = z.infer<typeof missionJobPayloadSchema>;

export function buildMissionJobPayload(input: {
  type: MissionJobType;
  missionId: string;
  idempotencyKey?: string;
  now?: Date;
}): MissionJobPayload {
  return missionJobPayloadSchema.parse({
    type: input.type,
    missionId: input.missionId,
    idempotencyKey: input.idempotencyKey,
    enqueuedAt: (input.now ?? new Date()).toISOString(),
  });
}