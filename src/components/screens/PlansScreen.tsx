import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { ReadingPlan } from '../../types';
import {
  Calendar,
  CheckCircle2,
  Circle,
  ChevronRight,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const PlansScreen: React.FC = () => {
  const {
    plans,
    togglePlanEnrollment,
    togglePlanDayCompletion,
    openReader,
    selectedBibleId,
    readerSettings,
  } = useBible();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100/80 text-stone-900 shadow-sm';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#705b41]' : 'text-stone-500';

  const activePlanDetail = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="space-y-6 pb-20">
      {/* Detail Plan View if selected */}
      {activePlanDetail ? (
        <div className="space-y-4 animate-fadeIn">
          <button
            onClick={() => setSelectedPlanId(null)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline py-1"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Back to Reading Plans</span>
          </button>

          <div className={`p-6 rounded-3xl border ${cardBg} space-y-4`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {activePlanDetail.category} • {activePlanDetail.durationDays} Days
                </span>
                <h1 className="font-serif text-2xl font-bold mt-1">
                  {activePlanDetail.title}
                </h1>
                <p className={`text-xs mt-1.5 leading-relaxed ${subText}`}>
                  {activePlanDetail.description}
                </p>
              </div>

              <button
                onClick={() => togglePlanEnrollment(activePlanDetail.id)}
                className={`px-4 py-2 rounded-2xl font-semibold text-xs transition ${
                  activePlanDetail.isEnrolled
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                }`}
              >
                {activePlanDetail.isEnrolled ? 'Enrolled ✓' : 'Start Plan'}
              </button>
            </div>

            {/* Daily Reading Schedule Checklist */}
            <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Daily Readings Checklist:
              </h2>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {activePlanDetail.days.map(day => (
                  <div
                    key={day.day}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      day.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                        : cardBg
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => togglePlanDayCompletion(activePlanDetail.id, day.day)}
                        className="text-amber-600 dark:text-amber-400 hover:scale-110 transition"
                      >
                        {day.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-600/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-stone-400" />
                        )}
                      </button>

                      <div>
                        <div
                          className={`font-semibold text-sm ${
                            day.completed ? 'line-through text-stone-400' : ''
                          }`}
                        >
                          {day.title}
                        </div>
                        <div className={`text-xs ${subText}`}>Day {day.day}</div>
                      </div>
                    </div>

                    {/* Quick Read Button for day references */}
                    {day.references && day.references.length > 0 && (
                      <button
                        onClick={() => {
                          const ref = day.references[0];
                          const parts = ref.split('.');
                          openReader(selectedBibleId, parts[0], ref, `${parts[0]} ${parts[1]}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold text-xs flex items-center space-x-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className={`p-5 rounded-3xl border ${cardBg} space-y-2`}>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Bible Reading Plans
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              Guided Scripture Journeys
            </h1>
            <p className={`text-xs ${subText}`}>
              Build a daily habit of reading God's Word with structured topical and canonical reading plans.
            </p>
          </div>

          {/* Catalog of Plans */}
          <div className="space-y-3">
            {plans.map(plan => {
              const completedDays = plan.days.filter(d => d.completed).length;
              const percent = Math.round((completedDays / plan.durationDays) * 100);

              return (
                <div
                  key={plan.id}
                  id={`plan-card-${plan.id}`}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-5 rounded-3xl border ${cardBg} cursor-pointer hover:border-amber-500 transition space-y-3 transform active:scale-98`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          {plan.category}
                        </span>
                        <span className={`text-xs ${subText}`}>{plan.durationDays} Days</span>
                      </div>
                      <h2 className="font-serif text-lg font-bold mt-1">{plan.title}</h2>
                      <p className={`text-xs mt-0.5 line-clamp-2 ${subText}`}>{plan.description}</p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-stone-400 mt-1 shrink-0" />
                  </div>

                  {/* Enrollment & Progress Bar */}
                  {plan.isEnrolled ? (
                    <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-amber-800 dark:text-amber-300 flex items-center space-x-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Active Plan • Day {plan.currentDay}</span>
                        </span>
                        <span className="text-amber-700 dark:text-amber-400">{percent}% Complete</span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(5, percent)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 flex justify-end">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                        View Reading Schedule →
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
