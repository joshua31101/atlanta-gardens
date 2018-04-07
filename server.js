const express = require("express"),
      bodyParser = require('body-parser'),
      app = express(),
      port = process.env.PORT || 3000;

app.use(require('./controllers'));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.listen(port, function () {
  console.log('listening on http://localhost:' + port);
});
