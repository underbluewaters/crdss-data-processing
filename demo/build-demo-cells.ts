import { readFileSync, createWriteStream } from "node:fs";
import * as h3 from "h3-js";

const RESOLUTION = 11;

// Note that the number of cells is likely limited to 16,777,217 due to
// limitations in Node.js
const allCells = new Set<string>();

const data = JSON.parse(readFileSync("./input/footprint-singlepart.geojson", "utf-8"));
for (const feature of data.features) {
  const cells = h3.polygonToCells(feature.geometry.coordinates[0], RESOLUTION, true);
  cells.forEach(cell => allCells.add(cell));
}

// for each cell, stream out id to a newline delimited file
const output = createWriteStream("./output/cells.csv");
Array.from(allCells).forEach(cell => output.write(cell + "\n"));
output.end();

console.log(`Wrote ${allCells.size.toLocaleString()} cells to output/cells.csv`);

// const geojsonOutput = createWriteStream("./output/cells.geojson.json");
// geojsonOutput.write("{\n\"type\": \"FeatureCollection\",\n\"features\": [\n");
// // for each cell, stream out id to a newline delimited file
// let first = true;
// let i = 0;
// allCells.forEach(cell => {
//   i++;
//   // if (i > limit) {
//   //   return;
//   // }
//   if (!first) {
//     geojsonOutput.write(",\n");
//   }
//   // @ts-ignore
//   geojsonOutput.write(JSON.stringify({
//     type: "Feature",
//     properties: {
//       id: cell,
//       i
//     },
//     geometry: {
//       type: "Polygon",
//       coordinates: h3.cellsToMultiPolygon([cell], true)[0]
//     }
//   }));
//   first = false;
// });
// geojsonOutput.write("\n]\n}");
// geojsonOutput.end();
