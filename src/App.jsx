import { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const N = 20;

const emptyRow = () => ({ estimated: "", measured: "" });

export default function BlandAltmanGFR() {
  const [rows, setRows] = useState(Array.from({ length: N }, emptyRow));

  const updateCell = (idx, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const loadExample = () => {
    const example = [
      [88, 92], [45, 41], [102, 98], [67, 73], [55, 52],
      [78, 80], [34, 30], [91, 95], [60, 58], [110, 104],
      [72, 76], [48, 44], [85, 89], [63, 60], [97, 101],
      [40, 37], [75, 71], [58, 62], [105, 99], [52, 55],
    ];
    setRows(example.map(([estimated, measured]) => ({ estimated, measured })));
  };

  const clearAll = () => setRows((prev) => prev.map(() => emptyRow()));

  const stats = useMemo(() => {
    const pairs = rows
      .map((r) => ({ est: parseFloat(r.estimated), meas: parseFloat(r.measured) }))
      .filter((r) => !Number.isNaN(r.est) && !Number.isNaN(r.meas));

    if (pairs.length < 2) return null;

    const points = pairs.map((r) => ({
      mean: (r.est + r.meas) / 2,
      diff: r.est - r.meas,
    }));

    const n = points.length;
    const biasSum = points.reduce((s, p) => s + p.diff, 0);
    const bias = biasSum / n;
    const variance =
      points.reduce((s, p) => s + (p.diff - bias) ** 2, 0) / (n - 1);
    const sd = Math.sqrt(variance);
    const loaUpper = bias + 1.96 * sd;
    const loaLower = bias - 1.96 * sd;

    return { points, n, bias, sd, loaUpper, loaLower };
  }, [rows]);

  return (
    <div
      style={{
        fontFamily:
          "'IBM Plex Mono', 'SF Mono', ui-monospace, monospace",
        background: "#faf9f6",
        minHeight: "100%",
        padding: "32px 24px",
        color: "#1f2421",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ marginBottom: 28, borderBottom: "2px solid #1f2421", paddingBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#6b7a70", marginBottom: 6 }}>
            AGREEMENT ANALYSIS
          </div>
          <h1 style={{ fontSize: 26, margin: 0, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Bland-Altman: Estimated vs. Measured GFR
          </h1>
          <div style={{ fontSize: 13, color: "#6b7a70", marginTop: 6 }}>
            Enter paired values (mL/min/1.73m²). Add or remove rows as needed. Bias and 95% limits of agreement update live.
          </div>
        </header>

        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {/* Data entry table */}
          <div style={{ flex: "1 1 320px", minWidth: 300 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, letterSpacing: "0.08em", color: "#6b7a70" }}>
                DATA ({stats ? stats.n : 0}/{rows.length} valid pairs)
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addRow} style={btnStyle}>
                  + Add row
                </button>
                <button onClick={loadExample} style={btnStyle}>
                  Load example
                </button>
                <button onClick={clearAll} style={btnStyle}>
                  Clear
                </button>
              </div>
            </div>

            <div
              style={{
                border: "1px solid #d8d4c8",
                borderRadius: 6,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 36px", background: "#eeeae0", fontSize: 11, letterSpacing: "0.06em", color: "#6b7a70" }}>
                <div style={cellHeadStyle}>#</div>
                <div style={cellHeadStyle}>Estimated</div>
                <div style={cellHeadStyle}>Measured</div>
                <div style={cellHeadStyle}></div>
              </div>
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "36px 1fr 1fr 36px",
                      borderTop: "1px solid #eee9dc",
                    }}
                  >
                    <div style={{ ...cellStyle, color: "#9aa39b", fontSize: 12 }}>{idx + 1}</div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.estimated}
                      onChange={(e) => updateCell(idx, "estimated", e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={row.measured}
                      onChange={(e) => updateCell(idx, "measured", e.target.value)}
                      style={inputStyle}
                    />
                    <button
                      onClick={() => removeRow(idx)}
                      title="Remove row"
                      style={deleteBtnStyle}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plot + stats */}
          <div style={{ flex: "1 1 420px", minWidth: 340 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "#6b7a70", marginBottom: 10 }}>
              PLOT
            </div>
            <div
              style={{
                border: "1px solid #d8d4c8",
                borderRadius: 6,
                background: "#fff",
                padding: "12px 8px 8px 8px",
                height: 340,
              }}
            >
              {stats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="#eee9dc" />
                    <XAxis
                      type="number"
                      dataKey="mean"
                      name="Mean"
                      label={{ value: "Mean of estimated & measured", position: "insideBottom", offset: -5, fontSize: 11, fill: "#6b7a70" }}
                      tick={{ fontSize: 11, fill: "#6b7a70" }}
                      stroke="#d8d4c8"
                    />
                    <YAxis
                      type="number"
                      dataKey="diff"
                      name="Difference"
                      label={{ value: "Estimated − Measured", angle: -90, position: "insideLeft", fontSize: 11, fill: "#6b7a70" }}
                      tick={{ fontSize: 11, fill: "#6b7a70" }}
                      stroke="#d8d4c8"
                    />
                    <ZAxis range={[60, 60]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(value) => value.toFixed(1)}
                      contentStyle={{ fontFamily: "monospace", fontSize: 12 }}
                    />
                    <ReferenceLine
                      y={stats.bias}
                      stroke="#b5502f"
                      strokeWidth={1.5}
                      label={{ value: `bias ${stats.bias.toFixed(1)}`, fontSize: 11, fill: "#b5502f", position: "right" }}
                    />
                    <ReferenceLine
                      y={stats.loaUpper}
                      stroke="#8a8474"
                      strokeDasharray="4 4"
                      label={{ value: `+1.96 SD`, fontSize: 10, fill: "#8a8474", position: "right" }}
                    />
                    <ReferenceLine
                      y={stats.loaLower}
                      stroke="#8a8474"
                      strokeDasharray="4 4"
                      label={{ value: `−1.96 SD`, fontSize: 10, fill: "#8a8474", position: "right" }}
                    />
                    <ReferenceLine y={0} stroke="#d8d4c8" />
                    <Scatter data={stats.points} fill="#3d5a4f" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#9aa39b", fontSize: 13 }}>
                  Enter at least 2 paired values to see the plot
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "#6b7a70", margin: "18px 0 10px" }}>
              SUMMARY
            </div>
            <div
              style={{
                border: "1px solid #d8d4c8",
                borderRadius: 6,
                background: "#fff",
                padding: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                fontSize: 14,
              }}
            >
              <StatBox label="N pairs" value={stats ? stats.n : "—"} />
              <StatBox label="Bias (mean diff)" value={stats ? stats.bias.toFixed(2) : "—"} />
              <StatBox label="SD of differences" value={stats ? stats.sd.toFixed(2) : "—"} />
              <StatBox label="95% LoA" value={stats ? `${stats.loaLower.toFixed(1)} to ${stats.loaUpper.toFixed(1)}` : "—"} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: "#9aa39b", lineHeight: 1.5 }}>
          Bias is the mean of (estimated − measured). Limits of agreement (LoA) = bias ± 1.96 × SD of the differences,
          the range within which about 95% of differences are expected to fall for these data.
        </div>
      </div>
    </div>
  );
}

const cellHeadStyle = {
  padding: "8px 10px",
  fontWeight: 600,
};

const cellStyle = {
  display: "flex",
  alignItems: "center",
  padding: "6px 10px",
};

const inputStyle = {
  border: "none",
  borderLeft: "1px solid #eee9dc",
  padding: "8px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  background: "transparent",
  outline: "none",
  color: "#1f2421",
  width: "100%",
  boxSizing: "border-box",
};

const deleteBtnStyle = {
  border: "none",
  borderLeft: "1px solid #eee9dc",
  background: "transparent",
  color: "#b5502f",
  fontSize: 16,
  cursor: "pointer",
  lineHeight: 1,
};

const btnStyle = {
  fontFamily: "inherit",
  fontSize: 11,
  letterSpacing: "0.04em",
  padding: "6px 12px",
  border: "1px solid #1f2421",
  borderRadius: 4,
  background: "#fff",
  color: "#1f2421",
  cursor: "pointer",
};

function StatBox({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: "0.06em", color: "#9aa39b", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: "#1f2421" }}>{value}</div>
    </div>
  );
}
