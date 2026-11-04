const ROBLOX_HEADERS = { Accept: "application/json" };

async function fetchJson(url) {
    const resp = await fetch(url, { headers: ROBLOX_HEADERS });
    if (!resp.ok) throw new Error(`${resp.status} ${url}`);
    return resp.json();
}

const looksZeroed = (json) => (json.data || []).length > 0 && json.data.every(g => !g.visits);

async function fetchGames(url, retries = 2) {
    const json = await fetchJson(url);
    if (retries > 0 && looksZeroed(json)) {
        await new Promise(r => setTimeout(r, 250));
        return fetchGames(url, retries - 1);
    }
    return json;
}

export default async function handler(req, res) {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
}

const id = String(req.query.id || "").replace(/\s+/g, "");
if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
}
if (!/^\d+(,\d+)*$/.test(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
}

const gamesUrl = `https://games.roblox.com/v1/games?universeIds=${id}`;
const iconsUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${id}&size=512x512&format=Png&isCircular=false`;
const thumbsUrl = `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${id}&countPerUniverse=1&defaults=true&size=768x432&format=Png&isCircular=false`;

try {
    const [gamesJson, iconsJson, thumbsJson] = await Promise.all([
        fetchGames(gamesUrl),
        fetchJson(iconsUrl).catch(() => ({ data: [] })),
        fetchJson(thumbsUrl).catch(() => ({ data: [] }))
    ]);

    const icons = new Map((iconsJson.data || []).map(i => [String(i.targetId), i.imageUrl || null]));
    const thumbs = new Map((thumbsJson.data || []).map(t => [String(t.universeId), t.thumbnails?.[0]?.imageUrl || null]));

    const data = (gamesJson.data || []).map(g => ({
        universeId: g.id,
        rootPlaceId: g.rootPlaceId,
        name: g.name,
        description: g.description,
        creator: g.creator?.name || null,
        playing: g.playing,
        visits: g.visits,
        favorites: g.favoritedCount,
        icon: icons.get(String(g.id)) || null,
        thumbnail: thumbs.get(String(g.id)) || null
    }));

    if (data.length === 0) {
        res.status(404).json({ error: "No game data found" });
        return;
    }

    res.setHeader("Cache-Control", looksZeroed(gamesJson) ? "no-store" : "s-maxage=300, stale-while-revalidate=3600");
    res.status(200).json({ data });
} catch (err) {
    console.error("Error fetching Roblox API:", err);
    res.status(502).json({ error: "Failed to fetch Roblox API" });
}

}
