'use client';

import ActiveJobCalculator from '@/components/ActiveJobCalculator.jsx';

export default function QuotaStoneTab() {
  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <ActiveJobCalculator
        jobType="quotaActiveJob"
        roundingStep={0.5}
        categoryTitle="Kota Stone"
      />
    </div>
  );
}
