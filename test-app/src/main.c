#include <pebble.h>

#include <pebble-generic-weather/pebble-generic-weather.h>
#include <pebble-events/pebble-events.h>

static Window *s_window;
static TextLayer *s_text_layer;

static void weather_callback(GenericWeatherInfo *info, GenericWeatherStatus status) {
  switch(status) {
    case GenericWeatherStatusAvailable:
    {
      static char s_buffer[256];
      snprintf(s_buffer, sizeof(s_buffer),
        "Temperature (K/C/F): %d/%d/%d\n\nName:\n%s\n\nDescription:\n%s",
        info->temp_k, info->temp_c, info->temp_f, info->name, info->description);
      text_layer_set_text(s_text_layer, s_buffer);
    }
      break;
    case GenericWeatherStatusNotYetFetched:
      text_layer_set_text(s_text_layer, "GenericWeatherStatusNotYetFetched");
      break;
    case GenericWeatherStatusBluetoothDisconnected:
      text_layer_set_text(s_text_layer, "GenericWeatherStatusBluetoothDisconnected");
      break;
    case GenericWeatherStatusPending:
      text_layer_set_text(s_text_layer, "GenericWeatherStatusPending");
      break;
    case GenericWeatherStatusFailed:
      text_layer_set_text(s_text_layer, "GenericWeatherStatusFailed");
      break;
    case GenericWeatherStatusBadKey:
      text_layer_set_text(s_text_layer, "GenericWeatherStatusBadKey");
      break;
    case GenericWeatherStatusLocationUnavailable:
      text_layer_set_text(s_text_layer, "GenericWeatherStatusLocationUnavailable");
      break;
  }
}

static void js_ready_handler(void *context) {
  generic_weather_fetch(weather_callback);
}

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  s_text_layer = text_layer_create(PBL_IF_ROUND_ELSE(
    grect_inset(bounds, GEdgeInsets(20, 0, 0, 0)),
    bounds));
  text_layer_set_text(s_text_layer, "Ready.");
  text_layer_set_text_alignment(s_text_layer, PBL_IF_ROUND_ELSE(GTextAlignmentCenter, GTextAlignmentLeft));
  layer_add_child(window_layer, text_layer_get_layer(s_text_layer));
}

static void window_unload(Window *window) {
  text_layer_destroy(s_text_layer);

  window_destroy(window);
}

static void init() {
  s_window = window_create();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  window_stack_push(s_window, true);

  // Replace this with your own API key from OpenWeatherMap.org
  char *api_key = "123456123456123456";
  generic_weather_init();
  generic_weather_set_api_key(api_key);
  generic_weather_set_provider(GenericWeatherProviderOpenWeatherMap);
  events_app_message_open();

  app_timer_register(3000, js_ready_handler, NULL);
}

static void deinit() {
  generic_weather_deinit();
}

int main() {
  init();
  app_event_loop();
  deinit();
}
