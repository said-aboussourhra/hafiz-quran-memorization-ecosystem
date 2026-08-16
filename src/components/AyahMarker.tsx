function toArabicDigits(n: number): string {
  // Clear Western numerals (e.g. 123) for maximum readability.
  return String(n);
}

// A gold ornamental rosette used as the end-of-ayah marker, with the
// ayah number rendered in Eastern Arabic numerals at its center.
export function AyahMarker({ n, active = false }: { n: number; active?: boolean }) {
  const gold = active ? "#2563eb" : "#0a7468";
  const goldLight = active ? "#54bbe8" : "#3fd0b6";
  const points = 12;
  const outer = 48;
  const inner = 38;
  const cx = 50;
  const cy = 50;
  let petals = "";
  for (let i = 0; i < points; i++) {
    const a1 = (i / points) * Math.PI * 2;
    const a2 = ((i + 0.5) / points) * Math.PI * 2;
    const x1 = cx + outer * Math.cos(a1);
    const y1 = cy + outer * Math.sin(a1);
    const x2 = cx + inner * Math.cos(a2);
    const y2 = cy + inner * Math.sin(a2);
    petals += `${i === 0 ? "M" : "L"}${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} `;
  }
  petals += "Z";

  return (
    <span className="ayah-rosette" style={{ color: gold }}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <path d={petals} fill={goldLight} fillOpacity="0.28" stroke={gold} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r="30" fill="#fffdf6" stroke={gold} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="34" fill="none" stroke={gold} strokeWidth="1" strokeOpacity="0.5" />
      </svg>
      <span>{toArabicDigits(n)}</span>
    </span>
  );
}
