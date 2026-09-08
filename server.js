// server.js — Entrypoint for Hostinger Shared / Cloud Hosting (Phusion Passenger / LiteSpeed Node.js)
const path = require("path");

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = process.env.PORT || "3000";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

// Delegate to Next.js compiled standalone server
require("./.next/standalone/server.js");
