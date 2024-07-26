const express = require("express");
const bodyParser = require("body-parser");

let text = '';
let file = {
  name: null,
  content: null
};
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.get("/", (_, res) => {
  res.render("index");
});

app.get("/view", (_, res) => {
  res.render("view", {
    message: text,
    filename: file.name,
  });
});

app.get("/edit", (_, res) => {
  res.render("edit");
});

app.post("/upload/message", (req, res) => {
  const { message } = req.body;

  text = message;
  res.redirect("/view");
});

app.post("/upload/:filename/:filesize", (req, res) => {
  const { filename, filesize } = req.params;
  file.name = filename;
  let data = [];
  req.on('data', chunk => {
    data.push(chunk);
  });

  req.on('end', () => {
    file.content = Buffer.concat(data);
    if (file.content.length == filesize) {
      res.status(200).send('File uploaded successfully');
    } else {
      res.status(400).send('File size does not match');
    }
  });
});

app.get("/download_file", (_, res) => {
  if (file.content) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename=' + file.name);
    res.end(file.content);
  } else {
    res.status(404).send('File not found');
  }
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is listening on 0.0.0.0 at ${port}`);
});
