import { type SizeChart as Chart } from "@/lib/products";

/**
 * The supplier's measurements, laid out so a customer can actually use them.
 *
 * Deliberately a real <table>: this is tabular data, a screen reader should
 * read "Chest, L, 45 inches", and the row that matters is the one with the
 * reader's size on it. The supplier's figures are printed unchanged, tolerance
 * included — rounding someone else's garment measurements to look tidier is
 * how a customer ends up with the wrong fit.
 *
 * Height leads, before any measurement. Almost nobody knows their chest in
 * inches and everybody knows their height, so the column people can answer
 * goes first and the rest is there to check against.
 *
 * Chest is stated ROUND, which is why the heading says so. A size L ringer at
 * 40in round is 20in across lying flat, and someone reading 40 as a flat
 * measurement orders two sizes too big.
 */
export default function SizeChart({ chart }: { chart: Chart }) {
  return (
    <div className="space-y-4">
      <p className="readout text-bone-faint">{chart.name} · inches</p>

      {/* Narrow phones scroll this sideways rather than squashing the table. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[24rem] border-collapse text-left">
          <thead>
            <tr className="border-line/60 border-b">
              <th scope="col" className="label text-bone-faint py-2 pr-3 font-normal">
                Size
              </th>
              <th scope="col" className="label text-bone-faint py-2 pr-3 font-normal">
                Your height
              </th>
              {chart.columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="label text-bone-faint py-2 pr-3 text-right font-normal last:pr-0 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map(([size, height, ...figures]) => (
              <tr
                key={size}
                className="border-line/30 border-b last:border-0 [&:nth-child(even)]:bg-white/[0.02]"
              >
                <th
                  scope="row"
                  className="label text-ember py-2.5 pr-3 text-left font-normal whitespace-nowrap"
                >
                  {size}
                </th>
                <td className="text-bone py-2.5 pr-3 whitespace-nowrap">{height}</td>
                {figures.map((n, i) => (
                  <td
                    key={chart.columns[i]}
                    className="text-bone-dim py-2.5 pr-3 text-right tabular-nums last:pr-0"
                  >
                    {n}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-bone-faint space-y-2 text-[0.8rem] leading-relaxed">
        <p className="text-bone-dim">{chart.note}</p>
        <p>
          Height is our guidance for an average build, not a rule — the
          measurements are what the garment actually is. Chest is measured all
          the way round, not flat. Sizes may vary by {chart.tolerance}.
        </p>
      </div>
    </div>
  );
}
