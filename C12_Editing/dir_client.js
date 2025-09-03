import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

let dir = { 
  function: "./custom_libary_client/function/",
  config: "../config/",
};

dir = Object.fromEntries(
  Object.entries(dir).map(([key, relPath]) => [key, pathToFileURL(path.resolve(relPath))])
);

export { dir };