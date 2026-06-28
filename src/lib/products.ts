export type Collection = "Devil's Club" | "Brainrot Club" | "Limited Edition";

export type Product = {
  slug: string;
  name: string;
  collection: Collection;
  price: number; // INR
  /** two-stop gradient used for the placeholder artwork until real photos arrive */
  gradient: [string, string];
  tag?: "New" | "Bestseller" | "Last few";
};

export const products: Product[] = [
  {
    slug: "satans-child",
    name: "Satan's Child",
    collection: "Devil's Club",
    price: 999,
    gradient: ["#ff2e2e", "#3a0608"],
    tag: "Bestseller",
  },
  {
    slug: "weed-demon",
    name: "Weed Demon",
    collection: "Brainrot Club",
    price: 899,
    gradient: ["#16a34a", "#06281a"],
    tag: "New",
  },
  {
    slug: "midnight-sinner",
    name: "Midnight Sinner",
    collection: "Devil's Club",
    price: 1099,
    gradient: ["#6d28d9", "#120426"],
  },
  {
    slug: "doomscroll",
    name: "Doomscroll",
    collection: "Brainrot Club",
    price: 799,
    gradient: ["#0ea5e9", "#04212e"],
    tag: "New",
  },
  {
    slug: "hellfire-club",
    name: "Hellfire Club",
    collection: "Limited Edition",
    price: 1599,
    gradient: ["#ff7a18", "#2a0a02"],
    tag: "Last few",
  },
  {
    slug: "no-thoughts",
    name: "No Thoughts Head Empty",
    collection: "Brainrot Club",
    price: 799,
    gradient: ["#e11d76", "#2b0418"],
  },
  {
    slug: "fallen-halo",
    name: "Fallen Halo",
    collection: "Devil's Club",
    price: 1099,
    gradient: ["#eab308", "#2a2102"],
  },
  {
    slug: "feral-mode",
    name: "Feral Mode",
    collection: "Limited Edition",
    price: 1499,
    gradient: ["#f4f1ea", "#1a1a1a"],
    tag: "Last few",
  },
];

export const collections: {
  name: Collection;
  blurb: string;
  gradient: [string, string];
}[] = [
  {
    name: "Devil's Club",
    blurb: "Band-grade graphics for the gloriously unholy.",
    gradient: ["#ff2e2e", "#1a0203"],
  },
  {
    name: "Brainrot Club",
    blurb: "Terminally online. Proudly unserious.",
    gradient: ["#16a34a", "#04140d"],
  },
  {
    name: "Limited Edition",
    blurb: "Numbered drops. Once they're gone, they're gone.",
    gradient: ["#ff7a18", "#1c0a02"],
  },
];

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
