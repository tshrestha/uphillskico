// Trail maps data - sorted by uphill policy rank
// Shared across all trail map pages

export const trailMaps = [
  {
    name: "Winter Park",
    file: "WinterPark.webp",
    type: "webp",
    rank: 1,
    resort: "winterpark",
  },
  {
    name: "Howelsen Hill",
    file: "HowelsenHill.webp",
    type: "webp",
    rank: 2,
    resort: "howelsen",
  },
  {
    name: "Aspen Snowmass",
    file: "AspenSnowmass.webp",
    type: "webp",
    rank: 3,
    resort: "aspen",
  },
  {
    name: "Aspen Buttermilk",
    file: "AspenButtermilk.webp",
    type: "webp",
    rank: 3,
    resort: "aspen",
  },
  {
    name: "Aspen Highlands",
    file: "AspenHighlands.webp",
    type: "webp",
    rank: 3,
    resort: "aspen",
  },
  {
    name: "Aspen Mountain",
    file: "AspenMountain.webp",
    type: "webp",
    rank: 3,
    resort: "aspen",
  },
  {
    name: "Copper Mountain",
    file: "Copper.webp",
    type: "webp",
    rank: 4,
    resort: "copper",
  },
  {
    name: "Ski Cooper (Front)",
    file: "Cooper-1.webp",
    type: "webp",
    rank: 5,
    resort: "cooper",
  },
  {
    name: "Ski Cooper (Back)",
    file: "Cooper-2.webp",
    type: "webp",
    rank: 5,
    resort: "cooper",
  },
  {
    name: "Monarch (Frontside)",
    file: "MonarchFrontside.webp",
    type: "webp",
    rank: 6,
    resort: "monarch",
  },
  {
    name: "Monarch (No Name Basin)",
    file: "MonarchNoNameBasin.webp",
    type: "webp",
    rank: 6,
    resort: "monarch",
  },
  {
    name: "Monarch (Mirkwood Basin)",
    file: "MonarchMirkwoodBasin.webp",
    type: "webp",
    rank: 6,
    resort: "monarch",
  },
  {
    name: "Telluride",
    file: "Telluride.webp",
    type: "webp",
    rank: 7,
    resort: "telluride",
  },
  {
    name: "Powderhorn",
    file: "Powderhorn.webp",
    type: "webp",
    rank: 8,
    resort: "powderhorn",
  },
  {
    name: "Sunlight",
    file: "Sunlight.webp",
    type: "webp",
    rank: 9,
    resort: "sunlight",
  },
  {
    name: "Arapahoe Basin",
    file: "A-Basin.webp",
    type: "webp",
    rank: 10,
    resort: "abasin",
  },
  {
    name: "Eldora",
    file: "Eldora.webp",
    type: "webp",
    rank: 11,
    resort: "eldora",
  },
  {
    name: "Granby Ranch",
    file: "GranbyRanch.webp",
    type: "webp",
    rank: 12,
    resort: "granby",
  },
  {
    name: "Echo Mountain",
    file: "EchoMountain.webp",
    type: "webp",
    rank: 13,
    resort: "echo",
  },
  {
    name: "Wolf Creek",
    file: "WolfCreek.webp",
    type: "webp",
    rank: 14,
    resort: "wolfcreek",
  },
  {
    name: "Loveland",
    file: "Loveland.webp",
    type: "webp",
    rank: 15,
    resort: "loveland",
  },
  {
    name: "Vail",
    file: "Vail.avif",
    type: "avif",
    rank: 16,
    resort: "vail",
    // TODO: Add WebP fallback when available
    // fallback: "Vail.webp",
  },
  {
    name: "Beaver Creek",
    file: "BeaverCreek.avif",
    type: "avif",
    rank: 17,
    resort: "beavercreek",
    // TODO: Add WebP fallback when available
    // fallback: "BeaverCreek.webp",
  },
  {
    name: "Breckenridge",
    file: "Breck.webp",
    type: "webp",
    rank: 18,
    resort: "breckenridge",
  },
  {
    name: "Keystone",
    file: "Keystone.webp",
    type: "webp",
    rank: 19,
    resort: "keystone",
  },
  {
    name: "Crested Butte",
    file: "CrestedButte.avif",
    type: "avif",
    rank: 20,
    resort: "crestedbutte",
    // TODO: Add WebP fallback when available
    // fallback: "CrestedButte.webp",
  },
  {
    name: "Steamboat",
    file: "Steamboat.webp",
    type: "webp",
    rank: 21,
    resort: "steamboat",
  },
  {
    name: "Kendall Mountain",
    file: "Kendall.webp",
    type: "webp",
    rank: 22,
    resort: "kendall",
  },
  {
    name: "Silverton",
    file: "Silverton.webp",
    type: "webp",
    rank: 23,
    resort: "silverton",
  },
  {
    name: "Purgatory",
    file: "Purgatory.webp",
    type: "webp",
    rank: 24,
    resort: "purgatory",
  },
];

// Get maps filtered by resort
export function getMapsByResort(resortId) {
  return trailMaps.filter((map) => map.resort === resortId);
}

// Resort metadata for intermediate pages
export const resortMeta = {
  aspen: {
    name: "Aspen Snowmass",
    description: "Trail maps for all four Aspen Snowmass mountains",
  },
  monarch: {
    name: "Monarch Mountain",
    description: "Trail maps for Monarch Mountain ski area",
  },
  cooper: {
    name: "Ski Cooper",
    description: "Trail maps for Ski Cooper ski area",
  },
};
