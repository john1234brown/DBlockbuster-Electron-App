"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tunnel_exports = {};
__export(tunnel_exports, {
  tunnel: () => tunnel
});
module.exports = __toCommonJS(tunnel_exports);
var import_node_child_process = require("node:child_process");
var import_constants = require("./constants.js");
var import_regex = require("./regex.js");
function tunnel(options = {}) {
  const args = ["tunnel"];
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === "string") {
      args.push(`${key}`, value);
    } else if (typeof value === "number") {
      args.push(`${key}`, value.toString());
    } else if (value === null) {
      args.push(`${key}`);
    }
  }
  if (args.length === 1) {
    args.push("--url", "localhost:8080");
  }
  const child = (0, import_node_child_process.spawn)(import_constants.bin, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (process.env.VERBOSE) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }
  const url_regex = /\|\s+(https?:\/\/[^\s]+)/;
  let url_resolver = () => void 0;
  let url_rejector = () => void 0;
  const url = new Promise((...pair) => [url_resolver, url_rejector] = pair);
  const connection_resolvers = [];
  const connection_rejectors = [];
  const connections = [];
  for (let i = 0; i < 1; i++) {
    connections.push(new Promise((...pair) => [connection_resolvers[i], connection_rejectors[i]] = pair));
  }
  const parser = (data) => {
    var _a;
    const str = data.toString();
    const url_match = str.match(url_regex);
    url_match && url_resolver(url_match[1]);
    const conn_match = str.match(import_regex.conn_regex);
    const ip_match = str.match(import_regex.ip_regex);
    const location_match = str.match(import_regex.location_regex);
    const index_match = str.match(import_regex.index_regex);
    if (conn_match && ip_match && location_match && index_match) {
      const [, id] = conn_match;
      const [, ip] = ip_match;
      const [, location] = location_match;
      const [, idx] = index_match;
      (_a = connection_resolvers[+idx]) == null ? void 0 : _a.call(connection_resolvers, { id, ip, location });
    }
  };
  child.stdout.on("data", parser).on("error", url_rejector);
  child.stderr.on("data", parser).on("error", url_rejector);
  const stop = () => child.kill("SIGINT");
  return { url, connections, child, stop };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  tunnel
});
