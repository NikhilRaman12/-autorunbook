import React from 'react';

interface StatusBadgeProps {
  severity: "P1" | "P2" | "P3";
}

export function StatusBadge({ severity }: StatusBadgeProps) {
  const colors = {
    P1: "bg-red-500/10 text-red-500 border-red-500/20",
    P2: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    P3: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${colors[severity]}`}>
      {severity}
    </span>
  );
}
