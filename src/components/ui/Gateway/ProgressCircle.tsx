export default function ProgressCircle({
  stepsCompleted,
  totalSteps,
  radius = 50,
  stroke = 10,
  progressColor = '#10b981',
  strokeColor = '#e5e7eb'
}: {
  stepsCompleted: number
  totalSteps: number
  radius?: number
  stroke?: number
  progressColor?: string
  backgroundColor?: string
  strokeColor?: string
}) {
  const percentage = (stepsCompleted / totalSteps) * 100
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={progressColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
      </svg>
      <div className="absolute font-semibold">
        {stepsCompleted}/{totalSteps}
      </div>
    </div>
  )
}
