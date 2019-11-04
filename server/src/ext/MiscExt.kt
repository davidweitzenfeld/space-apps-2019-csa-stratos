package com.artemishub.csastratos.ext

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.*
import com.fasterxml.jackson.databind.module.SimpleModule
import java.io.InputStream
import java.util.*

fun Any.resourceAsStream(path: String): InputStream? = this::class.java.classLoader.getResourceAsStream(path)

fun Any.resourceAsBase64(path: String): String? = resourceAsStream(path)?.asBase64()

fun InputStream.asBase64(): String = Base64.getEncoder().encodeToString(this.readAllBytes())

fun ObjectMapper.registerSimpleModule(apply: SimpleModule.() -> Unit) {
  val module = SimpleModule()
  module.apply()
  registerModule(module)
}

inline fun <reified T : Any> ObjectMapper.registerSerializer(crossinline serialize: (T) -> String) {
  val serializer = object : JsonSerializer<T>() {
    override fun serialize(value: T, gen: JsonGenerator, serializers: SerializerProvider) =
      gen.writeString(serialize(value))
  }
  registerSimpleModule { addSerializer(T::class.java, serializer) }
}

inline fun <reified T : Any> ObjectMapper.registerDeserializer(crossinline deserialize: (String) -> T) {
  val deserializer = object : JsonDeserializer<T>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext) = deserialize(p.valueAsString)
  }
  registerSimpleModule { addDeserializer(T::class.java, deserializer) }
}

inline fun <T, A, M> Sequence<T>.mapAndFold(initial: A, crossinline operation: (acc: A, T) -> MapAndFold<M, A>): Sequence<M> {
  var accumulator = initial
  return map {
    val result = operation(accumulator, it)
    accumulator = result.accumulator
    return@map result.item
  }
}

data class MapAndFold<T, A>(val item: T, val accumulator: A)


