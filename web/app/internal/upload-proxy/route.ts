import { NextResponse } from "next/server";

const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "minio"];

function getAllowedHosts(): string[] {
  const fromEnv = process.env.UPLOAD_PROXY_ALLOWED_HOSTS;
  if (!fromEnv) {
    return DEFAULT_ALLOWED_HOSTS;
  }

  return fromEnv
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const uploadUrl = formData.get("uploadUrl") ?? formData.get("upload_url");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (typeof uploadUrl !== "string" || uploadUrl.trim() === "") {
    return NextResponse.json({ error: "URL de destination manquante" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(uploadUrl);
  } catch {
    return NextResponse.json({ error: "URL de destination invalide" }, { status: 400 });
  }

  const allowedHosts = getAllowedHosts();
  if (!allowedHosts.includes(target.hostname)) {
    return NextResponse.json({ error: "Destination de téléversement non autorisée" }, { status: 400 });
  }

  const upstreamResponse = await fetch(target, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file.stream(),
  });

  if (!upstreamResponse.ok) {
    const errorText = await upstreamResponse.text();
    return NextResponse.json(
      {
        error: "Erreur lors du téléversement vers le stockage",
        status: upstreamResponse.status,
        details: errorText ? errorText.slice(0, 2048) : undefined,
      },
      { status: upstreamResponse.status },
    );
  }

  return NextResponse.json({ success: true });
}
