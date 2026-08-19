import type { DailySequenceKind } from "@bommastock/types";

export async function allocateDailySequence(
  _kind: DailySequenceKind,
  _dateKey: string,
): Promise<number> {
  throw new Error("allocateDailySequence is not implemented in Phase 1.");
}
