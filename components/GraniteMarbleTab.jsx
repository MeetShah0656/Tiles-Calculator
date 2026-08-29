'use client';

import ActiveJobCalculator from '@/components/ActiveJobCalculator.jsx';

export default function GraniteMarbleTab() {
  const granitePresetSizes = [
    { name: '10ft x 3ft (Full Slab)', l: 120, w: 36 },
    { name: '8ft x 2.5ft (Kitchen)', l: 96, w: 30 },
    { name: '7ft x 2ft (Countertop)', l: 84, w: 24 },
    { name: '3ft x 2ft (Door Sill)', l: 36, w: 24 },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <ActiveJobCalculator 
        jobType="activeJob"
        roundingStep={0.25}
        categoryTitle="Granite & Marble"
        presetSizes={granitePresetSizes}
      />
    </div>
  );
}
