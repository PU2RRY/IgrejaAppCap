const CLOUDINARY_CLOUD = "dlxqp3igi"
const CLOUDINARY_PRESET = "mix_do_reino"

export async function uploadFotoCloudinary(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("upload_preset", CLOUDINARY_PRESET)
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: fd,
  })
  if (!r.ok) throw new Error("Falha no upload da foto")
  const d = await r.json()
  return d.secure_url as string
}
