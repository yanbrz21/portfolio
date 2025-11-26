export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const userId = req.query.id;
  if (!userId) {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  const userUrl = `https://users.roblox.com/v1/users/${userId}`;
  const followersUrl = `https://friends.roblox.com/v1/users/${userId}/followers/count`;
  const friendsUrl = `https://friends.roblox.com/v1/users/${userId}/friends/count`;
  const avatarUrlEndpoint = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`;

  try {
    const [userResp, followersResp, friendsResp, avatarResp] = await Promise.all([
      fetch(userUrl),
      fetch(followersUrl),
      fetch(friendsUrl),
      fetch(avatarUrlEndpoint)
    ]);

    const userJson = await userResp.json();
    const followersJson = await followersResp.json();
    const friendsJson = await friendsResp.json();
    const avatarJson = await avatarResp.json();

    const avatarUrl = avatarJson.data?.[0]?.imageUrl || null;

    res.status(200).json({
      id: userJson.id,
      username: userJson.name,
      displayName: userJson.displayName,
      description: userJson.description,
      followers: followersJson.count,
      friends: friendsJson.count,
      avatarUrl
    });
  } catch (err) {
    console.error("Error fetching Roblox user API:", err);
    res.status(500).json({ error: "Failed to fetch Roblox user API" });
  }
}
