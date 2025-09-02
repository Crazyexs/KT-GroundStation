import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

let dir = { 
  init: "./custom_libary_server/__init__/",
  function: "./custom_libary_server/function/",
  config: "./config/",
  expression: "./custom_libary_server/expression.js"
};

dir = Object.fromEntries(
  Object.entries(dir).map(([key, relPath]) => [key, pathToFileURL(path.resolve(relPath))])
);

export { dir };