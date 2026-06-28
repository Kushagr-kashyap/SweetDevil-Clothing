"use client";

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-line">
      {/* giant wordmark */}
      <div className="mx-auto max-w-[1400px] px-5 pt-20 md:px-10">
        <h2 className="display text-[22vw] leading-[0.8] text-ink/95 md:text-[16vw]">
          Sweet<span className="text-devil">.</span>
        </h2>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <p className="eyebrow text-ink-dim">Join the cult</p>
          <p className="mt-4 max-w-sm text-lg text-ink-dim">
            Drops sell out. Get first dibs, secret discounts, and zero spam.
          </p>
          <form
            className="mt-6 flex max-w-sm items-center gap-2 rounded-full border border-line p-1.5"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-ink-dim"
            />
            <button className="rounded-full bg-devil px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105">
              Join
            </button>
          </form>
        </div>

        <div>
          <p className="eyebrow text-ink-dim">Shop</p>
          <ul className="mt-5 space-y-3 text-ink-dim">
            {["Devil's Club", "Brainrot Club", "Limited Edition", "All products"].map(
              (l) => (
                <li key={l}>
                  <a href="#shop" className="transition-colors hover:text-ink">
                    {l}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-ink-dim">Brand</p>
          <ul className="mt-5 space-y-3 text-ink-dim">
            {["About", "Contact", "Custom design", "Instagram"].map((l) => (
              <li key={l}>
                <a href="#" className="transition-colors hover:text-ink">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 border-t border-line px-5 py-6 text-sm text-ink-dim md:flex-row md:items-center md:justify-between md:px-10">
        <span>© {new Date().getFullYear()} Sweet Devil. Unleash your inner devil.</span>
        <span className="font-mono">Made in India · sweetdevil.in</span>
      </div>
    </footer>
  );
}
