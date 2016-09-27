# pebble-generic-weather

Library for easy fetching of weather data from various providers.

Includes a simple test app as a proof of concept usage of a weather C API.

![basalt](screenshots/basalt.png)

> This library is a fork of the excellent [owm-weather](https://github.com/pebble-hacks/owm-weather) one.
> A lot of code has not been changed or just a little.
> All the credits go to @C-D-Lewis @cat-haines and @Katharine ! Thanks for your work

## How to use

* Run `pebble package install pebble-generic-weather`.

* Require `pebble-generic-weather` in your your `app.js` file, and then instantiate an GenericWeather object.

```
var GenericWeather = require('pebble-generic-weather');
var genericWeather = new GenericWeather();
```

* Call `genericWeather.appMessageHandler()` in an `appmessage` handler so that it can message the C side.

```
Pebble.addEventListener('appmessage', function(e) {
  genericWeather.appMessageHandler(e);
});
```

* Include the library in any C files that will use it:

```
#include <pebble-generic-weather/pebble-generic-weather.h>
```

* Include the [pebble-events](https://www.npmjs.com/package/pebble-events) library in your main file
so you can initialise it:

```
#include <pebble-events/pebble-events.h>
```

* Call `generic_weather_init()` to initialize the library when your app starts.

* Call `generic_weather_set_provider(GenericWeatherProviderXXX)` to configure your provider.

* Call `generic_weather_set_api_key("myapikey")` to configure your api key for the provider.

* Call `generic_weather_set_feels_like(true || false)` to configure whether or not to use "feels like" temperature if available.

* Call `events_app_message_open()` after `generic_weather_init` and any other libraries you need to init.

* Call `generic_weather_fetch()` after PebbleKit JS is ready, and supply a suitable
  callback for events.

That's it! When the fetch returns (successful or not), the callback will be called with a `GenericWeatherInfo` object for you to extract data from.

## Documentation

Read `include/pebble-generic-weather.h` for function and `enum` documentation.

## Providers supported

* [OpenWeatherMap](http://home.openweathermap.org)

* [WeatherUnderGround](https://www.wunderground.com)

* [Dark Sky](https://darksky.net) (formally known as Forecast.io)

## Data returned

**Available now**

* Description, temperature in K/C/F, location name, condition code, day/night status, sunrise/sunset


