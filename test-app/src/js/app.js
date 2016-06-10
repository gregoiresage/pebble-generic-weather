var GenericWeather = require('pebble-generic-weather');

var genericWeather = new GenericWeather();

Pebble.addEventListener('ready', function(e) {
  console.log('PebbleKit JS ready!');
});

Pebble.addEventListener('appmessage', function(e) {
  console.log('appmessage: ' + JSON.stringify(e.payload));
  genericWeather.appMessageHandler(e);
});
