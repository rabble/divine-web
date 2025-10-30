// ABOUTME: No AI icon component inspired by no-ai-icon.com
// ABOUTME: Simple SVG icon showing crossed-out "AI" to indicate human-made content

interface NoAIIconProps {
  className?: string;
  size?: number;
}

export function NoAIIcon({ className, size = 16 }: NoAIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="No AI - Made by Humans"
    >
      {/* Circle */}
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* AI text */}
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        AI
      </text>

      {/* Diagonal slash */}
      <line
        x1="5"
        y1="5"
        x2="19"
        y2="19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
