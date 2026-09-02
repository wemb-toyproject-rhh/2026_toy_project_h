const ICONS = {
  page: (
    <>
      <path
        d="M4.5 1.5h4.379a1 1 0 0 1 .707.293l2.121 2.121a1 1 0 0 1 .293.707V13a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M9 1.6V4a1 1 0 0 0 1 1h2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </>
  ),
  component2d: (
    <>
      <rect
        x="2.5"
        y="2.5"
        width="8"
        height="8"
        rx="1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="5.5"
        y="5.5"
        width="8"
        height="8"
        rx="1.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </>
  ),
  component3d: (
    <>
      <path
        d="M8 1.5 13.5 4.6V10.4L8 13.5 2.5 10.4V4.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M8 7.4V13.5M8 7.4 2.5 4.6M8 7.4 13.5 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  ),
  all: (
    <>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" fill="currentColor" />
    </>
  ),
  search: (
    <>
      <circle
        cx="7"
        cy="7"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M10.3 10.3 13.5 13.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  chevron: (
    <path
      d="M5 3.5 9.5 8 5 12.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  pencil: (
    <>
      <path
        d="M11.3 2.3a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-7.6 7.6-3 .9.9-3 7.3-7.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.7 3.9 12.1 6.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  ),
  check: (
    <path
      d="M3 8.3 6.2 11.5 13 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  close: (
    <path
      d="M4 4l8 8M12 4l-8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  ),
  trash: (
    <>
      <path d="M3 4.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M4.2 4.5 5 13.2a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.8-8.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6.7 7v5M9.3 7v5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </>
  ),
};

export default function Icon({ name, size = 14, className = "", direction }) {
  if (name === "sortArrows") {
    const upColor = direction === "asc" ? "var(--color-accent)" : "currentColor";
    const downColor = direction === "desc" ? "var(--color-accent)" : "currentColor";

    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 12V4" stroke={upColor} strokeWidth="1.3" strokeLinecap="round" />
        <path
          d="M3 6.5 5 4l2 2.5"
          fill="none"
          stroke={upColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M11 4v8" stroke={downColor} strokeWidth="1.3" strokeLinecap="round" />
        <path
          d="M9 9.5 11 12l2-2.5"
          fill="none"
          stroke={downColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  const content = ICONS[name];
  if (!content) return null;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}
