import Image from "next/image";
import Link from "next/link";
import { cardImage, discount, inr, type Product } from "@/lib/products";

export default function ProductCard({
  product: p,
  layout = "tall",
  sizes = "(max-width: 640px) 70vw, (max-width: 1024px) 46vw, 27vw",
}: {
  product: Product;
  /** `tall` for rails and grids, `wide` for the stacked custom-design rows. */
  layout?: "tall" | "wide";
  /** Must match how wide the card actually renders, or Next over-fetches. */
  sizes?: string;
}) {
  const wide = layout === "wide";

  return (
    <Link
      href={`/products/${p.slug}`}
      className={`chassis cut group @container relative block h-full ${wide ? "flex items-center gap-4 p-3" : "p-3"}`}
      style={{ ["--cut" as string]: "14px" }}
    >
      {/* image plate — black garments need their own lit surface to read against
          a black page, so the plate carries a soft radial rather than a flat fill */}
      <span
        className={`cut bg-panel relative block shrink-0 overflow-hidden ${
          wide ? "aspect-square w-24" : "aspect-square w-full"
        }`}
        style={{ ["--cut" as string]: "8px" }}
      >
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--color-panel-hi),var(--color-panel)_70%)]"
        />
        <Image
          src={cardImage(p)}
          alt={p.name}
          width={1000}
          height={1000}
          sizes={wide ? "120px" : sizes}
          className="relative h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />

        {!wide && (
          <span
            className="cut bg-void/85 text-ember readout absolute left-2 top-2 px-2 py-1"
            style={{ ["--cut" as string]: "5px" }}
          >
            {p.badge}
          </span>
        )}
      </span>

      <span className={`block ${wide ? "flex-1" : "mt-3"}`}>
        <span className="flex items-start justify-between gap-2">
          <span className="display text-bone group-hover:text-ember block text-[1.05rem] leading-tight transition-colors">
            {p.name}
          </span>
          {wide && <span className="readout text-ember shrink-0">{p.badge}</span>}
        </span>

        <span className="mt-2 flex items-baseline gap-2">
          <span className="text-bone font-semibold">{inr(p.price)}</span>
          <span className="text-bone-faint text-sm line-through">{inr(p.mrp)}</span>
          <span className="readout text-flare">−{discount(p)}%</span>
        </span>

        {/* The generated DVL-#### code that sat on the left was removed at the
            owner's request. It was a hash of the slug, not a stock number — it
            looked like a catalogue reference while referring to nothing. */}
        <span className="border-line/60 mt-3 flex items-center justify-end border-t pt-2">
          <span className="readout text-bone-dim group-hover:text-ember inline-flex items-center gap-1.5 whitespace-nowrap transition-colors">
            View
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              →
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}
