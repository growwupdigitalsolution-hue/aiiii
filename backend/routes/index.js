
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

fs.readdirSync(__dirname)
    .filter((file) => file !== "index.js" && file.endsWith(".route.js"))
    .forEach((file) => {
        const routeModule = require(path.join(__dirname, file));
        router.use("/", routeModule);
        console.log(`[routes] mounted -> ${file}`);
    });

module.exports = router;
