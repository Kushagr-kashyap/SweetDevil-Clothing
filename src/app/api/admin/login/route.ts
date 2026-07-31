import {
  checkPassword,
  clearCookie,
  isAdminConfigured,
  mintSession,
  sessionCookie,
} from "@/lib/admin-auth";

const seeOther = (location: string, cookie?: string) =>
  new Response(null, {
    status: 303,
    headers: {
      location,
      "cache-control": "no-store",
      ...(cookie ? { "set-cookie": cookie } : {}),
    },
  });

export async function POST(request: Request) {
  if (!isAdminConfigured()) return seeOther("/admin?error=unconfigured");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther("/admin?error=1");
  }

  // Logging out is a POST too, so a stray GET can't end the session.
  if (form.get("action") === "logout") return seeOther("/admin", clearCookie());

  const password = String(form.get("password") ?? "");
  if (!password || !(await checkPassword(password))) {
    console.warn("admin: failed login attempt");
    return seeOther("/admin?error=bad");
  }

  return seeOther("/admin", sessionCookie(await mintSession()));
}
