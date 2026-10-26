import { classicMarbleReferenceProfile, classicMarbleTourismToll } from './marble-reference-profile';
import type { ClassicMarbleClass } from './marble-reference-profile';

export type TourismRentContext = { ownerTourismCount: number; beachVisitStage: number; visitorPosition: number; landingIndex: number };

/**
 * Values for the three tourism toll steps are known, but the original selector
 * rule is not. Keep that missing rule isolated; no tier is guessed here.
 */
export function classicMarbleTourismRent(name: string, context: TourismRentContext, playerClass: ClassicMarbleClass = 'business') {
  const step = selectClassicMarbleTourismStep(name, context);
  return step === null ? { amount: null, step: null, status: 'selector-unverified' as const }
    : { amount: classicMarbleTourismToll(name, step, playerClass), step, status: 'resolved' as const };
}

export function selectClassicMarbleTourismStep(name: string, context: TourismRentContext): number | null {
  const site = classicMarbleReferenceProfile.tourism.find(item => item.name === name);
  if (!site) return null;
  if (site.rentMode === 'owner-count') return Number.isInteger(context.ownerTourismCount) && context.ownerTourismCount >= 1 && context.ownerTourismCount <= site.rentSchedule.length ? context.ownerTourismCount - 1 : null;
  if (site.rentMode === 'visit-stage') return Number.isInteger(context.beachVisitStage) && context.beachVisitStage >= 1 && context.beachVisitStage <= site.rentSchedule.length ? context.beachVisitStage - 1 : null;
  return null;
}
