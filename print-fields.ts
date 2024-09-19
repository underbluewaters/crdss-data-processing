import * as h3 from "h3-js";
import * as gdal from "gdal-async";
import * as Papa from "papaparse";
import { createReadStream, readdirSync, readFileSync } from "node:fs";
// @ts-ignore
import cliProgress from 'cli-progress';

const filePath = process.argv[2];

const stream = createReadStream(filePath);

// const i = 0;
Papa.parse<{ id: string } & any>(stream, {
  header: true,
  dynamicTyping: true,
  step: (row: any, parser) => {
    // if (i === 0) {
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
        console.log(key, type, row.data[key], typeof row.data[key]);
      }
    }
    // }
    // i++;
    parser.abort();
  }
});