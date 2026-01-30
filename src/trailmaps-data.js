// Trail maps data - sorted by uphill policy rank
// Shared across all trail map pages
// Rankings must match resorts.json

export const trailMaps = [
  {
    name: "Winter Park",
    file: "WinterPark.webp",
    type: "webp",
    rank: 1,
    resort: "winterpark",
  },
  {
    name: "Aspen Snowmass",
    file: "AspenSnowmass.webp",
    type: "webp",
    rank: 2,
    resort: "aspen",
  },
  {
    name: "Aspen Buttermilk",
    file: "AspenButtermilk.webp",
    type: "webp",
    rank: 2,
    resort: "aspen",
  },
  {
    name: "Aspen Highlands",
    file: "AspenHighlands.webp",
    type: "webp",
    rank: 2,
    resort: "aspen",
  },
  {
    name: "Aspen Mountain",
    file: "AspenMountain.webp",
    type: "webp",
    rank: 2,
    resort: "aspen",
  },
  {
    name: "Copper Mountain",
    file: "Copper.webp",
    type: "webp",
    rank: 3,
    resort: "copper",
  },
  {
    name: "Monarch (Frontside)",
    file: "MonarchFrontside.webp",
    type: "webp",
    rank: 4,
    resort: "monarch",
  },
  {
    name: "Monarch (No Name Basin)",
    file: "MonarchNoNameBasin.webp",
    type: "webp",
    rank: 4,
    resort: "monarch",
  },
  {
    name: "Monarch (Mirkwood Basin)",
    file: "MonarchMirkwoodBasin.webp",
    type: "webp",
    rank: 4,
    resort: "monarch",
  },
  {
    name: "Telluride",
    file: "Telluride.webp",
    type: "webp",
    rank: 5,
    resort: "telluride",
  },
  {
    name: "Arapahoe Basin",
    file: "A-Basin.webp",
    type: "webp",
    rank: 6,
    resort: "abasin",
  },
  {
    name: "Ski Cooper (Front)",
    file: "Cooper-1.webp",
    type: "webp",
    rank: 7,
    resort: "cooper",
  },
  {
    name: "Ski Cooper (Back)",
    file: "Cooper-2.webp",
    type: "webp",
    rank: 7,
    resort: "cooper",
  },
  {
    name: "Eldora",
    file: "Eldora.webp",
    type: "webp",
    rank: 8,
    resort: "eldora",
  },
  {
    name: "Vail",
    file: "Vail.avif",
    type: "avif",
    rank: 9,
    resort: "vail",
  },
  {
    name: "Breckenridge",
    file: "Breck.webp",
    type: "webp",
    rank: 10,
    resort: "breckenridge",
  },
  {
    name: "Steamboat",
    file: "Steamboat.webp",
    type: "webp",
    rank: 11,
    resort: "steamboat",
  },
  {
    name: "Keystone",
    file: "Keystone.webp",
    type: "webp",
    rank: 12,
    resort: "keystone",
  },
  {
    name: "Beaver Creek",
    file: "BeaverCreek.avif",
    type: "avif",
    rank: 13,
    resort: "beavercreek",
  },
  {
    name: "Crested Butte",
    file: "CrestedButte.avif",
    type: "avif",
    rank: 14,
    resort: "crestedbutte",
  },
  {
    name: "Loveland",
    file: "Loveland.webp",
    type: "webp",
    rank: 15,
    resort: "loveland",
  },
  {
    name: "Granby Ranch",
    file: "GranbyRanch.webp",
    type: "webp",
    rank: 16,
    resort: "granby",
  },
  {
    name: "Echo Mountain",
    file: "EchoMountain.webp",
    type: "webp",
    rank: 17,
    resort: "echo",
  },
  {
    name: "Wolf Creek",
    file: "WolfCreek.webp",
    type: "webp",
    rank: 18,
    resort: "wolfcreek",
  },
  {
    name: "Howelsen Hill",
    file: "HowelsenHill.webp",
    type: "webp",
    rank: 19,
    resort: "howelsen",
  },
  {
    name: "Powderhorn",
    file: "Powderhorn.webp",
    type: "webp",
    rank: 20,
    resort: "powderhorn",
  },
  {
    name: "Sunlight Mountain Resort",
    file: "Sunlight.webp",
    type: "webp",
    rank: 21,
    resort: "sunlight",
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
