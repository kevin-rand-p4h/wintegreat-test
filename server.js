var http = require('http'),
  express = require('express'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  errorhandler = require('errorhandler');


const listEndpoints = require('express-list-endpoints')
// Create global app object
var app = express();

var whitelist = ['localhost', '127.0.0.1', 'www.hubspot.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions));
// Enable CORS from client-side
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://www.hubspot.com');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '5mb' }));

// app.use(require('method-override')());
// app.use(express.static(__dirname + '/public'));

app.use(require('./routes'));
/// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
// if (!isProduction) {
//   app.use(function(err, req, res, next) {
//     console.log(err.stack);

//     res.status(err.status || 500);

//     res.json({'errors': {
//       message: err.message,
//       error: err
//     }});
//   });
// }

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    'errors': {
      message: err.message,
      error: {}
    }
  });
});


// FOR MAILING


// finally, let's start our server...
var server = app.listen(process.env.PORT || 3000, function () {
  console.log('Listening on port ' + server.address().port);
  console.log(listEndpoints(app));
});
