const PATTERN = [
  1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1,
  1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1,
  1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1,
  1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1,
  0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
  1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
  1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0,
  0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0,
  1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1,
  0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1,
  1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1,
];

export function FakeQrCode({ className = "", size = 160 }: { className?: string; size?: number }) {
  return (
    <div
      className={`grid gap-[1px] rounded-md bg-brand-900 p-2 ${className}`}
      style={{ width: size, height: size, gridTemplateColumns: "repeat(13, 1fr)" }}
    >
      {PATTERN.map((filled, index) => (
        <div key={index} className={filled ? "bg-brand-900" : "bg-white"} />
      ))}
    </div>
  );
}
