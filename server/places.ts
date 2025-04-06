import axios from 'axios';

// Regular expression to extract place ID from Google Maps URLs
const PLACE_ID_REGEX = /!1s([^!]+)/;
const MAPS_URL_REGEX = /maps.google.com|google.com\/maps/;

interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetails {
  name: string;
  placeId: string;
  address: string;
  rating?: string;
  priceLevel?: string;
  photoUrl?: string;
  cuisine?: string;
  mapUrl?: string;
}

/**
 * Search for places using Google Places Autocomplete API
 */
export async function searchPlacesAutocomplete(query: string): Promise<PlaceAutocompleteResult[]> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Configure the request to focus on restaurants
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${apiKey}`
    );

    if (response.data.status !== 'OK') {
      console.error('Places Autocomplete API error:', response.data.status, response.data.error_message);
      return [];
    }

    return response.data.predictions.map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text || '',
      secondaryText: prediction.structured_formatting?.secondary_text || ''
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Extract Place ID from a Google Maps URL
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  if (!MAPS_URL_REGEX.test(url)) {
    return null;
  }

  // Try to extract via regex
  const matches = url.match(PLACE_ID_REGEX);
  if (matches && matches[1]) {
    return matches[1];
  }

  // If we couldn't extract the placeId through regex, check for query params
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Check different parameter variations that might contain the place ID
    return params.get('place_id') || 
           params.get('q')?.split('/').pop() || 
           null;
  } catch (e) {
    console.error("Failed to parse URL:", e);
    return null;
  }
}

/**
 * Fetch place details from Google Places API
 */
export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const fields = [
      'name',
      'formatted_address',
      'rating',
      'price_level',
      'photos',
      'types',
      'url',
      'website'
    ].join(',');

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    );

    if (response.data.status !== 'OK' || !response.data.result) {
      console.error('Places API error:', response.data.status, response.data.error_message);
      return null;
    }

    const result = response.data.result;
    
    // Determine cuisine type from place types
    let cuisine = '';
    if (result.types && Array.isArray(result.types)) {
      // Filter types to find ones that might indicate cuisine
      const cuisineTypes = result.types.filter((type: string) => 
        !['point_of_interest', 'establishment', 'food', 'restaurant'].includes(type)
      );
      
      if (cuisineTypes.length > 0) {
        // Format cuisine type - replace underscores with spaces and capitalize
        cuisine = cuisineTypes[0]
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    // Get photo reference if available
    let photoUrl = undefined;
    if (result.photos && result.photos.length > 0) {
      const photoRef = result.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;
    }

    // Format price level
    let priceLevel = undefined;
    if (result.price_level !== undefined) {
      priceLevel = '$'.repeat(result.price_level);
    }

    return {
      name: result.name,
      placeId: placeId,
      address: result.formatted_address,
      rating: result.rating ? result.rating.toString() : undefined,
      priceLevel,
      photoUrl,
      cuisine,
      mapUrl: result.url
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

/**
 * Process a Google Maps URL to extract place details
 */
export async function getPlaceDetailsFromUrl(url: string): Promise<PlaceDetails | null> {
  const placeId = extractPlaceIdFromUrl(url);
  if (!placeId) {
    return null;
  }
  
  return await fetchPlaceDetails(placeId);
}