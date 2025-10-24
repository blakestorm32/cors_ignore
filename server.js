// server.js
import express from "express";
const app = express();
const PORT = process.env.PORT || 8080;
const PSIM_ID = process.env.PSIM_ID || "aslpokemonbattling-up-railway-app";
const UPSTREAM = `https://${PSIM_ID}.psim.us/~~${PSIM_ID}/action.php`;

app.use(express.urlencoded({ extended: false })); // x-www-form-urlencoded
app.use(express.json());

// POST /action/:act  (e.g. /action/login, /action/upkeep)
app.post("/action/:act", async (req, res) => {
  try {
    const act = req.params.act; // "login", "upkeep", etc.
    const params = new URLSearchParams({ act, ...req.body }); // include name, pass, challstr if present
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

app.listen(PORT, () => console.log(`login-proxy on ${PORT} → ${UPSTREAM}`));
