import { describe, expect, it } from 'vitest';
import { buildMissionJobPayload, missionJobPayloadSchema } from './mission-job-payload';

describe('mission job payload', () => {
  const missionId = '11111111-1111-4111-8111-111111111111';

  it('parses mission_tick jobs', () => {
    const payload = buildMissionJobPayload({
      type: 'mission_tick',
      missionId,
      idempotencyKey: 'tick-1',
    });
    expect(missionJobPayloadSchema.safeParse(payload).success).toBe(true);
    expect(payload.type).toBe('mission_tick');
  });

  it('rejects unknown job types', () => {
    const result = missionJobPayloadSchema.safeParse({
      type: 'mission_unknown',
      missionId,
    });
    expect(result.success).toBe(false);
  });
});