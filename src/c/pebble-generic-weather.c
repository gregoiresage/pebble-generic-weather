#include <pebble.h>
#include <pebble-events/pebble-events.h>

#include "pebble-generic-weather.h"

static GenericWeatherInfo *s_info;
static GenericWeatherCallback *s_callback;
static GenericWeatherStatus s_status;

static char s_api_key[33];
static GenericWeatherProvider s_provider;
static GenericWeatherCoordinates s_coordinates;

static void inbox_received_handler(DictionaryIterator *iter, void *context) {
  Tuple *reply_tuple = dict_find(iter, MESSAGE_KEY_Reply);
  if(reply_tuple) {
    Tuple *desc_tuple = dict_find(iter, MESSAGE_KEY_Description);
    strncpy(s_info->description, desc_tuple->value->cstring, GENERIC_WEATHER_BUFFER_SIZE);

    Tuple *name_tuple = dict_find(iter, MESSAGE_KEY_Name);
    strncpy(s_info->name, name_tuple->value->cstring, GENERIC_WEATHER_BUFFER_SIZE);

    Tuple *temp_tuple = dict_find(iter, MESSAGE_KEY_TempK);
    s_info->temp_k = temp_tuple->value->int32;
    s_info->temp_c = s_info->temp_k - 273;
    s_info->temp_f = ((s_info->temp_c * 9) / 5 /* *1.8 or 9/5 */) + 32;
    s_info->timestamp = time(NULL);

    Tuple *day_tuple = dict_find(iter, MESSAGE_KEY_Day);
    s_info->day = day_tuple->value->int32 == 1;

    Tuple *condition_tuple = dict_find(iter, MESSAGE_KEY_ConditionCode);
    s_info->condition = condition_tuple->value->int32;

    s_status = GenericWeatherStatusAvailable;
    app_message_deregister_callbacks();
    s_callback(s_info, s_status);
  }

  Tuple *err_tuple = dict_find(iter, MESSAGE_KEY_BadKey);
  if(err_tuple) {
    s_status = GenericWeatherStatusBadKey;
    s_callback(s_info, s_status);
  }

  err_tuple = dict_find(iter, MESSAGE_KEY_LocationUnavailable);
  if(err_tuple) {
    s_status = GenericWeatherStatusLocationUnavailable;
    s_callback(s_info, s_status);
  }
}

static void fail_and_callback() {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Failed to send request!");
  s_status = GenericWeatherStatusFailed;
  s_callback(s_info, s_status);
}

static bool fetch() {
  DictionaryIterator *out;
  AppMessageResult result = app_message_outbox_begin(&out);
  if(result != APP_MSG_OK) {
    fail_and_callback();
    return false;
  }

  dict_write_uint8(out, MESSAGE_KEY_Request, 1);

  if(strlen(s_api_key) > 0)
    dict_write_cstring(out, MESSAGE_KEY_ApiKey, s_api_key);

  if(s_provider != GenericWeatherProviderUnknown)
    dict_write_int32(out, MESSAGE_KEY_Provider, s_provider);

  if(s_coordinates.latitude != (int32_t)0xFFFFFFFF && s_coordinates.longitude != (int32_t)0xFFFFFFFF){
    dict_write_int32(out, MESSAGE_KEY_Latitude, s_coordinates.latitude);
    dict_write_int32(out, MESSAGE_KEY_Longitude, s_coordinates.longitude);
  }

  result = app_message_outbox_send();
  if(result != APP_MSG_OK) {
    fail_and_callback();
    return false;
  }

  s_status = GenericWeatherStatusPending;
  s_callback(s_info, s_status);
  return true;
}

void generic_weather_init() {
  if(s_info) {
    free(s_info);
  }

  s_info = (GenericWeatherInfo*)malloc(sizeof(GenericWeatherInfo));
  s_api_key[0] = 0;
  s_provider = GenericWeatherProviderUnknown;
  s_coordinates = GENERIC_WEATHER_GPS_LOCATION;
  s_status = GenericWeatherStatusNotYetFetched;
  events_app_message_request_inbox_size(200);
  events_app_message_request_outbox_size(100);
  events_app_message_register_inbox_received(inbox_received_handler, NULL);
}

void generic_weather_set_api_key(const char *api_key){
  if(!api_key) {
    s_api_key[0] = 0;
  }
  else {
    strncpy(s_api_key, api_key, sizeof(s_api_key));
  }
}

void generic_weather_set_provider(GenericWeatherProvider provider){
  s_provider = provider;
}

void generic_weather_set_location(const GenericWeatherCoordinates coordinates){
  s_coordinates = coordinates;
}

bool generic_weather_fetch(GenericWeatherCallback *callback) {
  if(!s_info) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Generic Weather library is not initialized!");
    return false;
  }

  if(!callback) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "GenericWeatherCallback was NULL!");
    return false;
  }

  s_callback = callback;

  if(!bluetooth_connection_service_peek()) {
    s_status = GenericWeatherStatusBluetoothDisconnected;
    s_callback(s_info, s_status);
    return false;
  }

  return fetch();
}

void generic_weather_deinit() {
  if(s_info) {
    free(s_info);
    s_info = NULL;
    s_callback = NULL;
  }
}

GenericWeatherInfo* generic_weather_peek() {
  if(!s_info) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Generic Weather library is not initialized!");
    return NULL;
  }

  return s_info;
}

void generic_weather_save(const uint32_t key){
  if(!s_info) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Generic Weather library is not initialized!");
    return;
  }

  persist_write_data(key, s_info, sizeof(GenericWeatherInfo));
}

void generic_weather_load(const uint32_t key){
  if(!s_info) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Generic Weather library is not initialized!");
    return;
  }

  if(persist_exists(key)){
    persist_read_data(key, s_info, sizeof(GenericWeatherInfo));
  }
}