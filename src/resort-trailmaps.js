import { getMapsByResort } from "./trailmaps-data.js";
import { initMapPage, renderMapCards, bindMapGrid } from "./maps-grid.js";

initMapPage();

// Get resort ID from data attribute
const resortId = document.body.dataset.resort;
const resortMaps = getMapsByResort(resortId);

// DOM elements
const grid = document.getElementById("trailMapsGrid");
const resultsCount = document.getElementById("resultsCount");

renderMapCards(grid, resortMaps);
bindMapGrid(grid, () => resortMaps);

resultsCount.textContent = `${resortMaps.length} trail map${resortMaps.length !== 1 ? "s" : ""}`;
