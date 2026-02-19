import { NextRequest, NextResponse } from "next/server";
import type { MusicTrack } from "@/lib/types";

// -----------------------------------------------------------------------------
// Jamendo helpers
// -----------------------------------------------------------------------------

interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  duration: number;
  audio: string;
  image: string;
  shareurl: string;
  license_ccurl: string;
  musicinfo?: {
    tags?: { genres?: string[] };
  };
}

interface JamendoResponse {
  headers: { status: string; code: number; results_count: number };
  results: JamendoTrack[];
}

function normalizeJamendoTrack(track: JamendoTrack): MusicTrack {
  const genre =
    track.musicinfo?.tags?.genres?.[0] ?? undefined;

  return {
    id: String(track.id),
    title: track.name,
    artist: track.artist_name,
    duration: track.duration,
    streamUrl: track.audio,
    artworkUrl: track.image,
    platform: "jamendo",
    platformUrl: track.shareurl,
    license: track.license_ccurl,
    genre,
    attributionText: `"${track.name}" by ${track.artist_name} \u2014 Free download from Jamendo (${track.license_ccurl})`,
  };
}

async function searchJamendo(
  q: string,
  limit: number,
  genre?: string,
  instrumental?: boolean
): Promise<MusicTrack[]> {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    console.warn(
      "[Music Search] JAMENDO_CLIENT_ID is not set \u2014 skipping Jamendo search"
    );
    return [];
  }

  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    search: q,
    limit: String(limit),
    audioformat: "mp32",
    imagesize: "200",
    include: "licenses+musicinfo",
    durationbetween: "10_600",
  });

  if (instrumental) {
    params.set("vocalinstrumental", "instrumental");
  }

  if (genre) {
    params.set("fuzzytags", genre);
  }

  const url = `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    console.error(
      `[Music Search] Jamendo request failed: ${res.status} ${res.statusText}`
    );
    return [];
  }

  const data: JamendoResponse = await res.json();

  if (data.headers.code !== 0) {
    console.error(
      `[Music Search] Jamendo API error: code=${data.headers.code} status=${data.headers.status}`
    );
    return [];
  }

  return data.results.map(normalizeJamendoTrack);
}

// -----------------------------------------------------------------------------
// Audius helpers
// -----------------------------------------------------------------------------

interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  permalink: string;
  artwork: {
    "150x150"?: string;
    "480x480"?: string;
    "1000x1000"?: string;
  } | null;
  user: {
    name: string;
  };
  genre?: string;
}

interface AudiusSearchResponse {
  data: AudiusTrack[];
}

/**
 * Resolve a usable Audius API host.
 * The discovery endpoint returns a list of healthy hosts.
 */
async function getAudiusHost(): Promise<string | null> {
  try {
    const res = await fetch("https://api.audius.co", {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const json: { data: string[] } = await res.json();
    return json.data?.[0] ?? null;
  } catch (err) {
    console.error("[Music Search] Failed to resolve Audius host:", err);
    return null;
  }
}

function normalizeAudiusTrack(
  track: AudiusTrack,
  host: string
): MusicTrack {
  const artworkUrl =
    track.artwork?.["480x480"] ??
    track.artwork?.["150x150"] ??
    "";

  const platformUrl = `https://audius.co${track.permalink}`;

  return {
    id: track.id,
    title: track.title,
    artist: track.user.name,
    duration: track.duration,
    streamUrl: `${host}/v1/tracks/${track.id}/stream?app_name=kodapost`,
    artworkUrl,
    platform: "audius",
    platformUrl,
    license: "All Rights Reserved (Artist Permission)",
    genre: track.genre ?? undefined,
    attributionText: `"${track.title}" by ${track.user.name} \u2014 via Audius (${platformUrl})`,
  };
}

async function searchAudius(
  q: string,
  limit: number,
  genre?: string
): Promise<MusicTrack[]> {
  const host = await getAudiusHost();
  if (!host) {
    console.error("[Music Search] No Audius host available");
    return [];
  }

  const params = new URLSearchParams({
    query: q,
    app_name: "kodapost",
    limit: String(limit),
  });

  if (genre) {
    params.set("genre", genre);
  }

  const url = `${host}/v1/tracks/search?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 300 } });

  if (!res.ok) {
    console.error(
      `[Music Search] Audius request failed: ${res.status} ${res.statusText}`
    );
    return [];
  }

  const data: AudiusSearchResponse = await res.json();

  if (!data.data) {
    return [];
  }

  return data.data.map((t) => normalizeAudiusTrack(t, host));
}

// -----------------------------------------------------------------------------
// Route handler
// -----------------------------------------------------------------------------

/**
 * GET /api/music/search
 *
 * Proxy music search across Jamendo and Audius.
 *
 * Query params:
 *   q            - search term (required)
 *   source       - "jamendo" | "audius" | "all" (default "all")
 *   limit        - results per source, 1-50 (default 20)
 *   genre        - optional genre filter
 *   instrumental - "true" to filter instrumental only (Jamendo)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 }
    );
  }

  const source = (searchParams.get("source") ?? "all") as
    | "jamendo"
    | "audius"
    | "all";
  const rawLimit = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 50);
  const genre = searchParams.get("genre") ?? undefined;
  const instrumental = searchParams.get("instrumental") === "true";

  try {
    const promises: Promise<MusicTrack[]>[] = [];

    if (source === "jamendo" || source === "all") {
      promises.push(searchJamendo(q, limit, genre, instrumental));
    }

    if (source === "audius" || source === "all") {
      promises.push(searchAudius(q, limit, genre));
    }

    const results = await Promise.allSettled(promises);

    const tracks: MusicTrack[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        tracks.push(...result.value);
      } else {
        console.error(
          "[Music Search] A source failed:",
          result.reason
        );
      }
    }

    return NextResponse.json({ tracks, source });
  } catch (error) {
    console.error("[Music Search] Unexpected error:", error);
    return NextResponse.json(
      { error: "Music search failed" },
      { status: 500 }
    );
  }
}
