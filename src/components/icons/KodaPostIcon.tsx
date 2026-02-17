import { forwardRef } from "react";

interface KodaPostIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * KodaPost brand icon: a rounded square with two diagonal lines.
 * Matches the brand identity provided by the design team.
 * Renders as a stroke-based SVG, inherits `currentColor` for fill adaptability.
 */
export const KodaPostIcon = forwardRef<SVGSVGElement, KodaPostIconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Rounded square border */}
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
      {/* Two parallel diagonal lines */}
      <line x1="8" y1="16" x2="16" y2="8" />
      <line x1="10.5" y1="18" x2="18" y2="10.5" />
    </svg>
  )
);

KodaPostIcon.displayName = "KodaPostIcon";
