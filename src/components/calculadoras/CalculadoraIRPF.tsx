import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const TRAMOS = [
  { limite: 6000, tipo: 0.19, etiqueta: '19 % (0 € – 6.000 €)' },
  { limite: 50000, tipo: 0.21, etiqueta: '21 % (6.000 € – 50.000 €)' },
  { limite: 200000, tipo: 0.23, etiqueta: '23 % (50.000 € – 200.000 €)' },
  { limite: 300000, tipo: 0.27, etiqueta: '27 % (200.000 € – 300.000 €)' },
  { limite: Infinity, tipo: 0.28, etiqueta: '28 % (más de 300.000 €)' },
];

function calcularIRPF(ganancia: number) {
  if (ganancia <= 0) return { desglose: [], totalImpuesto: 0 };

  let pendiente = ganancia;
  let acumulado = 0;
  const desglose: { etiqueta: string; base: number; cuota: number }[] = [];

  for (const tramo of TRAMOS) {
    if (pendiente <= 0) break;
    const baseTramo = Math.min(pendiente, tramo.limite - acumulado);
    if (baseTramo > 0) {
      desglose.push({
        etiqueta: tramo.etiqueta,
        base: baseTramo,
        cuota: baseTramo * tramo.tipo,
      });
      pendiente -= baseTramo;
      acumulado += baseTramo;
    }
  }

  const totalImpuesto = desglose.reduce((s, d) => s + d.cuota, 0);
  return { desglose, totalImpuesto };
}

export default function CalculadoraIRPF() {
  const [precioCompra, setPrecioCompra] = useState(10000);
  const [precioVenta, setPrecioVenta] = useState(15000);
  const [comisiones, setComisiones] = useState(20);

  const interactedRef = useRef(false);
  const completedRef = useRef(false);

  const trackInteraction = useCallback(() => {
    if (!interactedRef.current) {
      interactedRef.current = true;
      window.gtag?.('event', 'calculator_interaction', { calculator_name: 'irpf' });
    }
  }, []);

  const resultado = useMemo(() => {
    const compra = Math.max(0, precioCompra);
    const venta = Math.max(0, precioVenta);
    const com = Math.max(0, comisiones);

    const gananciaBruta = venta - compra - com;
    const { desglose, totalImpuesto } = calcularIRPF(gananciaBruta);
    const gananciaNeta = gananciaBruta - totalImpuesto;
    const tipoEfectivo =
      gananciaBruta > 0 ? (totalImpuesto / gananciaBruta) * 100 : 0;

    return {
      gananciaBruta,
      desglose,
      totalImpuesto,
      gananciaNeta,
      tipoEfectivo,
      esPerdida: gananciaBruta < 0,
    };
  }, [precioCompra, precioVenta, comisiones]);

  useEffect(() => {
    if (interactedRef.current && !completedRef.current) {
      completedRef.current = true;
      window.gtag?.('event', 'calculator_completed', { calculator_name: 'irpf' });
    }
  }, [resultado.gananciaBruta]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-texto/70 mb-1">
            Precio de compra total (€)
          </label>
          <input
            type="number"
            min={0}
            value={precioCompra}
            onChange={(e) => { trackInteraction(); setPrecioCompra(Math.max(0, Number(e.target.value))); }}
            className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-texto/70 mb-1">
            Precio de venta total (€)
          </label>
          <input
            type="number"
            min={0}
            value={precioVenta}
            onChange={(e) => { trackInteraction(); setPrecioVenta(Math.max(0, Number(e.target.value))); }}
            className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-texto/70 mb-1">
            Comisiones totales (€)
          </label>
          <input
            type="number"
            min={0}
            value={comisiones}
            onChange={(e) => { trackInteraction(); setComisiones(Math.max(0, Number(e.target.value))); }}
            className="w-full rounded-lg border border-texto/10 bg-white px-4 py-2.5 text-texto focus:border-verde focus:ring-1 focus:ring-verde outline-none transition"
          />
        </div>
      </div>

      <div className="space-y-3">
        {resultado.esPerdida ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-amber-800 font-medium">
              Has generado una pérdida de {fmt(Math.abs(resultado.gananciaBruta))} €
              que puedes compensar con otras ganancias.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-fondo p-4">
              <p className="text-sm text-texto/60">Ganancia patrimonial bruta</p>
              <p className="text-xl font-bold text-texto">
                {fmt(resultado.gananciaBruta)} €
              </p>
            </div>

            <div className="rounded-lg bg-fondo p-4 space-y-2">
              <p className="text-sm font-medium text-texto/70">
                Desglose por tramos
              </p>
              {resultado.desglose.map((d) => (
                <div
                  key={d.etiqueta}
                  className="flex justify-between text-sm text-texto/70"
                >
                  <span>{d.etiqueta}</span>
                  <span className="font-medium text-texto">
                    {fmt(d.cuota)} €
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700/70">Total impuesto</p>
              <p className="text-xl font-bold text-red-700">
                {fmt(resultado.totalImpuesto)} €
              </p>
            </div>

            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-700/70">
                Ganancia neta después de impuestos
              </p>
              <p className="text-2xl font-bold text-green-700">
                {fmt(resultado.gananciaNeta)} €
              </p>
            </div>

            <div className="rounded-lg bg-fondo p-4">
              <p className="text-sm text-texto/60">Tipo efectivo</p>
              <p className="text-xl font-bold text-texto">
                {resultado.tipoEfectivo.toFixed(2)} %
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
