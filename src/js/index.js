var SunCalc = require('suncalc');

var GenericWeather = function() {
  
  this._apiKey    = '';
  this._provider  = GenericWeather.ProviderOpenWeatherMap;
  this._feelsLike = false;

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
    Wind            : 9,
    Unknown         : 1000,
  };

  this._xhrWrapper = function(url, type, callback, customHeaderKey, customHeaderValue) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      callback(xhr);
    };
    xhr.open(type, url);
    
    if (customHeaderKey && customHeaderValue) {
      try {xhr.setRequestHeader(customHeaderKey, customHeaderValue);} catch(e){}
    }
    
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

        // console.log(req.response);

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
          'GW_DAY': (json.dt > json.sys.sunrise && json.dt < json.sys.sunset) ? 1 : 0,
          'GW_CONDITIONCODE': condition,
          'GW_SUNRISE': json.sys.sunrise,
          'GW_SUNSET': json.sys.sunset
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

        // console.log(req.response);

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

        var times = SunCalc.getTimes(new Date(), coords.latitude, coords.longitude);
        var temp = this._feelsLike ? parseFloat(json.current_observation.feelslike_c) : json.current_observation.temp_c;

        Pebble.sendAppMessage({
          'GW_REPLY': 1,
          'GW_TEMPK': Math.round(temp + 273.15),
          'GW_NAME': json.current_observation.display_location.city,
          'GW_DESCRIPTION': json.current_observation.weather,
          'GW_DAY': json.current_observation.icon_url.indexOf("nt_") == -1 ? 1 : 0,
          'GW_CONDITIONCODE':condition,
          'GW_SUNRISE': Math.round(+times.sunrise/1000),
          'GW_SUNSET': Math.round(+times.sunset/1000)
        });
      } else {
        console.log('weather: Error fetching data (HTTP Status: ' + req.status + ')');
        Pebble.sendAppMessage({ 'GW_BADKEY': 1 });
      }
    }.bind(this));
  };

  this._getWeatherF_IO = function(coords) {
    var url = 'https://api.forecast.io/forecast/' + this._apiKey + '/'
      + coords.latitude + ',' + coords.longitude + '?exclude=minutely,hourly,alerts,flags&units=si';

    console.log('weather: Contacting forecast.io...');
    // console.log(url);

    this._xhrWrapper(url, 'GET', function(req) {
      console.log('weather: Got API response!');
      if(req.status == 200) {
        var json = JSON.parse(req.response);

        // console.log(req.response);

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

        var temp = this._feelsLike ? json.currently.apparentTemperature : json.currently.temperature;

        var message = {
          'GW_REPLY': 1,
          'GW_TEMPK': Math.round(temp + 273.15),
          'GW_DESCRIPTION': json.currently.summary,
          'GW_DAY': (json.currently.time > json.daily.data[0].sunriseTime && json.currently.time < json.daily.data[0].sunsetTime) ? 1 : 0,
          'GW_CONDITIONCODE':condition,
          'GW_SUNRISE': json.daily.data[0].sunriseTime,
          'GW_SUNSET': json.daily.data[0].sunsetTime
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
        }.bind(this), 'User-Agent', 'Pebble Generic Weather');

      } else {
        console.log('weather: Error fetching data (HTTP Status: ' + req.status + ')');
        Pebble.sendAppMessage({ 'GW_BADKEY': 1 });
      }
    }.bind(this));
  };

  this._getWeatherYahoo = function(coords) {
    var url = 'https://query.yahooapis.com/v1/public/yql?q=select astronomy, location.city, item.condition from weather.forecast where woeid in '+
            '(select woeid from geo.places(1) where text=\'(' + coords.latitude+','+coords.longitude+')\') and u=\'c\'&format=json';

    console.log('weather: Contacting Yahoo! Weather...');
    // console.log(url);

    this._xhrWrapper(encodeURI(url), 'GET', function(req) {
      console.log('weather: Got API response!');
      if(req.status == 200) {
        var json = JSON.parse(req.response);

        // console.log(req.response);

        var condition = parseInt(json.query.results.channel.item.condition.code);
        switch(condition){
          case 31 :
          case 32 :
          case 33 :
          case 34 :
          case 36 :
            condition = conditions.ClearSky;  break;
          case 29 :
          case 30 :
          case 44 :
            condition = conditions.FewClouds;  break;
          case 26 :
          case 27 :
          case 28 :
            condition = conditions.BrokenClouds;  break;
          case 8 :
          case 9 :
          case 11 :
          case 12 :
          case 40 :
            condition = conditions.ShowerRain;  break;
          case 6 :
          case 10 :
          case 35 :
            condition = conditions.Rain; break;
          case 1 :
          case 3 :
          case 4 :
          case 37 :
          case 38 :
          case 39 :
          case 45 :
          case 47 :            
            condition = conditions.Thunderstorm; break;
          case 5 :
          case 7 :
          case 13 :
          case 14 :
          case 15 :
          case 16 :
          case 17 :
          case 18 :
          case 41 :
          case 42 :
          case 43 :
          case 46 :
            condition = conditions.Snow; break;
          case 20 :
          case 21 :
          case 22 :
            condition = conditions.Mist; break;
          case 23 :
          case 24 :
          case 25 :
            condition = conditions.Wind; break;            
          default : condition = conditions.Unknown; break;
        }
        
        var current_time = new Date();
        var sunrise_time = TimeParse(json.query.results.channel.astronomy.sunrise);
        var sunset_time = TimeParse(json.query.results.channel.astronomy.sunset);
        var is_day = (current_time >  sunrise_time && current_time < sunset_time) ? 1 : 0;
      
        Pebble.sendAppMessage({
          'GW_REPLY': 1,
          'GW_TEMPK': Math.round(parseInt(json.query.results.channel.item.condition.temp) + 273.15),
          'GW_NAME': json.query.results.channel.location.city,
          'GW_DESCRIPTION': json.query.results.channel.item.condition.text,
          'GW_DAY': is_day ? 1 : 0,
          'GW_CONDITIONCODE': condition,
          'GW_SUNRISE': json.query.results.channel.astronomy.sunrise,
          'GW_SUNSET': json.query.results.channel.astronomy.sunset
        });
      } else {
        console.log('weather: Error fetching data (HTTP Status: ' + req.status + ')');
        Pebble.sendAppMessage({ 'GW_BADKEY': 1 });
      }
    }.bind(this));
  };

  function TimeParse(str) {
    var buff = str.split(" ");
    if(buff.length == 2) {
      var time = buff[0].split(":");
      if(buff[1].toLowerCase() == "pm" && parseInt(time[0]) != 12) {
        time[0] = parseInt(time[0]) + 12;
      }
    }

    var date = new Date();
    date.setHours(time[0]);
    date.setMinutes(time[1]);

    return date;
  }

  this._getWeather = function(coords) {
    switch(this._provider){
      case GenericWeather.ProviderOpenWeatherMap :      this._getWeatherOWM(coords);  break;
      case GenericWeather.ProviderWeatherUnderground :  this._getWeatherWU(coords);   break;
      case GenericWeather.ProviderForecastIo :          this._getWeatherF_IO(coords); break;
      case GenericWeather.ProviderYahooWeather :        this._getWeatherYahoo(coords); break;
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

      if(options && 'feelsLike' in options){
        this._feelsLike = options['feelsLike'];
      }
      else if(dict.payload && 'GW_FEELS_LIKE' in dict.payload){
        this._feelsLike = dict.payload['GW_FEELS_LIKE'] > 0;
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
GenericWeather.ProviderYahooWeather         = 3;

module.exports = GenericWeather;
