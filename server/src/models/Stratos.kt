package com.artemishub.csastratos.models

import java.time.Instant

object Stratos {

  interface Point {
    val missionTime: Instant
  }

  data class DataLists(
    val navigation: List<Navigation>,
    val travel: List<Travel>,
    val event: List<Event>,
    val images: List<Image>,
    val environment: List<Environment>
  )

  data class Data(
    override val missionTime: Instant,
    val navigation: Navigation,
    val travel: Travel,
    val event: Event?,
    val images: List<Int>,
    val environment: Environment?
  ) : Point

  data class Navigation(
    override val missionTime: Instant,
    val longitude: Double,
    val latitude: Double,
    val altitude: Double
  ) : Point

  data class Travel(
    override val missionTime: Instant,
    val distanceFromOrigin: Double,
    val distanceTravelled: Double
  ) : Point

  data class Event(
    override val missionTime: Instant,
    val message: String
  ) : Point

  data class Environment(
    override val missionTime: Instant,
    val internalTemperature: Double,
    val externalTemperature: Double,
    val relativeHumidity: Double,
    val externalPressure: Double,
    val dewPoint: Double
  ) : Point

  data class Image(
    override val missionTime: Instant,
    val camera: Camera,
    val image: String
  ) : Point {
    enum class Camera {
      HORIZON,
      NADIR,
    }
  }

}
