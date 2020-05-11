import express = require("express")

// Create a new express application instance
const app = express();

app.get('/', function (_, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});