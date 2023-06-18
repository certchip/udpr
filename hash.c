/*
#  UDPR
#  hash.c
#
#  Copyright © 2023 Certchip Corp. All rights reserved.
#  Created by GYUYOUNG KANG on 2023/04/15.
#
*/

#include <assert.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <node_api.h>


uint32_t hash_str_uint32(char *str) {
  uint32_t hash = 0x811c9dc5;
  uint32_t prime = 0x1000193;
  for(int i = 0; i < (int)strlen(str); ++i) {
	  uint8_t value = str[i];
	  hash = hash ^ value;
	  hash *= prime;
  }
  return hash;
}
uint64_t hash_str_uint64(char *str) {
  uint64_t hash = 0x811c9dc5;
  uint64_t prime = 0x1000193;
  for(int i = 0; i < (int)strlen(str); ++i) {
    uint8_t value = str[i];
    hash = hash ^ value;
    hash *= prime;
  }
  return hash;
}


static napi_value Hash32(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value hash;

  // 파라미터 개수 확인
  size_t argc = 1;
  napi_value argv[1];
  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to get callback info");
    return NULL;
  }

  // 문자열 파라미터 가져오기
  size_t strLen;
  status = napi_get_value_string_utf8(env, argv[0], NULL, 0, &strLen);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to get string argument");
    return NULL;
  }

  char* str = (char*)malloc(strLen + 1);
  status = napi_get_value_string_utf8(env, argv[0], str, strLen + 1, NULL);
  if (status != napi_ok) {
    free(str);
    napi_throw_error(env, NULL, "Failed to get string argument");
    return NULL;
  }

  char s[32];
  sprintf(s, "%d", hash_str_uint32(str));

  status = napi_create_string_utf8(env, (const char*)s, strlen(s), &hash);
  assert(status == napi_ok);
  return hash;
}

static napi_value Hash64(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value hash;

  // 파라미터 개수 확인
  size_t argc = 1;
  napi_value argv[1];
  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to get callback info");
    return NULL;
  }

  // 문자열 파라미터 가져오기
  size_t strLen;
  status = napi_get_value_string_utf8(env, argv[0], NULL, 0, &strLen);
  if (status != napi_ok) {
    napi_throw_error(env, NULL, "Failed to get string argument");
    return NULL;
  }

  char* str = (char*)malloc(strLen + 1);
  status = napi_get_value_string_utf8(env, argv[0], str, strLen + 1, NULL);
  if (status != napi_ok) {
    free(str);
    napi_throw_error(env, NULL, "Failed to get string argument");
    return NULL;
  }

  char s[32];
  sprintf(s, "%lld", hash_str_uint64(str));

  status = napi_create_string_utf8(env, (const char*)s, strlen(s), &hash);
  assert(status == napi_ok);
  return hash;
}

#define DECLARE_NAPI_METHOD(name, func)                                        \
  { name, 0, func, 0, 0, 0, napi_default, 0 }

static napi_value Init(napi_env env, napi_value exports) {
  napi_status status;

  napi_property_descriptor hash32 = DECLARE_NAPI_METHOD("hash32", Hash32);
  napi_property_descriptor hash64 = DECLARE_NAPI_METHOD("hash64", Hash64);

  status = napi_define_properties(env, exports, 1, &hash32);
  status = napi_define_properties(env, exports, 1, &hash64);

  assert(status == napi_ok);
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
