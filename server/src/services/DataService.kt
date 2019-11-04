package com.artemishub.csastratos.services

import com.artemishub.csastratos.ext.registerSerializer
import com.artemishub.csastratos.ext.toIsoString
import com.artemishub.csastratos.models.Stratos
import com.fasterxml.jackson.databind.ObjectMapper
import java.time.Instant

fun <T : Stratos.Point> List<T>.atTimestamp(timestamp: Instant): T = atTimestampOrNull(timestamp)!!

fun <T : Stratos.Point> List<T>.atTimestampOrNull(timestamp: Instant): T? = asSequence()
  .takeWhile { it.missionTime.isBefore(timestamp) || it.missionTime == timestamp }
  .lastOrNull()

fun <T : Stratos.Point> List<T>.indexAtTimestampOrNull(timestamp: Instant, filter: (T) -> Boolean = { true }): Int? = asSequence()
  .takeWhile { it.missionTime.isBefore(timestamp) || it.missionTime == timestamp }
  .mapIndexedNotNull { index, element -> if (filter(element)) index else null }
  .lastOrNull()

fun Any.toJson(): String = with(ObjectMapper()) {
  registerSerializer<Instant> { it.toIsoString() }
  writeValueAsString(this@toJson)
}
