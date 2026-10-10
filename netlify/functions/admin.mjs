
import crypto from "node:crypto";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.endsWith("/login") && req.method === "POST") {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const token = process.env.ADMIN_TOKEN;

    const missing = [
      ["ADMIN_USERNAME", username],
      ["ADMIN_PASSWORD", password],
      ["ADMIN_TOKEN", token],
    ]
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length) {
      console.error("Missing admin environment variables:", missing);
      return json(
        {
          message:
            "Admin configuration missing: " + missing.join(", "),
        },
        503
      );
    }

    try {
      const body = await req.json();

      if (
        !safeEqual(body.username, username) ||
        !safeEqual(body.password, password)
      ) {
        return json(
          { message: "Incorrect username or password." },
          401
        );
      }

      return json({ success: true, token });
    } catch {
      return json({ message: "Invalid login request." }, 400);
    }
  }

  if (path.endsWith("/data") && req.method === "PUT") {
    const token = process.env.ADMIN_TOKEN;
    const auth = req.headers.get("authorization") || "";

    if (!token || !safeEqual(auth, `Bearer ${token}`)) {
      return json(
        { message: "Unauthorised. Please sign in again." },
        401
      );
    }

    try {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore("rzia-aura-live");
      const body = await req.json();

      if (
        !body ||
        !Array.isArray(body.products) ||
        !Array.isArray(body.collections)
      ) {
        return json({ message: "Invalid store data." }, 400);
      }

      await store.setJSON("store-data", body);

      const saved = await store.get("store-data", {
        type: "json",
        consistency: "strong",
      });

      if (!saved) {
        return json(
          { message: "Save verification failed." },
          500
        );
      }

      return json({
        success: true,
        data: saved,
        message: "Website data saved and verified.",
      });
    } catch (error) {
      console.error("ADMIN WRITE ERROR", error);
      return json(
        { message: "Admin data save failed. Check Netlify function logs." },
        500
      );
    }
  }

  return json({ message: "Not found." }, 404);
};
