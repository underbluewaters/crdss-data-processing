import * as h3 from "h3-js";
import * as gdal from "gdal-async";
import * as Papa from "papaparse";
import { createReadStream } from "node:fs";

// get path to csv (first argument)
const filePath = process.argv[2];
// then get the output path (second argument)
const outputPath = process.argv[3];

if (!filePath) {
  console.error("Usage: npx ts-node csvToFGB.ts <path-to-csv> <output-path>");
  process.exit(1);
}

if (!outputPath) {
  console.error("Usage: npx ts-node csvToFGB.ts <path-to-csv> <output-path>");
  process.exit(1);
}

// First, create a new fgb to write to
const driver = gdal.drivers.get('FlatGeobuf');
const ds = driver.create(outputPath);

const layer = ds.layers.create('cells', gdal.SpatialReference.fromEPSG(4326), gdal.wkbPolygon);
layer.fields.add(new gdal.FieldDefn('id', gdal.OFTString));

// Create a read stream from the input csv file
const stream = createReadStream(filePath);
let i = 0;
console.log('parse');
Papa.parse<{ id: string } & any>(stream, {
  header: true,
  step: (row: any) => {
    if (i === 0) {
      // add field definitions
      for (const key in row.data) {
        if (key !== 'id' && key !== "__parsed_extra") {
          let type: string = gdal.OFTString;
          switch (typeof row.data[key]) {
            case 'number':
              type = gdal.OFTReal;
              break;
            case 'boolean':
              type = gdal.OFTInteger;
              break;
          }
          console.log('add type', key, type);
          layer.fields.add(new gdal.FieldDefn(key, type));
        }
      }
    }
    // console.log(row.data.id);
    i++;
    if (i % 1000 === 0) {
      console.log(`Processed ${i.toLocaleString()} cells`);
    }
    const id = row.data.id.toString()
    // console.log('id', id);
    const polygon = h3.cellsToMultiPolygon([id], true)[0];
    // console.log('polygon', polygon);
    const feature = new gdal.Feature(layer);
    feature.setGeometry(gdal.Geometry.fromGeoJson({
      type: "Polygon",
      coordinates: polygon
    }));
    feature.fields.set('id', id);
    for (const key in row.data) {
      if (key !== 'id' && key !== "__parsed_extra") {
        feature.fields.set(key, row.data[key]);
      }
    }
    layer.features.add(feature);
  },
  complete: () => {
    console.log(`Wrote ${i.toLocaleString()} cells to ${outputPath}`);
  }
});
