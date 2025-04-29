export const getFisToken = async () => {
  const clientId = "31";
  const clientSecret = process.env.FIS_API_CLIENT_SECRET!;
  const username = process.env.FIS_API_USERNAME!;
  const password = process.env.FIS_API_PASSWORD!;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const res = await fetch("https://api.fis-ski.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
      "X-CSRF-TOKEN": "",
    },
    body: new URLSearchParams({
      grant_type: "password",
      scope: "general.read",
      username,
      password,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("FIS token error:", errorText);
    throw new Error("Failed to fetch FIS token");
  }
  return res.json();
};
