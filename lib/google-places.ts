export async function searchPlaces(query: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query,
    )}&key=${process.env.GOOGLE_PLACES_API_KEY}`,
  )

  const data = await response.json()
  return data.results
}

export async function getPlaceDetails(placeId: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,photos,price_level,rating,url&key=${process.env.GOOGLE_PLACES_API_KEY}`,
  )

  const data = await response.json()
  return data.result
}

export async function getPlacePhoto(photoReference: string, maxWidth = 400) {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
}
