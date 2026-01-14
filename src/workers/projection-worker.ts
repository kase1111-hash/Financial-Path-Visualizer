/**
 * Projection Web Worker
 *
 * Runs financial projections in a background thread to avoid blocking the UI.
 */

import type { FinancialProfile } from '@models/profile';
import type { Trajectory } from '@models/trajectory';
import type { Comparison, Change } from '@models/comparison';
import { generateTrajectory, generateQuickTrajectory } from '@engine/projector';
import { compareTrajectories } from '@engine/comparator';

/**
 * Message types for worker communication.
 */
export type WorkerRequest =
  | { type: 'generate'; profile: FinancialProfile }
  | { type: 'generateQuick'; profile: FinancialProfile; years: number }
  | { type: 'compare'; baseline: Trajectory; alternate: Trajectory; changes: Change[]; name: string };

export type WorkerResponse =
  | { type: 'trajectory'; trajectory: Trajectory }
  | { type: 'comparison'; comparison: Comparison }
  | { type: 'error'; error: string };

/**
 * Handle incoming messages.
 */
self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const request = event.data;

  try {
    switch (request.type) {
      case 'generate': {
        const trajectory = generateTrajectory(request.profile);
        const response: WorkerResponse = { type: 'trajectory', trajectory };
        self.postMessage(response);
        break;
      }

      case 'generateQuick': {
        const trajectory = generateQuickTrajectory(request.profile, request.years);
        const response: WorkerResponse = { type: 'trajectory', trajectory };
        self.postMessage(response);
        break;
      }

      case 'compare': {
        const comparison = compareTrajectories(
          request.baseline,
          request.alternate,
          request.changes,
          request.name
        );
        const response: WorkerResponse = { type: 'comparison', comparison };
        self.postMessage(response);
        break;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: WorkerResponse = { type: 'error', error: errorMessage };
    self.postMessage(response);
  }
};
