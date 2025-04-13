
import React from "react";

interface ShuttlecockProps {
  className?: string;
  size?: number;
}

export const Shuttlecock: React.FC<ShuttlecockProps> = ({ className, size = 24 }) => {
  return (
    <svg
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
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M9 13l-3 9" />
      <path d="M12 13v9" />
      <path d="M15 13l3 9" />
    </svg>
  );
};

export default Shuttlecock;
