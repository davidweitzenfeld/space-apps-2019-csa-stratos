package com.artemishub.csastratos

import com.artemishub.csastratos.ext.readJson
import com.artemishub.csastratos.ext.registerSerializer
import com.artemishub.csastratos.ext.toIsoString
import com.artemishub.csastratos.models.Response
import com.artemishub.csastratos.models.SocketRequestMessage
import com.artemishub.csastratos.models.SocketResponseMessage
import com.artemishub.csastratos.models.Stratos
import com.artemishub.csastratos.services.DataReaderService
import com.artemishub.csastratos.services.atTimestampOrNull
import com.artemishub.csastratos.services.toJson
import io.ktor.application.*
import io.ktor.response.*
import io.ktor.request.*
import io.ktor.routing.*
import io.ktor.locations.*
import io.ktor.features.*
import io.ktor.http.cio.websocket.Frame
import io.ktor.jackson.jackson
import io.ktor.websocket.WebSockets
import io.ktor.websocket.webSocket
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import org.slf4j.event.*
import java.time.Instant

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

@FlowPreview
@KtorExperimentalLocationsAPI
fun Application.module() {

  install(CORS) {
    anyHost()
  }

  install(WebSockets) { }

  install(Locations) { }

  install(CallLogging) {
    level = Level.INFO
    filter { call -> call.request.path().startsWith("/") }
  }

  install(DefaultHeaders) {
    header("X-Engine", "Ktor") // will send this header with each response
  }

  install(ContentNegotiation) {
    jackson {
      registerSerializer<Instant> { it.toIsoString() }
    }
  }

  routing {

    val data = DataReaderService.get()
    val combined = DataReaderService.combineData(data)

    webSocket("/") {
      incoming.consumeAsFlow()
        .mapNotNull { it as? Frame.Text }
        .map { it.readJson<SocketRequestMessage>() }
        .map { it.process(combined) }
        .collect { outgoing.send(Frame.Text(it.toJson())) }
    }

    get<Dataset> {
      val response = Response.DatasetData(
        startTime = combined.first().missionTime,
        endTime = combined.last().missionTime,
        path = data.navigation.map { it.longitude to it.latitude }.map { it.toList() },
        navigation = data.navigation,
        environment = data.environment,
        images = data.images
      )
      call.respond(response)
    }
  }
}

fun SocketRequestMessage.process(data: List<Stratos.Data>): SocketResponseMessage = when (this) {
  is SocketRequestMessage.InstantData -> SocketResponseMessage.InstantData(data.atTimestampOrNull(instant))
}

@KtorExperimentalLocationsAPI
@Location("/datasets/{name}")
data class Dataset(val name: String)

