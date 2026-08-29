'use client';

import ActiveJobCalculator from '@/components/ActiveJobCalculator.jsx';

export default function GraniteMarbleTab() {
  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <ActiveJobCalculator 
        jobType="activeJob"
        roundingStep={0.25}
        categoryTitle="Granite & Marble"
      />
    </div>
  );
}
