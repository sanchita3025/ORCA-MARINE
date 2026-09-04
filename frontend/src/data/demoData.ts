export const demoData = {
  answer:
    "Conditions are moderately suitable based on the available marine data.",

  risk: {
    score: 58,

    level: "MODERATE",
  },

  weather: {
    temperature: 28,

    wind_speed: 18,

    precipitation: 20,
  },

  ocean: {
    wave_height: 1.4,

    wave_period: 7,

    current_speed: 0.8,

    sst: 28.4,
  },

  satellite: {
    pfz_available: true,

    pfz: "HIGH",
  },

  gis: {
    restricted_zone: false,

    location_name:
      "Near Paradip",
  },

  breakdown: {
    wind: 15,

    waves: 20,

    weather: 5,

    ocean: 8,

    pfz: -10,

    gis: 0,
  },

  verification: {
    verified: true,

    confidence: 0.87,
  },
};