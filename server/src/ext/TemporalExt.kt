package com.artemishub.csastratos.ext

import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.*

@Suppress("SpellCheckingInspection")
fun CharSequence.toInstant(pattern: String, zone: ZoneId = ZoneId.of("UTC")): Instant =
  LocalDateTime
    .parse(this.trim(), DateTimeFormatter.ofPattern(pattern))
    .atZone(zone)
    .toInstant()

@Suppress("SpellCheckingInspection")
fun TemporalAccessor.toIsoString(): String {
  if (this is Instant) {
    return this.atZone(ZoneId.of("UTC")).toIsoString()
  }
  val fields = listOf(
    ChronoField.YEAR to "uuuu",
    ChronoField.MONTH_OF_YEAR to "-MM",
    ChronoField.DAY_OF_MONTH to "-dd",
    ChronoField.HOUR_OF_DAY to "'T'HH",
    ChronoField.MINUTE_OF_HOUR to ":mm",
    ChronoField.SECOND_OF_MINUTE to ":ss",
    ChronoField.MILLI_OF_SECOND to ".SSS'Z'"
  )
  val pattern = fields.takeWhile { (field) -> isSupported(field) }.joinToString("") { (_, pattern) -> pattern }
  return DateTimeFormatter.ofPattern(pattern).format(this)
}
