const express = require("express");
const session = require("cookie-session");
const bodyParser = require("body-parser");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mongourl = "mongodb+srv://sunnylaumongodb:QVq5GxR1Nsj2zHS5@cluster0.myrqpax.mongodb.net/?retryWrites=true&w=majority";
const mongoose = require("mongoose");

var cameraSchema = mongoose.Schema({
  name: String,
  quantity: Number,
});

// hard code user login data
const users = [
  { name: "admin", password: "admin" },
  { name: "user", password: "user" },
];

const initData = [
  { name: "Nikkon", qty: 20 },
  { name: "Cannon", qty: 50 },
];

// Initial camera stock data
const appInit = () => {
  mongoose.connect(mongourl);
  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", async () => {
    const Camera = mongoose.model("camera", cameraSchema);

    try {
      for (let i = 0; i < initData.length; i++) {
        const searchResult = await Camera.findOne({ name: initData[i].name }).exec();
        if (searchResult) {
          continue;
        }

        // create a contact
        const camera = new Camera({ name: initData[i].name, quantity: initData[i].qty });
        const createResult = await camera.save();
        console.log(createResult);
        console.log("camera stock created!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      db.close();
      // read();
    }
  });
};

// Exec initialize for the database
appInit();

app.use(
  session({
    name: "loginSession",
    secret: "s381fgroupproject",
  })
);

app.get("/", (req, res) => {
  console.log(req.session);
  if (!req.session.authenticated) {
    // user not logged in!
    res.redirect("/login");
  } else {
    res.status(200).render("frontpage", { user: req.session, status: req.query.status });
  }
});

app.get("/login", (req, res) => {
  res.status(200).render("login", { status: req.query.status });
});

// If login information is not valid
app.get("/login", (req, res) => {
  console.log("hit");
  res.status(200).render("login", { status: "error" });
});

app.post("/login", (req, res) => {
  let success = false;

  users.forEach((user) => {
    if (user.name == req.body.name && user.password == req.body.password) {
      // correct user name + password
      // store the following name/value pairs in cookie session
      req.session.authenticated = true; // 'authenticated': true
      req.session.userid = req.body.name; // 'userid': req.body.name
      success = true;
    }
  });
  if (success) {
    res.redirect("/");
  } else {
    res.redirect("/login?status=error");
  }
});

app.get("/logout", (req, res) => {
  req.session = null; // clear cookie-session
  res.redirect("/");
});

// CRUD

// Return camera result list

// ejs
// curl -X GET localhost:8099/camera

// Return JSON response
// curl -H "content-type: application/json" -X GET localhost:8099/camera
app.get("/camera", function (req, res) {
  mongoose.connect(mongourl);
  const db = mongoose.connection;

  let result = null;

  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", async () => {
    const Camera = mongoose.model("camera", cameraSchema);

    try {
      const criteria = {};
      const searchResult = await Camera.find(criteria).exec();
      console.log(`# documents meeting the criteria ${JSON.stringify(criteria)}: ${searchResult.length}`);
      console.log(searchResult);

      if (req.headers["content-type"] == "application/json") {
        res.status(200).json(searchResult);
      } else {
        res.status(200).render("camerapage", { data: searchResult });
      }
    } catch (err) {
      console.error(err);
      if (req.headers["content-type"] == "application/json") {
        res.status(400).json(err);
      } else {
        res.status(400).render("camerapage", { data: [] });
      }
    } finally {
      db.close();
    }
  });
});

// Return camera search result by name

// ejs
// curl -X GET localhost:8099/camera/name/Cannon

// JSON response
// curl -H "content-type: application/json" -X GET localhost:8099/camera/name/Cannon
app.get("/camera/name/:name", function (req, res) {
  mongoose.connect(mongourl);
  const db = mongoose.connection;

  let result = null;

  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", async () => {
    const Camera = mongoose.model("camera", cameraSchema);

    try {
      const criteria = { name: req.params.name };
      const searchResult = await Camera.find(criteria).exec();
      console.log(`# documents meeting the criteria ${JSON.stringify(criteria)}: ${searchResult.length}`);
      console.log(searchResult);

      if (req.headers["content-type"] == "application/json") {
        res.status(200).json(searchResult);
      } else {
        res.status(200).render("camerapage", { data: searchResult });
      }
    } catch (err) {
      console.error(err);
      if (req.headers["content-type"] == "application/json") {
        res.status(400).json(err);
      } else {
        res.status(400).render("camerapage", { data: [] });
      }
    } finally {
      db.close();
    }
  });
});

// Create camera stock

// API endpoint hit through the create form

// return json response
// curl -H "content-type: application/json" -X POST -d '{"name":"Cannon","quantity": 20}' localhost:8099/camera/create
app.post("/camera/create", function (req, res) {
  console.log(`name: ${req.body.name}`);
  console.log(`qty: ${req.body.quantity}`);

  let name = req.body.name;
  let qty = Number(req.body.quantity);

  mongoose.connect(mongourl);
  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", async () => {
    const Camera = mongoose.model("camera", cameraSchema);

    try {
      // Check exist or not, short circuit if existed
      const searchResult = await Camera.findOne({ name: name }).exec();
      if (searchResult) {
        if (req.headers["content-type"] == "application/json") {
          return res.status(400).json("Camera Existed");
        } else {
          return res.status(400).redirect("/?status=error");
        }
      }

      // create a contact
      const camera = new Camera({ name: name, quantity: qty });
      const createResult = await camera.save();
      console.log(createResult);
      console.log("camera stock created!");
      console.log(req.headers["content-type"]);
      if (req.headers["content-type"] == "application/json") {
        res.status(200).json(createResult);
      } else {
        res.status(200).redirect("/camera");
      }
    } catch (err) {
      console.error(err);
      if (req.headers["content-type"] == "application/json") {
        res.status(400).json(err);
      } else {
        res.status(400).redirect("/");
      }
    } finally {
      db.close();
      // read();
    }
  });
});

// Delete camera stock

// through name
// curl -X DELETE localhost:8099/camera/name/:name
// curl -X DELETE localhost:8099/camera/name/Nikkon

app.delete("/camera/name/:name", function (req, res) {
  mongoose.connect(mongourl);
  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", async () => {
    const Camera = mongoose.model("camera", cameraSchema);

    try {
      const result = await Camera.deleteMany({ name: req.params.name });
      console.log("Contact deleted!");
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json(err);
    } finally {
      db.close();
    }
  });
});

// Update exist record
// curl -X PUT localhost:8099/camera/name/Nikkon/quantity/15
app.put("/camera/name/:name/quantity/:quantity", function (req, res) {
  mongoose.connect(mongourl);
  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", async () => {
    const Camera = mongoose.model("camera", cameraSchema);

    try {
      const searchResult = await Camera.findOne({ name: req.params.name }).exec();

      // change phone number
      searchResult.quantity = Number(req.params.quantity);

      const update = await searchResult.save();
      console.log("Contact updated!");
      res.status(200).json(update);
    } catch (err) {
      console.error(err);
      res.status(400).json(err);
    } finally {
      db.close();
    }
  });
});

// launch the app
app.listen(process.env.PORT || 8099);
console.log("App running at localhost:8099");
