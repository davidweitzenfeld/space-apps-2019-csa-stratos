package com.artemishub.csastratos.models

import java.time.Instant

object Response {

  data class DatasetData(
    val startTime: Instant,
    val endTime: Instant,
    val path: List<List<Double>>,
    val navigation: List<Stratos.Navigation>,
    val environment: List<Stratos.Environment>,
    val images: List<Stratos.Image>
  )

}
