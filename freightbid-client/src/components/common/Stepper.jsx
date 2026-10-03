import React from 'react';
import { Check, Circle } from 'lucide-react';
import { MILESTONES, formatDateTime } from '../../utils/formatters';

export const Stepper = ({
  milestones = [],
  currentMilestone = 'Awarded',
  onAdvance = null,
  isAdvanceable = false,
  advanceLoading = false
}) => {
  const currentIndex = MILESTONES.indexOf(currentMilestone);
  const nextMilestone = currentIndex < MILESTONES.length - 1 ? MILESTONES[currentIndex + 1] : null;

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
            const record = recordedMap.get(stepName);

            return (
              <div key={stepName} className="relative flex items-start gap-4">
                {/* Connecting Line */}
                {index < MILESTONES.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 -bottom-4 w-0.5 ${
                      index < currentIndex ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Circle Indicator */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50'
                      : isCompleted
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4
                      className={`text-sm font-semibold ${
                        isCurrent
                          ? 'text-indigo-900 font-bold'
                          : isCompleted
                          ? 'text-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {stepName}
                    </h4>
                    {record?.completedAt && (
                      <span className="text-xs text-slate-400">
                        {formatDateTime(record.completedAt)}
                      </span>
                    )}
                  </div>

                  {record?.note && (
                    <p className="mt-1 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded p-2">
                      <span className="font-medium text-slate-500">Note:</span> {record.note}
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
