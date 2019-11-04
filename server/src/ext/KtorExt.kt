package com.artemishub.csastratos.ext

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import io.ktor.http.cio.websocket.Frame
import io.ktor.http.cio.websocket.readText
import java.time.Instant

inline fun <reified T : Any> Frame.Text.readJson(): T = with(ObjectMapper()) {
  registerKotlinModule()
  registerDeserializer { Instant.parse(it) }
  readValue(readText(), T::class.java)
}
