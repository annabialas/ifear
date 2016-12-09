// load modules
var express = require('express');
var hbs = require('express-handlebars');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');

// load .env
require('dotenv').config();

// create app
var app = express();
var PORT = process.env.PORT || 8080;

// require model Line
// temporarily...
var User = require('./models/user');

// set cookieSecret in .env
app.use(session({
    secret: process.env.cookieSecret,
    name: 'xyz',
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    resave: false,
    saveUninitialized: false,
    // add session store
    store: new MongoStore({
      url: process.env.DB_URL
    })
  }
));

// attach req.session.flash to res.locals
app.use(function(req, res, next) {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// init handlebars
app.engine('handlebars', hbs({defaultLayout: 'base'}));
app.set('view engine', 'handlebars');

// add form fields to req.body, i.e. req.body.username
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// connect to database
mongoose.connect(process.env.DB_URL);

var options = {};
var auth = require('./lib/auth')(app, options);
auth.init(); // setup middleware
auth.registerRoutes();

app.use(express.static('public'));

// app.get('/', function(req, res){
//   res.render('index');
// });


// home page
app.get('/', function(req, res){

  var query = {};

  User.find(query, function(err, data){
    var pageData = {
      users: data
    };

    res.render('index', pageData);
  });
});

// api
// app.get('/api', function(req, res){
//   var query = {};

//   Line.find(query, function(err, data){
//       var apiData = data.map(function(item) {
//           return {
//               "id": item._id,
//               "line": item.text
//           }
//       })
//       res.json(apiData); 
//   });

// });


app.delete('/api/users/lines/:id', function(req, res){
  // User.findOneAndRemove({ _id: req.params.id }, function(err){
  //   if (err) {
  //     console.log(err);
  //   }

  //   res.send();
  // });

  User.findOneAndUpdate(req.user._id,
  {
    $pull: { lines: { _id: req.params.id }}
  },
  {"new": true},
  function(err, doc){
    if (err) {
     console.log(err)
    }
    res.send('deleted!')
  });

});

var renderSubmit = require('./routes/submit');
app.use('/submit', renderSubmit);

// var renderMyPosts = require('./routes/my-posts');
// app.use('/my-posts', renderMyPosts);

// start server
app.listen(PORT, function() {
  console.log('listening on port ', PORT);
});
