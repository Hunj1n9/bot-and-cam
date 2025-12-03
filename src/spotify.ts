let token = ""

export async function get30NewReleaseCovers() {
  const res = await fetch("/api/v1/browse/new-releases?limit=30", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json()

  // Extract cover image URLs
  const covers = data.albums.items.map((album: any) => album.images[0].url)

  return covers
}
