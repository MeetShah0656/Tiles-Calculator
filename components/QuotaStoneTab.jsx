'use client';

import ActiveJobCalculator from '@/components/ActiveJobCalculator.jsx';

export default function QuotaStoneTab() {
  const kotaPresetSizes = [
    { name: '22" x 22" (Flooring)', l: 22, w: 22 },
    { name: '22" x 16" (Border)', l: 22, w: 16 },
    { name: '22" x 11" (Stairs/Skirting)', l: 22, w: 11 },
    { name: '16" x 16" (Medium)', l: 16, w: 16 },
    { name: '11" x 11" (Small)', l: 11, w: 11 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <ActiveJobCalculator
        jobType="quotaActiveJob"
        roundingStep={0.5}
        categoryTitle="Kota Stone"
        presetSizes={kotaPresetSizes}
      />
    </div>
  );
}
