"use strict";

require('dotenv').config();

const express = require("express");
const colors = require("colors/safe");
const argv = require('minimist')(process.argv.slice(2));
const app = express();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");

let gameport = argv.gameport || 8887;
log(`using port ${gameport}`);

const whiteList = [
  'https://ucsdlearninglabs.org',
  'http://localhost:3000',
  'http://localhost:8880',
  'http://localhost:8887',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whiteList.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  optionsSuccessStatus: 200
};

function makeMessage(text) { return `${colors.blue("[store]")} ${text}`; }
function log(text) { console.log(makeMessage(text)); }

// ---------------------------------------------------------------------------
// MongoDB setup (always connected — responses always go to Mongo)
// ---------------------------------------------------------------------------

mongoose.set('useCreateIndex', true);

const mongoURL = process.env.MONGO_URL;
if (!mongoURL) {
  console.error('MONGO_URL is not set in .env');
  process.exit(1);
}

const Draw = require("./models/draw.model");
const Response = require("./models/response.model");

function mongoConnectWithRetry(delayMs, callback) {
  mongoose.connect(mongoURL, (err) => {
    if (err) {
      console.error(`Error connecting to MongoDB: ${err}`);
      setTimeout(() => mongoConnectWithRetry(delayMs, callback), delayMs);
    } else {
      log("connected successfully to mongodb");
      callback();
    }
  });
}

function markAnnotation(gameid, drawings) {
  const id_list = drawings.map(x => mongoose.Types.ObjectId(x._id));
  Draw.updateMany(
    { _id: { $in: id_list } },
    { $push: { games: gameid } },
    (err) => { if (err) log(`error marking annotation: ${err}`); }
  );
}

// ---------------------------------------------------------------------------
// CSV data layer
// ---------------------------------------------------------------------------

function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

const gamesCount = {};

function csvGetClasses(data) {
  return [...new Set(data.map(r => r.class))].sort();
}

function csvGetSingleClass(data, cls, num) {
  const rows = data
    .filter(r => r.class === cls)
    .sort((a, b) => {
      const ga = gamesCount[a.filename] || 0;
      const gb = gamesCount[b.filename] || 0;
      return ga - gb || (parseInt(a.shuffler_ind) || 0) - (parseInt(b.shuffler_ind) || 0);
    })
    .slice(0, num)
    .map(r => ({ ...r, _id: r.filename, games: [], url: (process.env.IMG_URL_PREFIX || '') + '/img/' + r.filename }));
  rows.forEach(r => { gamesCount[r.filename] = (gamesCount[r.filename] || 0) + 1; });
  return rows;
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

function serve() {
  app.use(cors(corsOptions));
  app.use(express.json());

  const dataSource = process.env.DATA_SOURCE || 'mongodb';
  log(`data source: ${dataSource}`);

  // POST /db/post-response always saves to MongoDB
  app.post("/db/post-response", (req, res) => {
    const newResponses = req.body.map(x => new Response(x));
    Response.insertMany(newResponses, (err) => {
      if (err) res.status(400).json("Error: " + err);
      else res.status(200).json("new Responses added!");
    });
  });

  if (dataSource === 'local_csv') {
    const imgDir = process.env.IMG_DIR || path.join(__dirname, 'img');
    app.use('/img', express.static(imgDir));
    log(`serving images from ${imgDir}`);

    const csvPath = process.env.DATA_CSV_PATH || path.join(__dirname, 'data', 'annotations.csv');
    const csvData = parseCSV(csvPath);
    log(`loaded ${csvData.length} rows from ${csvPath}`);

    app.get('/db/get-classes', (req, res) => {
      res.status(200).json(csvGetClasses(csvData));
    });

    app.post('/db/get-single-class', (req, res) => {
      const rows = csvGetSingleClass(csvData, req.body.class, req.body.num);
      res.status(200).json(rows);
    });

    app.put('/db/update-data', (req, res) => {
      const row = csvData.find(r => r.filename === req.body.filename);
      if (row) row.valid = req.body.valid;
      res.status(200).send("valid updated!");
    });

    app.post('/db/get-data', (req, res) => {
      res.status(200).json(csvData);
    });

  } else {
    mongoConnectWithRetry(2000, () => {
      app.post("/db/add", (req, res) => {
        const newDraw = new Draw({ filename: req.body.filename, age: req.body.age, valid: req.body.valid, class: req.body.class });
        newDraw.save().then(() => res.json("new Draw added!")).catch(err => res.status(400).json("Error: " + err));
      });

      app.put("/db/update-data", (req, res) => {
        Draw.findOneAndUpdate({ filename: req.body.filename }, { valid: req.body.valid }, { new: true }, (err) => {
          if (err) res.status(400).json("Error: " + err);
          else res.status(200).send("valid updated!");
        });
      });

      app.get("/db/get-classes", (req, res) => {
        Draw.find().distinct('class', (err, result) => {
          if (err) res.status(400).json("Error: " + err);
          else res.status(200).json(result.sort());
        });
      });

      app.post("/db/get-single-class", (req, res) => {
        log("get single class: " + req.body.class);
        Draw.aggregate([
          { $addFields: { numGames: { $size: '$games' } } },
          { $match: { class: req.body.class } },
          { $sort: { numGames: 1, shuffler_ind: 1 } },
          { $limit: req.body.num }
        ], (err, result) => {
          if (err) res.status(400).json("Error: " + err);
          else {
            res.status(200).json(result);
            markAnnotation(req.body.worker_id, result);
          }
        });
      });

      app.post("/db/get-data", (req, res) => {
        Draw.aggregate([
          { $match: { class: { $in: req.body.classes } } },
          { $sort: { age: 1, class: 1 } }
        ], (err, result) => {
          if (err) res.status(400).json("Error: " + err);
          else res.status(200).json(result);
        });
      });
    });
  }

  app.use(express.static(path.join(__dirname, '..', 'build')));

  app.listen(gameport, () => {
    log(`running at http://localhost:${gameport}`);
  });
}

mongoConnectWithRetry(2000, serve);
