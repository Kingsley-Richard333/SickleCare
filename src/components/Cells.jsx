import { useT } from "../i18n/index.jsx";

const discs = [[90,150,1,0],[210,95,.8,-2],[330,175,1.1,-4],[430,110,.7,-1],[150,300,.85,-3],[290,320,1,-5],[420,270,.9,-2.5]];
const sickles = [[250,205,1.1,-1.5,-20],[60,260,.8,-3.5,25],[470,200,.9,-4.5,200]];

export default function Cells() {
  const { t } = useT();
  return (
    <svg className="cells" viewBox="0 0 540 420" role="img" aria-label={t("cells.alt")}>
      <defs>
        <radialGradient id="rbc" cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="var(--cell-hi)" />
          <stop offset="1" stopColor="var(--cell)" />
        </radialGradient>
      </defs>
      <path d="M0 70 C140 20 260 110 540 50 L540 0 L0 0Z" fill="var(--vessel)" />
      <path d="M0 360 C150 410 300 320 540 380 L540 420 L0 420Z" fill="var(--vessel)" />
      {discs.map(([x, y, s, d], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <g className="drift" style={{ animationDelay: `${d}s` }}>
            <circle r="36" fill="url(#rbc)" />
            <ellipse rx="15" ry="10" fill="var(--cell)" opacity=".45" />
          </g>
        </g>
      ))}
      {sickles.map(([x, y, s, d, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <g className="drift" style={{ animationDelay: `${d}s` }}>
            <path d="M-6 -48 C40 -36 40 36 -6 48 C14 20 14 -20 -6 -48Z" fill="var(--sickle)" />
          </g>
        </g>
      ))}
    </svg>
  );
}
