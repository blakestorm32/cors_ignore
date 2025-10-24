import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;
const PSIM_ID = process.env.PSIM_ID; // e.g. aslpokemonbattling-up-railway-app
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN; // your client origin, e.g. https://yourclient.up.railway.app

if (!PSIM_ID) throw new Error("Set PSIM_ID env var");

app.use(cors({
  origin: ALLOW_ORIGIN || false, // set exact origin for security
  credentials: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const UPSTREAM = `https://${PSIM_ID}.psim.us/~~${PSIM_ID}/action.php`;

app.post("/action/:act", async (req, res) => {
  try {
    const act = req.params.act;
    const params = new URLSearchParams({ act, ...req.body });
    const r = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).send("proxy error: " + (e?.message || e));
  }
});

app.get("/healthz", (_req, res) => res.send("ok"));

app.listen(PORT, () => console.log(`login-proxy on ${PORT} → ${UPSTREAM}`));
