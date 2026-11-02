import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 22, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGift = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="8" width="17" height="4" rx="1" />
    <path d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7M12 8v12.5" />
    <path d="M12 8S10.8 3.5 8 3.5a2.25 2.25 0 0 0 0 4.5h4ZM12 8s1.2-4.5 4-4.5a2.25 2.25 0 0 1 0 4.5h-4Z" />
  </Svg>
);

export const IconPeople = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
    <path d="M15.5 4.9a3.25 3.25 0 0 1 0 6.2M17.5 14.7c1.9.6 3.2 2.3 3.5 4.8" />
  </Svg>
);

export const IconHeart = (p: P) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.6 12 20 12 20Z" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconPerson = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconShare = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5v11M8 7l4-3.5L16 7" />
    <path d="M8.5 10.5H7A1.5 1.5 0 0 0 5.5 12v7A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
  </Svg>
);

export const IconChevron = (p: P) => (
  <Svg size={16} strokeWidth={2.2} {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);

export const IconLink = (p: P) => (
  <Svg {...p}>
    <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
  </Svg>
);

export const IconPhoto = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M20.5 15.5l-4.5-4.5-8 8" />
  </Svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.5l5.1-1.9L12 3.5Z" />
    <path d="M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
  </Svg>
);

export const IconCake = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 20.5v-7A1.5 1.5 0 0 1 6 12h12a1.5 1.5 0 0 1 1.5 1.5v7M3 20.5h18" />
    <path d="M4.5 15.5c1.25 1 2.5 1 3.75 0s2.5-1 3.75 0 2.5 1 3.75 0 2.5-1 3.75 0M12 12V8.5M12 6.5c-.8 0-1.3-.6-1.3-1.3 0-.9 1.3-2.2 1.3-2.2s1.3 1.3 1.3 2.2c0 .7-.5 1.3-1.3 1.3Z" />
  </Svg>
);

export const IconTree = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l5 6.5h-2.5L18.5 15h-13l4-5.5H7L12 3ZM12 15v5.5" />
  </Svg>
);

export const IconKey = (p: P) => (
  <Svg {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2L19 4M16 7l2.5 2.5M14 9l2 2" />
  </Svg>
);
