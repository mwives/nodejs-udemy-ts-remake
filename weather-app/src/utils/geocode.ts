import axios from "axios";

async function geocode(location: string) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?access_token=${process.env.MAPBOX_API_KEY}&limit=1`;
  const response = await axios.get(url);

  if (response.data.features.length === 0) {
    throw new Error("Unable to find location");
  }

  return {
    location: response.data.features[0].place_name,
    latitude: response.data.features[0].center[1],
    longitude: response.data.features[0].center[0],
  };
}

export { geocode };
