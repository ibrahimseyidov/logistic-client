import { type ReactNode } from "react";
import { fmtAzn, fmtCompact } from "../lib/dashboardFormat";
import type { BarSeries, ChartSlice, HBarItem } from "../lib/dashboardCharts";
import styles from "../dashboard.module.css";

function ChartEmpty({ text = "Qrafik üçün məlumat yoxdur" }: { text?: string }) {
  return <div className={styles.chartEmpty}>{text}</div>;
}

export function ChartCard({
  title,
  hint,
  children,
  wide,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`${styles.chartCard} ${wide ? styles.chartCardWide : ""}`}>
      <div className={styles.chartHead}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {hint ? <span className={styles.chartHint}>{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: ChartSlice[];
  centerLabel: string;
  centerValue: string;
}) {
  const visible = slices.filter((s) => s.value > 0);
  const total = visible.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return <ChartEmpty />;

  const size = 176;
  const cx = size / 2;
  const cy = size / 2;
  const r = 58;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className={styles.donutWrap}>
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.donutSvg} aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        {visible.map((slice) => {
          const len = (slice.value / total) * circ;
          const node = (
            <circle
              key={slice.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            >
              <title>{`${slice.label}: ${slice.value}`}</title>
            </circle>
          );
          offset += len;
          return node;
        })}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#0f172a"
          fontSize="18"
          fontWeight="800"
        >
          {centerValue}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill="#64748b"
          fontSize="10"
          fontWeight="700"
        >
          {centerLabel}
        </text>
      </svg>
      <ul className={styles.legend}>
        {slices.map((s) => (
          <li key={s.label}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            <span className={styles.legendName}>{s.label}</span>
            <span className={styles.legendVal}>{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GroupedBarChart({
  labels,
  series,
}: {
  labels: string[];
  series: BarSeries[];
}) {
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values),
  );
  if (!labels.length || series.every((s) => s.values.every((v) => v === 0))) {
    return <ChartEmpty />;
  }

  const padL = 44;
  const padR = 8;
  const padT = 12;
  const padB = 36;
  const w = 640;
  const h = 248;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const groupW = innerW / labels.length;
  const barGap = 3;
  const barW = Math.max(
    4,
    (groupW - 14 - barGap * (series.length - 1)) / series.length,
  );
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className={styles.barSvg} role="img">
        {ticks.map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={w - padR}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
              >
                {fmtCompact(max * t)}
              </text>
            </g>
          );
        })}
        {labels.map((label, i) => {
          const gx = padL + i * groupW + 7;
          return (
            <g key={label}>
              {series.map((s, si) => {
                const val = s.values[i] || 0;
                const bh = (val / max) * innerH;
                const x = gx + si * (barW + barGap);
                const y = padT + innerH - bh;
                return (
                  <rect
                    key={s.name}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(bh, val > 0 ? 2 : 0)}
                    rx="3"
                    fill={s.color}
                  >
                    <title>{`${label} · ${s.name}: ${fmtAzn(val)}`}</title>
                  </rect>
                );
              })}
              <text
                x={gx + (series.length * (barW + barGap) - barGap) / 2}
                y={h - 14}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className={styles.legendInline}>
        {series.map((s) => (
          <li key={s.name}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBarChart({
  items,
  formatValue = fmtAzn,
}: {
  items: HBarItem[];
  formatValue?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <ChartEmpty />;

  return (
    <div className={styles.hbarList}>
      {items.map((item) => (
        <div key={item.label} className={styles.hbarRow} title={`${item.label}: ${formatValue(item.value)}`}>
          <span className={styles.hbarLabel}>{item.label}</span>
          <div className={styles.hbarTrack}>
            <div
              className={styles.hbarFill}
              style={{
                width: `${Math.max(4, (item.value / max) * 100)}%`,
                background: item.color || "#2563eb",
              }}
            />
          </div>
          <span className={styles.hbarVal}>{formatValue(item.value)}</span>
        </div>
      ))}
    </div>
  );
}
