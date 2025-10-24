// server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;
const PSIM_ID = process.env.PSIM_ID; // e.g. "aslpokemonbattling-up-railway-app"
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN; // e.g. "https://yourclient.up.railway.app"

if (!PSIM_ID) throw new Error("Set PSIM_ID env var PSIM_ID");
const UPSTREAM = `https://${PSIM_ID}.psim.us/~~${PSIM_ID}/action.php`;

// CORS (only if calling from a different origin)
if (ALLOW_ORIGIN) {
  app.use(cors({ origin: ALLOW_ORIGIN, credentials: true }));
}

app.use(express.urlencoded({ extended: false })); // handle x-www-form-urlencoded
app.use(express.json());                           // handle JSON (optional)

// ---- Preflight for /action routes (when cross-origin) ----
app.options("/action/:act", (req, res) => {
  if (ALLOW_ORIGIN) {
    res.set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
    res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.set("Access-Control-Allow-Headers", "content-type");
    res.set("Access-Control-Allow-Credentials", "true");
  }
  res.sendStatus(204);
});

// ---- helper that actually calls psim.us ----
async function forward(act, payload, res) {
  const params = new URLSearchParams({ act, ...Object.fromEntries(Object.entries(payload || {})) });
  const r = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  const text = await r.text();
  // reflect CORS on response when needed
  if (ALLOW_ORIGIN) res.set("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.status(r.status).send(text);
}

// ---- /action/:act accepts GET or POST (recommended path) ----
app.all("/action/:act", async (req, res) => {
  try {
    const act = req.params.act;
    const payload = req.method === "GET" ? req.query : req.body;
    await forward(act, payload, res);
  } catch (e) {
    res.status(502).send("proxy error: " + (e?.message || e));
  }
});

// ---- Fallback: /action?act=... (or body.act) ----
app.all("/action", async (req, res) => {
  try {
    const payload = req.method === "GET" ? req.query : req.body;
    const act = payload?.act;
    if (!act) return res.status(400).send("missing act");
    await forward(act, payload, res);
  } catch (e) {
    res.status(502).send("proxy error: " + (e?.message || e));
  }
});

// Health
app.get("/healthz", (_req, res) => res.send("ok"));

app.listen(PORT, () => {
  console.log(`login-proxy on ${PORT} → ${UPSTREAM}`);
});
