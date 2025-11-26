export default async function handler(req, res) {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
}

const id = req.query.id;
if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
}

const gamesUrl = `https://games.roblox.com/v1/games?universeIds=${id}`;
const iconsUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${id}&size=512x512&format=Png&isCircular=false`;

try {
    const [gamesResp, iconsResp] = await Promise.all([
        fetch(gamesUrl),
        fetch(iconsUrl)
    ]);

    const gamesJson = await gamesResp.json();
    const iconsJson = await iconsResp.json();

    const icon = iconsJson.data && iconsJson.data[0] ? iconsJson.data[0].imageUrl : null;
    const g = gamesJson.data && gamesJson.data[0] ? gamesJson.data[0] : null;

    if (!g) {
        res.status(404).json({ error: "No game data found" });
        return;
    }

    res.status(200).json({
        data: [{
            universeId: g.universeId,
            rootPlaceId: g.rootPlaceId,
            name: g.name,
            description: g.description,
            playing: g.playing,
            visits: g.visits,
            icon
        }]
    });
} catch (err) {
    console.error("Error fetching Roblox API:", err);
    res.status(500).json({ error: "Failed to fetch Roblox API" });
}

}
