const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();

// Define the storage location for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "file_upload");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/view", (req, res) => {
  fs.readFile("message.txt", "utf8", (err, messageData) => {
    if (err) {
      console.error("Error reading message file:", err);
      messageData = "No content found";
    }

    fs.readdir("file_upload", (err, files) => {
      if (err) {
        console.error("Error reading files directory:", err);
        files = [];
      }

      // Send both message data and file names to the view
      res.render("view", {
        message: messageData,
        files: files,
      });
    });
  });
});

app.get("/edit", (req, res) => {
  res.render("edit");
});

app.post("/upload/message", (req, res) => {
  const { message } = req.body;

  // Write message content to a file
  fs.writeFile("message.txt", message, (err) => {
    if (err) throw err;
    res.redirect("/view");
  });
});

app.post("/upload/file", (req, res) => {
  // Delete previous file if it exists
  fs.readdir("file_upload", (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
    } else {
      files.forEach((file) => {
        fs.unlink(path.join("file_upload", file), (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      });
    }

    // Proceed with file upload
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).send("Error uploading file");
      }
      res.redirect("/view");
    });
  });
});

app.get("/files/:filename", (req, res) => {
  const file = path.join("file_upload", req.params.filename);
  try {
    if (!fs.existsSync(file)) {
      return res.status(404).send("File Not Found");
    }
  } catch (err) {
    console.error("Error checking file existence:", err);
    return res.status(500).send("Internal Server Error");
  }
  res.download(file);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is listening on 0.0.0.0 at ${port}`);
});
