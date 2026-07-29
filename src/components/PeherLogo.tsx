type PeherLogoProps = {
  variant?: "wordmark" | "mark";
  className?: string;
  tone?: "dark" | "light";
};

export function PeherLogo({
  variant = "wordmark",
  className = "",
  tone = "dark",
}: PeherLogoProps) {
  const color = tone === "light" ? "#ffffff" : "#111111";
  if (variant === "mark") {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label="Peher" className={className}>
        <rect x="5" y="5" width="54" height="54" rx="27" fill="none" stroke={color} strokeWidth="1.5" />
        <path
          d="M23 47V17h10.4c8 0 12.8 3.7 12.8 10.2 0 6.7-4.9 10.7-13.2 10.7h-3.4V47H23Zm6.6-14.5h3.2c4.5 0 6.8-1.7 6.8-5.1 0-3.2-2.2-4.8-6.5-4.8h-3.5v9.9Z"
          fill={color}
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 340 86" role="img" aria-label="Peher" className={className}>
      <text
        x="170"
        y="61"
        textAnchor="middle"
        fill={color}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="52"
        letterSpacing="15"
      >
        PEHER
      </text>
    </svg>
  );
}
