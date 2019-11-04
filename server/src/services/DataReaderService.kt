package com.artemishub.csastratos.services

import com.artemishub.csastratos.ext.*
import com.artemishub.csastratos.models.Stratos
import com.github.doyaaaaaken.kotlincsv.client.CsvFileReader
import com.github.doyaaaaaken.kotlincsv.dsl.csvReader
import com.jillesvangurp.geo.GeoGeometry.Companion.distance
import java.io.FileNotFoundException

object DataReaderService {

  private const val MISSION_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss.SSS"

  fun get(): Stratos.DataLists {
    val navigationData = readNavigationData()
    val eventData = readEventData()
    val environmentData = readEnvironmentData()
    val travelData = calculateTravelData(navigationData)
    val imageData = getImageData(eventData)

    return Stratos.DataLists(navigationData, travelData, eventData, imageData, environmentData)
  }

  fun combineData(data: Stratos.DataLists) = data.navigation
    .map { navigation ->
      val event = data.event.atTimestampOrNull(navigation.missionTime)
      val environment = data.environment.atTimestampOrNull(navigation.missionTime)
      val travel = data.travel.atTimestamp(navigation.missionTime)
      val images = listOfNotNull(
        data.images.indexAtTimestampOrNull(navigation.missionTime) { it.camera == Stratos.Image.Camera.HORIZON },
        data.images.indexAtTimestampOrNull(navigation.missionTime) { it.camera == Stratos.Image.Camera.NADIR }
      )
      return@map Stratos.Data(navigation.missionTime, navigation, travel, event, images, environment)
    }

  private fun calculateTravelData(navigationData: List<Stratos.Navigation>): List<Stratos.Travel> {
    val origin = navigationData.first()
    return navigationData.asSequence()
      .zipWithNext()
      .mapAndFold(0.0) { acc, (curr, next) ->
        val travel = Stratos.Travel(
          missionTime = curr.missionTime,
          distanceFromOrigin = distance(origin.latitude, origin.longitude, curr.latitude, curr.longitude),
          distanceTravelled = acc + distance(curr.latitude, curr.longitude, next.latitude, next.longitude)
        )
        return@mapAndFold MapAndFold(travel, travel.distanceTravelled)
      }
      .toList()
  }

  private fun getImageData(eventData: List<Stratos.Event>): List<Stratos.Image> =
    eventData.asSequence()
      .mapNotNull { event ->
        when {
          event.message.contains("Requesting image from NAVEM") -> Stratos.Image.Camera.HORIZON to event
          event.message.contains("Taking onboard image") -> Stratos.Image.Camera.NADIR to event
          else -> null
        }
      }
      .map { (camera, event) -> Triple(camera, event.message.split("/").last(), event) }
      .map { (camera, file, event) ->
        val imagePath = when (camera) {
          Stratos.Image.Camera.NADIR -> "Stratos_DataSet/TIMMINS2018/CDH/CAM1-NADIR/${file}"
          Stratos.Image.Camera.HORIZON -> "Stratos_DataSet/TIMMINS2018/CDH/CAM2-HOR/${file}"
        }
        return@map Triple(camera, imagePath, event)
      }
      .mapNotNull { (camera, imagePath, event) -> resourceAsBase64(imagePath)?.let { Stratos.Image(event.missionTime, camera, it) } }
      .toList()

  private fun readNavigationData(): List<Stratos.Navigation> {
    return readFile("Stratos_DataSet/TIMMINS2018/NAVEM/swnav_pos0.txt") {
      Stratos.Navigation(
        missionTime = it[1].toInstant(MISSION_TIME_FORMAT),
        longitude = it[5].toDouble(),
        latitude = it[4].toDouble(),
        altitude = it[6].toDouble()
      )
    }
  }

  private fun readEventData(): List<Stratos.Event> {
    return readFile("Stratos_DataSet/TIMMINS2018/CDH/HKP/swcdh_events.txt") {
      Stratos.Event(
        missionTime = it[1].toInstant(MISSION_TIME_FORMAT),
        message = it[4]
      )
    }
  }

  private fun readEnvironmentData(): List<Stratos.Environment> {
    return readFile("Stratos_DataSet/TIMMINS2018/NAVEM/swem_em0.txt") {
      Stratos.Environment(
        missionTime = it[1].toInstant(MISSION_TIME_FORMAT),
        internalTemperature = it[4].toDouble(),
        externalTemperature = it[5].toDouble(),
        relativeHumidity = it[6].toDouble(),
        externalPressure = it[7].toDouble(),
        dewPoint = it[8].toDouble()
      )
    }
  }

  private fun <T> readFile(path: String, hasHeader: Boolean = true, transform: (List<String>) -> T): List<T> =
    resourceAsCsvReader(path) {
      readAllAsSequence().drop(if (hasHeader) 1 else 0).map(transform).toList()
    }


  private fun <T> resourceAsCsvReader(path: String, read: CsvFileReader.() -> T): T =
    resourceAsStream(path)?.let { stream -> csvReader() { escapeChar = '\\' }.open(stream, read) }
      ?: throw FileNotFoundException(path)

}
