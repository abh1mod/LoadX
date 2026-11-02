import React from 'react';
import { Check } from 'lucide-react';
import { MILESTONES, formatDateTime } from '../../utils/formatters';

export const Stepper = ({
  milestones = [],
  currentMilestone = 'Awarded',
  onAdvance = null,
  isAdvanceable = false,
  advanceLoading = false
}) => {
  const currentIndex = MILESTONES.indexOf(currentMilestone);
  const isDeliveredFinished = currentMilestone === 'Delivered';

  // Map recorded milestone details (completedAt, note)
  const recordedMap = new Map();
  milestones.forEach((m) => recordedMap.set(m.name, m));

  return (
    <div className="w-full">
      <div className="relative">
        <div className="space-y-6">
          {MILESTONES.map((stepName, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const isFinishedStep = isCompleted && (!isCurrent || (isCurrent && isDeliveredFinished));
            const isPulsingCurrent = isCurrent && !isDeliveredFinished;
            const record = recordedMap.get(stepName);

            return (
              <div key={stepName} className="relative flex items-start gap-4">
                {/* Connecting Line */}
                {index < MILESTONES.length - 1 && (
                  <div
                    className="absolute left-4 top-8 -bottom-4 w-0.5"
                    style={{
                      backgroundColor: (index < currentIndex || isDeliveredFinished) ? 'var(--color-primary)' : 'var(--color-border)'
                    }}
                  />
                )}

                {/* Step Circle Indicator */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isPulsingCurrent
                      ? 'ring-4'
                      : isFinishedStep
                      ? 'text-white'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                  style={{
                    backgroundColor: isPulsingCurrent
                      ? 'var(--color-primary-light)'
                      : isFinishedStep
                      ? 'var(--color-primary)'
                      : '#FFFFFF',
                    borderColor: isPulsingCurrent || isFinishedStep
                      ? 'var(--color-primary)'
                      : 'var(--color-border)',
                    boxShadow: isPulsingCurrent ? '0 0 0 4px var(--color-primary-light)' : 'none'
                  }}
                >
                  {isFinishedStep ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : isPulsingCurrent ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4
                        className="text-sm font-semibold tracking-tight"
                        style={{
                          color: isPulsingCurrent
                            ? 'var(--color-primary)'
                            : isFinishedStep
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-muted)'
                        }}
                      >
                        {stepName}
                      </h4>
                      {stepName === 'Delivered' && isDeliveredFinished && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Delivered
                        </span>
                      )}
                    </div>
                    {record?.completedAt && (
                      <span className="text-xs text-brand-text-muted font-medium">
                        {formatDateTime(record.completedAt)}
                      </span>
                    )}
                  </div>

                  {record?.note && (
                    <p className="mt-1.5 text-xs text-brand-text-secondary bg-brand-bg-secondary border border-brand-border rounded-lg p-2.5">
                      <span className="font-semibold text-brand-text-primary">Note:</span> {record.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stepper;
