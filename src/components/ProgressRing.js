export default function ProgressRing({ current, goal }) {
  const size = 260;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((current / goal) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;
  const isFull = percentage >= 100;

  return (
    <div className="relative flex items-center justify-center" data-testid="progress-ring">
      <svg width={size} height={size} className={`-rotate-90 ${isFull ? 'progress-ring-glow' : ''}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isFull ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
          style={{
            '--ring-circumference': circumference,
            '--ring-offset': offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {current}
        </span>
        <span className="text-sm text-muted-foreground">/ {goal} ml</span>
        <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
