var GenericWeather = function() {
  
  this._apiKey    = '';
  this._provider  = GenericWeather.ProviderOpenWeatherMap;

  var conditions = {
    ClearSky        : 0,
    FewClouds       : 1,
    ScatteredClouds : 2,
    BrokenClouds    : 3,
    ShowerRain      : 4,
    Rain            : 5,
    Thunderstorm    : 6,
    Snow            : 7,
    Mist            : 8,
    Unknown         : 1000,
  };

  this._xhrWrapper = function(url, type, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      callback(xhr);
    };
    xhr.open(type, url);
    xhr.send();
  };

  this._getWeatherOWM = function(coords) {
    var url = 'http://api.openweathermap.org/data/2.5/weather?appid=' + this._apiKey
      + '&lat=' + coords.latitude + '&lon=' + coords.longitude;

    console.log('weather: Contacting OpenWeatherMap.org...');
    // console.log(url);

    this._xhrWrapper(url, 'GET', function(req) {
      console.log('weather: Got API response!');
      if(req.status == 200) {
        var json = JSON.parse(req.response);

        var condition = parseInt(json.weather[0].icon.substring(0,2), 10);
        switch(condition){     
          case 1 :  condition = conditions.ClearSky; break;
          case 2 :  condition = conditions.FewClouds;  break;
          case 3 :  condition = conditions.ScatteredClouds;  break;
          case 4 :  condition = conditions.BrokenClouds;  break;
          case 9 :  condition = conditions.ShowerRain;  break;
          case 10 : condition = conditions.Rain; break;
          case 11 : condition = conditions.Thunderstorm; break;
          case 13 : condition = conditions.Snow; break;
          case 50 : condition = conditions.Mist; break;
          default : condition = conditions.Unknown; break;
        }
        Pebble.sendAppMessage({
          'GW_REPLY': 1,
          'GW_TEMPK': Math.round(json.main.temp),
          'GW_NAME': json.name,
          'GW_DESCRIPTION': json.weather[0].description,
          'GW_DAY': json.weather[0].icon.substring(2,3) === 'd' ? 1 : 0,
          'GW_CONDITIONCODE': condition
        });
      } else {
        console.log('weather: Error fetching data (HTTP Status: ' + req.status + ')');
        Pebble.sendAppMessage({ 'GW_BADKEY': 1 });
      }
    }.bind(this));
  };

  this._getWeatherWU = function(coords) {
    var url = 'http://api.wunderground.com/api/' + this._apiKey + '/conditions/q/'
      + coords.latitude + ',' + coords.longitude + '.json';

    console.log('weather: Contacting WUnderground.com...');
    // console.log(url);

    this._xhrWrapper(url, 'GET', function(req) {
      console.log('weather: Got API response!');
      if(req.status == 200) {
        var json = JSON.parse(req.response);

        var condition = json.current_observation.icon;
        if(condition === 'clear'){
          condition = conditions.ClearSky;
        }
        else if(condition === 'mostlyysunny' || condition === 'partlycloudy'){
          condition = conditions.FewClouds;
        }
        else if(condition === 'partlysunny' || condition === 'mostlycloudy'){
          condition = conditions.ScatteredClouds;
        }
        else if(condition === 'cloudy'){
          condition = conditions.BrokenClouds;
        }
        else if(condition === 'rain'){
          condition = conditions.Rain;
        }
        else if(condition === 'tstorm'){
          condition = conditions.Thunderstorm;
        }
        else if(condition === 'snow' || condition === 'sleet' || condition === 'flurries'){
          condition = conditions.Thunderstorm;
        }
        else if(condition === 'fog' || condition === 'hazy'){
          condition = conditions.Mist;
        }
        else {
          condition = conditions.Unknown;
        }
        Pebble.sendAppMessage({
          'GW_REPLY': 1,
          'GW_TEMPK': Math.round(json.current_observation.temp_c + 273.15),
          'GW_NAME': json.current_observation.display_location.city,
          'GW_DESCRIPTION': json.current_observation.weather,
          'GW_DAY': json.current_observation.icon_url.indexOf("nt_") == -1 ? 1 : 0,
          'GW_CONDITIONCODE':condition
        });
      } else {
        console.log('weather: Error fetching data (HTTP Status: ' + req.status + ')');
        Pebble.sendAppMessage({ 'GW_BADKEY': 1 });
      }
    }.bind(this));
  };

  this._getWeatherF_IO = function(coords) {
    var url = 'https://api.forecast.io/forecast/' + this._apiKey + '/'
      + coords.latitude + ',' + coords.longitude + '?exclude=minutely,hourly,daily,alerts,flag&units=si';

    console.log('weather: Contacting forecast.io...');
    // console.log(url);

    this._xhrWrapper(url, 'GET', function(req) {
      console.log('weather: Got API response!');
      if(req.status == 200) {
        var json = JSON.parse(req.response);

        var condition = json.currently.icon;
        if(condition === 'clear-day' || condition === 'clear-night'){
          condition = conditions.ClearSky;
        }
        else if(condition === 'partly-cloudy-day' || condition === 'partly-cloudy-night'){
          condition = conditions.FewClouds;
        }
        else if(condition === 'cloudy'){
          condition = conditions.BrokenClouds;
        }
        else if(condition === 'rain'){
          condition = conditions.Rain;
        }
        else if(condition === 'thunderstorm'){
          condition = conditions.Thunderstorm;
        }
        else if(condition === 'snow' || condition === 'sleet'){
          condition = conditions.Thunderstorm;
        }
        else if(condition === 'fog'){
          condition = conditions.Mist;
        }
        else {
          condition = conditions.Unknown;
        }

        var message = {
          'GW_REPLY': 1,
          'GW_TEMPK': Math.round(json.currently.temperature + 273.15),
          'GW_DESCRIPTION': json.currently.summary,
          'GW_DAY': json.currently.icon.indexOf("-day") > 0 ? 1 : 0,
          'GW_CONDITIONCODE':condition
        };

        url = 'http://nominatim.openstreetmap.org/reverse?format=json&lat=' + coords.latitude + '&lon=' + coords.longitude;
        this._xhrWrapper(url, 'GET', function(req) {
          if(req.status == 200) {
            var json = JSON.parse(req.response);
            var city = json.address.village || json.address.town || json.address.city || json.address.county || '';
            message['GW_NAME'] = city;
            Pebble.sendAppMessage(message);
          } else {
            // console.log('weather: Error fetching data (HTTP Status: ' + req.status + ')');
          }
        }.bind(this));

      } else {
        console.log('weather: Error fetching data (HTTP Status: ' + req.status + ')');
        Pebble.sendAppMessage({ 'GW_BADKEY': 1 });
      }
    }.bind(this));
  };

  this._getWeather = function(coords) {
    switch(this._provider){
      case GenericWeather.ProviderOpenWeatherMap :      this._getWeatherOWM(coords);  break;
      case GenericWeather.ProviderWeatherUnderground :  this._getWeatherWU(coords);   break;
      case GenericWeather.ProviderForecastIo :          this._getWeatherF_IO(coords); break;
      default: break;
    }
  };

  this._onLocationSuccess = function(pos) {
    console.log('weather: Location success');
    this._getWeather(pos.coords);
  };

  this._onLocationError = function(err) {
    console.log('generic-weather: Location error');
    Pebble.sendAppMessage({
      'GW_LOCATIONUNAVAILABLE': 1
    });
  };

  this.appMessageHandler = function(dict, options) {
    if(dict.payload['GW_REQUEST']) {

      console.log('generic-weather: Got fetch request from C app');

      this._apiKey = '';
      this._provider = GenericWeather.ProviderOpenWeatherMap;

      if(options && 'apiKey' in options){
        this._apiKey = options['apiKey'];
      }
      else if(dict.payload && 'GW_APIKEY' in dict.payload){
        this._apiKey = dict.payload['GW_APIKEY'];
      }

      if(options && 'provider' in options){
        this._provider = options['provider'];
      }
      else if(dict.payload && 'GW_PROVIDER' in dict.payload){
        this._provider = dict.payload['GW_PROVIDER'];
      }

      var location = undefined;
      if(options && 'location' in options){
        location = options['location'];
      }
      else if(dict.payload && 'GW_LATITUDE' in dict.payload && 'GW_LONGITUDE' in dict.payload){
        location = { 'latitude' : dict.payload['GW_LATITUDE'] / 100000, 'longitude' : dict.payload['GW_LONGITUDE'] / 100000};
      }

      if(location) {
        console.log('weather: use user defined location');
        this._getWeather(location);
      }
      else {
        console.log('weather: use GPS location');
        navigator.geolocation.getCurrentPosition(
          this._onLocationSuccess.bind(this),
          this._onLocationError.bind(this), {
            timeout: 15000,
            maximumAge: 60000
        });
      }
    }
  };
};

GenericWeather.ProviderOpenWeatherMap       = 0;
GenericWeather.ProviderWeatherUnderground   = 1;
GenericWeather.ProviderForecastIo           = 2;

module.exports = GenericWeather;
