import { useState } from "react";

// Banda superior evoluciona por IPC con rezago t-2
// Techo actual confirmado: $1.595,93 a feb 2026
// IPC conocidos: nov 2.47%, dic 2.8%, ene 2.9%
// Desde feb se aplica dic (2.8%), desde mar se aplica ene (2.9%)
// Meses futuros: proyecciones REM

const bandaData = [
  { mes: "Ene 2026", ipcAplicado: 2.47, label: "IPC Nov", techoFin: 1564 },
  { mes: "Feb 2026", ipcAplicado: 2.8, label: "IPC Dic", techoFin: 1596 },
  { mes: "Mar 2026", ipcAplicado: 2.9, label: "IPC Ene", techoFin: 1642 },
  { mes: "Abr 2026", ipcAplicado: 2.3, label: "IPC Feb (est)", techoFin: 1680 },
  { mes: "May 2026", ipcAplicado: 2.0, label: "IPC Mar (est)", techoFin: 1714 },
  { mes: "Jun 2026", ipcAplicado: 1.9, label: "IPC Abr (est)", techoFin: 1746 },
  { mes: "Jul 2026", ipcAplicado: 1.7, label: "IPC May (est)", techoFin: 1776 },
  { mes: "Ago 2026", ipcAplicado: 1.6, label: "IPC Jun (est)", techoFin: 1804 },
];

const lecaps = [
  { ticker: "S16M6", venc: "16-Mar-2026", dias: 7, temCorte: 2.99, tir: 41.0, desc: "Ultra corta", mesVenc: 2 },
  { ticker: "S30A6", venc: "30-Abr-2026", dias: 52, temCorte: 2.85, tir: 40.3, desc: "Corto plazo", mesVenc: 3 },
  { ticker: "S29Y6", venc: "29-May-2026", dias: 81, temCorte: 2.80, tir: 40.0, desc: "Corto-medio", mesVenc: 4 },
  { ticker: "S31L6", venc: "31-Jul-2026", dias: 144, temCorte: 2.75, tir: 38.5, desc: "Medio plazo", mesVenc: 6 },
  { ticker: "S30O6", venc: "30-Oct-2026", dias: 235, temCorte: 2.55, tir: 36.4, desc: "Medio-largo", mesVenc: 9 },
  { ticker: "S30N6", venc: "30-Nov-2026", dias: 266, temCorte: 2.55, tir: 35.2, desc: "Largo plazo", mesVenc: 10 },
];

const formatARS = (n) => "$" + Math.round(n).toLocaleString("es-AR");
const formatUSD = (n) => "US$" + Math.round(n).toLocaleString("en-US");
const formatPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

function getBandaTecho(mesIndex) {
  if (mesIndex < bandaData.length) return bandaData[mesIndex].techoFin;
  const last = bandaData[bandaData.length - 1];
  const monthsExtra = mesIndex - bandaData.length + 1;
  return Math.round(last.techoFin * Math.pow(1.015, monthsExtra));
}

export default function CarryTradeV2() {
  const [usdInicial, setUsdInicial] = useState(25000);
  const [tcEntrada, setTcEntrada] = useState(1390);
  const [selectedLecap, setSelectedLecap] = useState(3);
  const [escenarioDolar, setEscenarioDolar] = useState("base");
  const [comision, setComision] = useState(0.15);

  const lecap = lecaps[selectedLecap];

  const escenarios = {
    optimista: { label: "🟢 Optimista", depAnual: 8, desc: "Dólar sigue cayendo, cosecha fuerte, BCRA compra" },
    base: { label: "🟡 Base", depAnual: 16, desc: "Depreciación gradual, REM: ~$1.668 a fin de año" },
    pesimista: { label: "🔴 Pesimista", depAnual: 30, desc: "Shock externo, salto discreto" },
  };

  const esc = escenarios[escenarioDolar];
  const pesosIniciales = usdInicial * tcEntrada;
  const comisionCompra = pesosIniciales * (comision / 100);
  const pesosNetos = pesosIniciales - comisionCompra;
  const tasaEfectiva = Math.pow(1 + lecap.temCorte / 100, lecap.dias / 30) - 1;
  const pesosAlVenc = pesosNetos * (1 + tasaEfectiva);
  const comisionVenta = pesosAlVenc * (comision / 100);
  const pesosFinales = pesosAlVenc - comisionVenta;
  const depDiaria = Math.pow(1 + esc.depAnual / 100, 1 / 365) - 1;
  const tcSalida = tcEntrada * Math.pow(1 + depDiaria, lecap.dias);
  const usdFinales = pesosFinales / tcSalida;
  const gananciaPct = ((usdFinales / usdInicial) - 1) * 100;
  const gananciaUSD = usdFinales - usdInicial;
  const gananciaAnualizada = (Math.pow(1 + gananciaPct / 100, 365 / lecap.dias) - 1) * 100;
  const tcBreakeven = pesosFinales / usdInicial;
  const depMaxima = ((tcBreakeven / tcEntrada) - 1) * 100;

  const bandaAlVenc = getBandaTecho(lecap.mesVenc);
  const margenBanda = ((bandaAlVenc - tcEntrada) / tcEntrada) * 100;
  const breakevenVsBanda = tcBreakeven - bandaAlVenc;

  const dolarActual = 1376;
  const bandaActual = 1596;
  const distBandaActual = ((bandaActual - dolarActual) / dolarActual * 100).toFixed(1);

  const s = { fontFamily: "'Segoe UI', system-ui, sans-serif" };

  return (
    <div style={{ ...s, maxWidth: 920, margin: "0 auto", padding: 20, background: "#0a0f1a", minHeight: "100vh", color: "#e2e8f0" }}>
      
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f8fafc", margin: 0 }}>
          📊 Carry Trade LECAPS — Simulador v2
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
          Con evolución dinámica de banda superior por IPC (t-2) · Datos al 21/02/2026
        </p>
      </div>

      {/* Evolución de la banda */}
      <div style={{ background: "#111827", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #1e293b" }}>
        <h3 style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 }}>
          📈 Evolución Banda Superior (techo) — Ajuste mensual por IPC con rezago t-2
        </h3>
        
        <div style={{ display: "flex", gap: 4, alignItems: "end", height: 140, marginBottom: 12 }}>
          {bandaData.map((b, i) => {
            const minVal = 1500;
            const maxVal = 1850;
            const h = ((b.techoFin - minVal) / (maxVal - minVal)) * 120 + 20;
            const isVencMonth = lecap.mesVenc === i;
            const isPast = i < 2;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: isVencMonth ? "#fbbf24" : "#64748b", fontWeight: isVencMonth ? 700 : 400, marginBottom: 4 }}>
                  ${b.techoFin}
                </div>
                <div style={{
                  width: "100%", height: h, borderRadius: "6px 6px 0 0",
                  background: isVencMonth 
                    ? "linear-gradient(180deg, #fbbf24, #92400e)" 
                    : isPast 
                      ? "linear-gradient(180deg, #374151, #1f2937)"
                      : "linear-gradient(180deg, #3b82f6, #1e3a5f)",
                  border: isVencMonth ? "2px solid #fbbf24" : "1px solid #374151",
                  position: "relative"
                }}>
                  {isVencMonth && (
                    <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#fbbf24", whiteSpace: "nowrap" }}>
                      ▼ Venc {lecap.ticker}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 9, color: "#64748b", marginTop: 4, textAlign: "center" }}>
                  {b.mes.split(" ")[0]}
                </div>
                <div style={{ fontSize: 8, color: "#475569", textAlign: "center" }}>
                  {b.label}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: "#ef4444", borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Dólar mayorista hoy: <b style={{ color: "#f8fafc" }}>${dolarActual}</b> ({distBandaActual}% debajo del techo)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: "#22c55e", borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Tu breakeven: <b style={{ color: "#22c55e" }}>{formatARS(tcBreakeven)}</b></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: "#fbbf24", borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Banda al vencimiento: <b style={{ color: "#fbbf24" }}>{formatARS(bandaAlVenc)}</b></span>
          </div>
        </div>
      </div>

      {/* Parámetros + LECAP selection */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#111827", borderRadius: 12, padding: 18, border: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 }}>Parámetros</h3>
          {[
            { label: "Capital (USD)", val: usdInicial, set: setUsdInicial, step: 1000 },
            { label: "TC entrada", val: tcEntrada, set: setTcEntrada, step: 5 },
            { label: "Comisión %", val: comision, set: setComision, step: 0.05 },
          ].map((p, i) => (
            <label key={i} style={{ display: "block", marginBottom: 10 }}>
              <span style={{ color: "#64748b", fontSize: 11 }}>{p.label}</span>
              <input type="number" step={p.step} value={p.val} onChange={e => p.set(+e.target.value)}
                style={{ display: "block", width: "100%", padding: "7px 10px", background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 6, color: "#f8fafc", fontSize: 15, marginTop: 3, boxSizing: "border-box" }} />
            </label>
          ))}
        </div>

        <div style={{ background: "#111827", borderRadius: 12, padding: 18, border: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>Selección de LECAP</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {lecaps.map((l, i) => {
              const bv = getBandaTecho(l.mesVenc);
              const te = Math.pow(1 + l.temCorte / 100, l.dias / 30) - 1;
              const pf = (usdInicial * tcEntrada * (1 - comision / 100)) * (1 + te) * (1 - comision / 100);
              const be = pf / usdInicial;
              return (
                <button key={i} onClick={() => setSelectedLecap(i)}
                  style={{
                    padding: "8px 10px", borderRadius: 8, border: "1px solid",
                    borderColor: selectedLecap === i ? "#3b82f6" : "#1e293b",
                    background: selectedLecap === i ? "#172554" : "#0a0f1a",
                    color: "#f8fafc", cursor: "pointer", textAlign: "left", fontSize: 12
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700 }}>{l.ticker}</span>
                    <span style={{ color: "#22c55e", fontWeight: 600 }}>{l.temCorte}%</span>
                  </div>
                  <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>
                    {l.dias}d · BE: {formatARS(be)} · Banda: {formatARS(bv)}
                  </div>
                  <div style={{ 
                    fontSize: 10, marginTop: 3, fontWeight: 600,
                    color: be < bv ? "#4ade80" : "#f87171"
                  }}>
                    {be < bv ? `✅ BE ${formatARS(bv - be)} debajo de banda` : `⚠️ BE ${formatARS(be - bv)} arriba de banda`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Escenarios */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {Object.entries(escenarios).map(([key, val]) => (
          <button key={key} onClick={() => setEscenarioDolar(key)}
            style={{
              padding: 12, borderRadius: 10, border: "2px solid",
              borderColor: escenarioDolar === key ? (key === "optimista" ? "#22c55e" : key === "base" ? "#eab308" : "#ef4444") : "#1e293b",
              background: escenarioDolar === key ? "#111827" : "#0a0f1a",
              color: "#f8fafc", cursor: "pointer", textAlign: "center"
            }}>
            <div style={{ fontSize: 15 }}>{val.label}</div>
            <div style={{ color: "#64748b", fontSize: 11 }}>Dep. anual: {val.depAnual}%</div>
          </button>
        ))}
      </div>

      {/* Resultado principal */}
      <div style={{
        background: gananciaUSD >= 0 ? "linear-gradient(135deg, #052e16, #14532d)" : "linear-gradient(135deg, #450a0a, #7f1d1d)",
        borderRadius: 14, padding: 24, marginBottom: 20,
        border: `2px solid ${gananciaUSD >= 0 ? "#22c55e" : "#ef4444"}33`
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: 20, textAlign: "center" }}>
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>RESULTADO EN USD</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: gananciaUSD >= 0 ? "#4ade80" : "#f87171" }}>
              {formatPct(gananciaPct)}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 14 }}>{formatUSD(gananciaUSD)}</div>
          </div>
          <div style={{ background: "#334155" }} />
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>TC BREAKEVEN</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fbbf24" }}>
              {formatARS(tcBreakeven)}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 14 }}>Margen: {formatPct(depMaxima)}</div>
          </div>
          <div style={{ background: "#334155" }} />
          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>BANDA AL VENC.</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: breakevenVsBanda < 0 ? "#4ade80" : "#f87171" }}>
              {formatARS(bandaAlVenc)}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 14 }}>
              {breakevenVsBanda < 0 
                ? `BE ${formatARS(Math.abs(breakevenVsBanda))} debajo ✅`
                : `BE ${formatARS(breakevenVsBanda)} arriba ⚠️`
              }
            </div>
          </div>
        </div>
      </div>

      {/* Flujo detallado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#111827", borderRadius: 12, padding: 18, border: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>Flujo de la Operación</h3>
          {[
            { label: "Vendés USD", val: formatUSD(usdInicial), sub: `@ ${formatARS(tcEntrada)}` },
            { label: "Obtenés pesos", val: formatARS(pesosIniciales), sub: `- com. ${formatARS(comisionCompra)}` },
            { label: "Invertís en LECAP", val: formatARS(pesosNetos), sub: `${lecap.ticker} · TEM ${lecap.temCorte}%` },
            { label: "Cobrás al vencimiento", val: formatARS(pesosAlVenc), sub: `Tasa ef. período: ${(tasaEfectiva * 100).toFixed(2)}%` },
            { label: "Neto comisiones", val: formatARS(pesosFinales), sub: `- com. ${formatARS(comisionVenta)}` },
            { label: "Recomprás USD", val: formatUSD(usdFinales), sub: `@ TC est. ${formatARS(tcSalida)}` },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 5 ? "1px solid #1e293b" : "none" }}>
              <div>
                <div style={{ color: "#cbd5e1", fontSize: 12 }}>{step.label}</div>
                <div style={{ color: "#475569", fontSize: 10 }}>{step.sub}</div>
              </div>
              <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 14 }}>{step.val}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111827", borderRadius: 12, padding: 18, border: "1px solid #1e293b" }}>
          <h3 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>Análisis de Protección</h3>
          
          <div style={{ background: "#0a0f1a", borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ color: "#64748b", fontSize: 10 }}>COLCHÓN HASTA BREAKEVEN</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ color: "#fbbf24", fontSize: 26, fontWeight: 700 }}>{formatARS(tcBreakeven - tcEntrada)}</span>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>({depMaxima.toFixed(1)}% de suba del dólar)</span>
            </div>
            <div style={{ marginTop: 8, background: "#1e293b", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #22c55e, #fbbf24)", width: `${Math.min(depMaxima / 25 * 100, 100)}%` }} />
            </div>
          </div>

          <div style={{ background: "#0a0f1a", borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ color: "#64748b", fontSize: 10 }}>BANDA SUPERIOR AL VENCIMIENTO ({lecap.venc})</div>
            <div style={{ color: breakevenVsBanda < 0 ? "#4ade80" : "#f87171", fontSize: 22, fontWeight: 700 }}>
              {formatARS(bandaAlVenc)}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              {breakevenVsBanda < 0 
                ? `Tu BE queda ${formatARS(Math.abs(breakevenVsBanda))} DEBAJO del techo → si el dólar toca la banda, perdés`
                : `Tu BE queda ${formatARS(breakevenVsBanda)} ARRIBA del techo → si el dólar toca la banda, aún ganás`
              }
            </div>
          </div>

          <div style={{ background: "#0a0f1a", borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ color: "#64748b", fontSize: 10 }}>DISTANCIA ACTUAL DEL DÓLAR AL TECHO</div>
            <div style={{ color: "#60a5fa", fontSize: 22, fontWeight: 700 }}>
              {formatARS(bandaActual - dolarActual)} ({distBandaActual}%)
            </div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              Mayorista ${dolarActual} → Techo actual ${bandaActual}
            </div>
          </div>

          <div style={{ background: "#0a0f1a", borderRadius: 8, padding: 14 }}>
            <div style={{ color: "#64748b", fontSize: 10 }}>RENDIMIENTO ANUALIZADO EN USD</div>
            <div style={{ color: gananciaAnualizada >= 0 ? "#4ade80" : "#f87171", fontSize: 22, fontWeight: 700 }}>
              {formatPct(gananciaAnualizada)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla comparativa */}
      <div style={{ background: "#111827", borderRadius: 12, padding: 18, marginBottom: 20, border: "1px solid #1e293b" }}>
        <h3 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>
          Comparativa completa — Escenario {esc.label}
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #1e293b" }}>
                {["Ticker", "Días", "TEM", "Rend USD", "Ganancia", "Breakeven", "Banda Venc", "BE vs Banda"].map(h => (
                  <th key={h} style={{ padding: "8px 6px", color: "#475569", fontWeight: 600, textAlign: "right", fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lecaps.map((l, i) => {
                const te = Math.pow(1 + l.temCorte / 100, l.dias / 30) - 1;
                const pf = (usdInicial * tcEntrada * (1 - comision / 100)) * (1 + te) * (1 - comision / 100);
                const tcs = tcEntrada * Math.pow(1 + depDiaria, l.dias);
                const uf = pf / tcs;
                const gp = ((uf / usdInicial) - 1) * 100;
                const be = pf / usdInicial;
                const bv = getBandaTecho(l.mesVenc);
                const diff = be - bv;
                return (
                  <tr key={i} style={{ 
                    borderBottom: "1px solid #111827", 
                    background: i === selectedLecap ? "#172554" : "transparent" 
                  }}>
                    <td style={{ padding: "8px 6px", fontWeight: 700, color: "#f8fafc", textAlign: "right" }}>{l.ticker}</td>
                    <td style={{ padding: "8px 6px", color: "#94a3b8", textAlign: "right" }}>{l.dias}</td>
                    <td style={{ padding: "8px 6px", color: "#22c55e", textAlign: "right" }}>{l.temCorte}%</td>
                    <td style={{ padding: "8px 6px", color: gp >= 0 ? "#4ade80" : "#f87171", fontWeight: 700, textAlign: "right" }}>{formatPct(gp)}</td>
                    <td style={{ padding: "8px 6px", color: gp >= 0 ? "#4ade80" : "#f87171", textAlign: "right" }}>{formatUSD(uf - usdInicial)}</td>
                    <td style={{ padding: "8px 6px", color: "#fbbf24", textAlign: "right" }}>{formatARS(be)}</td>
                    <td style={{ padding: "8px 6px", color: "#60a5fa", textAlign: "right" }}>{formatARS(bv)}</td>
                    <td style={{ padding: "8px 6px", fontWeight: 600, textAlign: "right",
                      color: diff < 0 ? "#f87171" : "#4ade80"
                    }}>
                      {diff > 0 ? `✅ +${formatARS(diff)}` : `⚠️ ${formatARS(diff)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key insight para S31L6 */}
      {selectedLecap === 3 && (
        <div style={{ background: "linear-gradient(135deg, #172554, #1e3a5f)", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #3b82f6" }}>
          <h3 style={{ fontSize: 15, color: "#93c5fd", margin: "0 0 12px" }}>🎯 S31L6 a julio — Tu escenario preferido</h3>
          <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 10px" }}>
              Con entrada a ${tcEntrada}, tu breakeven es <b style={{ color: "#fbbf24" }}>{formatARS(tcBreakeven)}</b>. 
              La banda superior para julio será aproximadamente <b style={{ color: "#60a5fa" }}>{formatARS(bandaAlVenc)}</b> (ajustada por IPC acumulado con rezago t-2).
            </p>
            <p style={{ margin: "0 0 10px" }}>
              {breakevenVsBanda < 0 
                ? <>⚠️ Tu breakeven queda <b style={{ color: "#f87171" }}>{formatARS(Math.abs(breakevenVsBanda))} por debajo del techo de la banda</b>. 
                  Si el dólar llegara al techo máximo permitido, estarías en pérdida. Sin embargo, el dólar hoy está a ${dolarActual}, 
                  un {((bandaAlVenc - dolarActual) / dolarActual * 100).toFixed(0)}% debajo de ese techo futuro. 
                  Para que pierdas, el dólar necesita subir {depMaxima.toFixed(0)}% desde tu entrada.</>
                : <>✅ Tu breakeven queda <b style={{ color: "#4ade80" }}>{formatARS(breakevenVsBanda)} por encima del techo de la banda</b>. 
                  Mientras el régimen de bandas se mantenga, no podés perder.</>
              }
            </p>
            <p style={{ margin: 0 }}>
              Con el BCRA comprando 33 ruedas consecutivas, reservas en máximo de 4 años (US$46.261M), 
              y la cosecha gruesa entrando desde abril, la probabilidad de que el dólar suba {depMaxima.toFixed(0)}% para julio es baja.
              El riesgo principal no es gradual sino de evento discreto (cambio de régimen).
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: 14, background: "#111827", borderRadius: 8, border: "1px solid #1e293b" }}>
        <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>⚠️ DISCLAIMER</div>
        <div style={{ color: "#475569", fontSize: 10, lineHeight: 1.5 }}>
          Análisis informativo, no constituye asesoramiento financiero. Las proyecciones de banda usan IPC conocidos (nov 2.47%, dic 2.8%, ene 2.9%) y estimaciones REM para meses futuros. Un cambio de régimen cambiario invalidaría estos cálculos. Consultá con un asesor matriculado.
        </div>
      </div>
    </div>
  );
}
