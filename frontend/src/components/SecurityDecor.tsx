export type CredentialStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "SUSPENDED";

export function Guilloche({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M-20 ${10 + i * 8} C 60 ${-14 + i * 8}, 140 ${34 + i * 8}, 220 ${
            10 + i * 8
          } S 380 ${-14 + i * 8}, 440 ${10 + i * 8}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

export function Seal({
  status,
  label,
  className = "",
}: {
  status: CredentialStatus;
  label: string;
  className?: string;
}) {
  const color =
    status === "ACTIVE"
      ? "#059669"
      : status === "EXPIRED"
        ? "#d97706"
        : status === "REVOKED"
          ? "#dc2626"
          : "#6b7280";
  const arc = `MLEGITYMACJA24 · ${label.toUpperCase()} · `;
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden
    >
      <defs>
        <path
          id="sealArcTop"
          d="M48,48 m-34,0 a34,34 0 1,1 68,0 a34,34 0 1,1 -68,0"
        />
      </defs>
      <circle cx="48" cy="48" r="44" fill="none" stroke={color} strokeWidth="1.6" />
      <circle
        cx="48"
        cy="48"
        r="26"
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <text
        fill={color}
        fontSize="9"
        fontWeight="700"
        letterSpacing="1.6"
        fontFamily="inherit"
      >
        <textPath href="#sealArcTop" startOffset="0">
          {arc + arc}
        </textPath>
      </text>
      {status === "ACTIVE" ? (
        <path
          d="M36 49 l8 8 l16 -17"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M38 38 l20 20 M58 38 l-20 20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
