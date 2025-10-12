export async function uploadFileToSignedUrl(
  url: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
  const tryBrowserUpload = () => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
        } else {
          reject(new Error("Le téléversement a échoué"));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Impossible de téléverser le fichier"));
      };

      xhr.send(file);
    });
  };

  const uploadViaProxy = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadUrl", url);

    const response = await fetch("/internal/upload-proxy", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      try {
        const payload = await response.json();
        throw new Error(payload?.error || "Le téléversement a échoué");
      } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error("Le téléversement a échoué");
      }
    }
  };

  if (typeof window !== "undefined" && typeof XMLHttpRequest !== "undefined") {
    try {
      await tryBrowserUpload();
      return;
    } catch (error) {
      console.warn("Direct upload failed, falling back to proxy", error);
      onProgress(0);
    }
  }

  await uploadViaProxy();
  onProgress(100);
}

