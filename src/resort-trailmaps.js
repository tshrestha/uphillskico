// Resort trail map pages (/trailmaps/<resort>.html): the cards and count are
// prerendered, so this only adds the shared page behaviour and the viewer.
import { initMapPage, bindMapGrid } from "./maps-grid.js";

initMapPage();
bindMapGrid(document.getElementById("trailMapsGrid"));
