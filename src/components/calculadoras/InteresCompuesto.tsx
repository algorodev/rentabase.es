import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export default function InteresCompuesto() {
  const [capital, setCapital] = useState(0);
  const [aportacion, setAportacion] = useState(200);
  const [rentabilidad, setRentabilidad] = useState(7);
  const [anos, setAnos] = useState(20);

  const interactedRef = useRef(false);
  const completedRef = useRef(false);

  const trackInteraction = useCallback(() => {
    if (!interactedRef.current) {
      interactedRef.current = true;
      window.gtag?.('event', 'calculator_interaction', { calculator_name: 'interes-compuesto' });
    }
  }, []);

  const { totalAportado, valorFinal, ganancias, datos } = useMemo(() => {
    const r = clamp(rentabilidad, 0, 100) / 12 / 100;
    const n = clamp(anos, 0, 50) * 12;
    const cap = Math.max(0, capital);
    const aport = Math.max(0, aportacion);

    const valor =
      r === 0
        ? cap + aport * n
        : cap * Math.pow(1 + r, n) + aport * ((Math.pow(1 + r, n) - 1) / r);

    const totalAport = cap + aport * n;

    const datos = Array.from({ length: clamp(anos, 0, 50) }, (_, i) => {
      const meses = (i + 1) * 12;
      const aportado = cap + aport * meses;
      const valorAnual =
        r === 0
          ? aportado
          : cap * Math.pow(1 + r, meses) +
            aport * ((Math.pow(1 + r, meses) - 1) / r);
      return {
        año: `Año ${i + 1}`,
        Aportado: Math.round(aportado),
        'Valor total': Math.round(valorAnual),
      };
    });

    return {
      totalAportado: totalAport,
      valorFinal: valor,
      ganancias: valor - totalAport,
      datos,
    };
  }, [capital, aportacion, rentabilidad, anos]);

  useEffect(() => {
    if (interactedRef.current && !completedRef.current) {
      completedRef.current = true;
      window.gtag?.('event', 'calculator_completed', { calculator_name: 'interes-compuesto' });
    }
  }, [valorFinal]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-texto/70 mb-1">
            Capital inicial (€)
          </label>
          <input
            type="number"
            min={0}
            max={10000000}
            value={capital}
            onChange={(e) => { trackInteraction(); setCapital(Math.max(0, Number(e.target.value))); }}
            className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-texto/70 mb-1">
            Aportación mensual (€)
          </label>
          <input
            type="number"
            min={0}
            max={100000}
            value={aportacion}
            onChange={(e) => { trackInteraction(); setAportacion(Math.max(0, Number(e.target.value))); }}
            className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-texto/70 mb-1">
            Rentabilidad anual esperada (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={rentabilidad}
            onChange={(e) => {
              trackInteraction();
              setRentabilidad(clamp(Number(e.target.value), 0, 100));
            }}
            className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-texto/70 mb-1">
            Años de inversión
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={anos}
            onChange={(e) => { trackInteraction(); setAnos(clamp(Number(e.target.value), 1, 50)); }}
            className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-lg bg-fondo p-4">
            <p className="text-sm text-texto/60">Total aportado</p>
            <p className="text-xl font-bold text-texto">{fmt(totalAportado)} €</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700/70">Valor final estimado</p>
            <p className="text-2xl font-bold text-green-700">
              {fmt(valorFinal)} €
            </p>
          </div>
          <div className="rounded-lg bg-fondo p-4">
            <p className="text-sm text-texto/60">Ganancias generadas</p>
            <p className="text-xl font-bold text-texto">{fmt(ganancias)} €</p>
          </div>
        </div>

        {datos.length > 0 && (
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos}>
                <XAxis
                  dataKey="año"
                  tick={{ fontSize: 11 }}
                  interval={Math.max(0, Math.floor(datos.length / 6) - 1)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    `${(v / 1000).toFixed(0)}k`
                  }
                />
                <Tooltip
                  formatter={(v: number) => `${fmt(v)} €`}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Aportado" fill="#283F3B" radius={[2, 2, 0, 0]} />
                <Bar
                  dataKey="Valor total"
                  fill="#DAFA34"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
