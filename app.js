/**
 * Module dependencies.
 */

var express = require('express')
  , Resource = require('express-resource')
  , expose = require('express-expose')
  , Database = require('./lib/db')
  , main = require('./controllers/main')
  , stylus = require('stylus')
  , nib = require('nib');

var app = module.exports = express.createServer();

// stylus compiler

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .include(nib.path);
}

// normalize database on boot

function normalize() {
  var month
    , ids;

  // settings
  db.config = db.config || {};

  // months
  for (var i = 0; i < 12; ++i) {
    month = db.months[i] = db.months[i] || { items: {} };
    ids = Object.keys(month.items);
    // dates
    ids.forEach(function(id){
      var item = month.items[id];
      item.date = new Date(item.date);
      item.type = item.type || 'debit';
    });
  }

  app.locals({ config: db.config });
}

// configuration

app.configure(function(){
  app.set('title', 'Financial Management');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('  \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-time\033[0m'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.helpers(require('./lib/helpers'));
});

// app.configure('development', function(){
//   db = new Database('/tmp/finance.db');
//   app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
// });

app.configure('development', function(){
  app.set('title', "Finances d'Olivier et Virginie");
  app.enable('cache views');
  db = new Database('/Users/ovaillancourt/Dropbox/Finances-2012');
  app.use(express.errorHandler({ dumpExceptions: true }));
});

app.configure(function(){
  db.load(normalize);
});

// routing

app.get('/', main.index);
app.put('/config', main.updateConfig);
var month = app.resource('month', require('./controllers/month'));
var items = app.resource('items', require('./controllers/item'));
month.add(items);

// listen

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
console.log('  database: %s', db.path);
