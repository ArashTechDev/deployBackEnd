const axios = require('axios');

const GEOCODE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GEOCODE_API_KEY
      }
    });

    if (response.data.status === 'OK') {
      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    } else {
      throw new Error('Geocoding failed');
    }
  } catch (err) {
    console.error('Geocode error:', err.message);
    return { latitude: null, longitude: null };
  }
}

module.exports = geocodeAddress;
