import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
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

export default function ComparadorFondoETF() {
  const [inversionMensual, setInversionMensual] = useState(300);
  const [anos, setAnos] = useState(20);
  const [rentabilidadBruta, setRentabilidadBruta] = useState(7);
  const [terFondo, setTerFondo] = useState(0.2);
  const [terETF, setTerETF] = useState(0.12);
  const [comisionETF, setComisionETF] = useState(2);

  const interactedRef = useRef(false);
  const completedRef = useRef(false);

  const trackInteraction = useCallback(() => {
    if (!interactedRef.current) {
      interactedRef.current = true;
      window.gtag?.('event', 'calculator_interaction', { calculator_name: 'fondo-vs-etf' });
    }
  }, []);

  const resultado = useMemo(() => {
    const inv = Math.max(0, inversionMensual);
    const a = clamp(anos, 1, 50);
    const bruta = clamp(rentabilidadBruta, 0, 100);
    const tf = clamp(terFondo, 0, 10);
    const te = clamp(terETF, 0, 10);
    const ce = Math.max(0, comisionETF);

    const rFondo = (bruta - tf) / 12 / 100;
    const rETF = (bruta - te) / 12 / 100;

    const datos = Array.from({ length: a }, (_, i) => {
      const meses = (i + 1) * 12;
      const comisionesAcumuladas = ce * (i + 1) * 12;

      const valorFondo =
        rFondo === 0
          ? inv * meses
          : inv * ((Math.pow(1 + rFondo, meses) - 1) / rFondo);

      const valorETFBruto =
        rETF === 0
          ? inv * meses
          : inv * ((Math.pow(1 + rETF, meses) - 1) / rETF);

      const valorETF = valorETFBruto - comisionesAcumuladas;

      return {
        año: `Año ${i + 1}`,
        'Fondo indexado': Math.round(valorFondo),
        ETF: Math.round(valorETF),
      };
    });

    const ultimo = datos[datos.length - 1];
    const valorFondo = ultimo['Fondo indexado'];
    const valorETF = ultimo['ETF'];
    const diferencia = valorETF - valorFondo;
    const costeComisiones = ce * a * 12;

    return { datos, valorFondo, valorETF, diferencia, costeComisiones, anos: a };
  }, [inversionMensual, anos, rentabilidadBruta, terFondo, terETF, comisionETF]);

  useEffect(() => {
    if (interactedRef.current && !completedRef.current) {
      completedRef.current = true;
      window.gtag?.('event', 'calculator_completed', { calculator_name: 'fondo-vs-etf' });
    }
  }, [resultado.diferencia]);

  const ganaETF = resultado.diferencia > 0;

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-texto/70 mb-1">
              Inversión mensual (€)
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              value={inversionMensual}
              onChange={(e) => {
                trackInteraction();
                setInversionMensual(Math.max(0, Number(e.target.value)));
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
          <div>
            <label className="block text-sm font-medium text-texto/70 mb-1">
              Rentabilidad bruta anual (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={rentabilidadBruta}
              onChange={(e) => {
                trackInteraction();
                setRentabilidadBruta(clamp(Number(e.target.value), 0, 100));
              }}
              className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-texto/70 mb-1">
                TER fondo indexado (%)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.01}
                value={terFondo}
                onChange={(e) => {
                  trackInteraction();
                  setTerFondo(clamp(Number(e.target.value), 0, 10));
                }}
                className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto/70 mb-1">
                TER ETF (%)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.01}
                value={terETF}
                onChange={(e) => {
                  trackInteraction();
                  setTerETF(clamp(Number(e.target.value), 0, 10));
                }}
                className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-texto/70 mb-1">
              Comisión de compra ETF (€ por operación)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={comisionETF}
              onChange={(e) => {
                trackInteraction();
                setComisionETF(Math.max(0, Number(e.target.value)));
              }}
              className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-fondo p-4">
            <p className="text-sm text-texto/60">Valor final con fondo indexado</p>
            <p className="text-xl font-bold text-texto">
              {fmt(resultado.valorFondo)} €
            </p>
          </div>
          <div className="rounded-lg bg-fondo p-4">
            <p className="text-sm text-texto/60">Valor final con ETF</p>
            <p className="text-xl font-bold text-texto">
              {fmt(resultado.valorETF)} €
            </p>
          </div>
          <div
            className={`rounded-lg p-4 border ${
              ganaETF
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <p
              className={`text-sm ${ganaETF ? 'text-green-700/70' : 'text-amber-700/70'}`}
            >
              Diferencia
            </p>
            <p
              className={`text-2xl font-bold ${ganaETF ? 'text-green-700' : 'text-amber-700'}`}
            >
              {fmt(Math.abs(resultado.diferencia))} €
            </p>
            <p
              className={`text-sm mt-1 ${ganaETF ? 'text-green-700/70' : 'text-amber-700/70'}`}
            >
              {ganaETF
                ? 'El ETF gana gracias a su menor TER, que compensa las comisiones de compra.'
                : 'El fondo indexado gana porque las comisiones de compra del ETF superan el ahorro por menor TER.'}
            </p>
          </div>
          <div className="rounded-lg bg-fondo p-4">
            <p className="text-sm text-texto/60">
              Coste total comisiones compra ETF en {resultado.anos} años
            </p>
            <p className="text-xl font-bold text-texto">
              {fmt(resultado.costeComisiones)} €
            </p>
          </div>
        </div>
      </div>

      {resultado.datos.length > 0 && (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={resultado.datos}>
              <XAxis
                dataKey="año"
                tick={{ fontSize: 11 }}
                interval={Math.max(0, Math.floor(resultado.datos.length / 6) - 1)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => `${fmt(v)} €`}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="Fondo indexado"
                stroke="#283F3B"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ETF"
                stroke="#DAFA34"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <strong>Nota importante:</strong> Esta calculadora no incluye la ventaja
        fiscal del traspaso sin tributar de los fondos indexados, que puede suponer
        una diferencia adicional significativa a largo plazo.
      </div>
    </div>
  );
}
