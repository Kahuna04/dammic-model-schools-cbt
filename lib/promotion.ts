import { ClassLevel } from '@prisma/client';

export const PROMOTION_MAP: Record<ClassLevel, ClassLevel | null> = {
  JSS1: 'JSS2',
  JSS2: 'JSS3',
  JSS3: 'SSS1',
  SSS1: 'SSS2',
  SSS2: 'SSS3',
  SSS3: 'GRADUATED',
  GRADUATED: null,
};

export function getNextClassLevel(currentLevel: ClassLevel | null): ClassLevel | null {
  if (!currentLevel) return null;
  return PROMOTION_MAP[currentLevel] || null;
}
