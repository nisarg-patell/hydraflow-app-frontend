import React from 'react';
import { Card, CardContent } from './ui/card';

export default function HydraPlant({ paceStatus }) {
  // paceStatus: 'behind', 'on-track', 'ahead'
  
  let emoji = '🪴';
  let message = "Looking good!";
  let bgColor = "bg-green-500/10";
  let textColor = "text-green-600";

  if (paceStatus === 'behind') {
    emoji = '🥀';
    message = "I'm thirsty...";
    bgColor = "bg-orange-500/10";
    textColor = "text-orange-600";
  } else if (paceStatus === 'ahead') {
    emoji = '🌸';
    message = "Blooming!";
    bgColor = "bg-pink-500/10";
    textColor = "text-pink-600";
  }

  return (
    <Card className="rounded-3xl shadow-sm overflow-hidden relative" data-testid="hydra-plant-card">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>Hydra-Plant</h3>
          <p className={`text-xs font-medium ${textColor}`}>{message}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center text-2xl transition-all duration-500 hover:scale-110`}>
          {emoji}
        </div>
      </CardContent>
    </Card>
  );
}
