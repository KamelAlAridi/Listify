require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Basic route
app.get("/", (req, res) => {
  res.send("Playlist API is live");
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  req.user = user;
  next();
}

// Create playlist
app.post("/playlists", verifyToken, async (req, res) => {
  const { title, description } = req.body;
  const { data, error } = await supabase
    .from("playlists")
    .insert({ title, description, user_id: req.user.id })
    .single();

  if (error) return res.status(400).json({ error });
  res.json(data);
});

// Get playlists
app.get("/playlists", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json({ error });
  res.json(data);
});

// Add song
app.post("/playlists/:id/songs", verifyToken, async (req, res) => {
  const { name, artist, url } = req.body;
  const { data, error } = await supabase
    .from("songs")
    .insert({ name, artist, url, playlist_id: req.params.id })
    .single();

  if (error) return res.status(400).json({ error });
  res.json(data);
});

// Get songs in playlist
app.get("/playlists/:id/songs", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("playlist_id", req.params.id);

  if (error) return res.status(400).json({ error });
  res.json(data);
});
