package com.artemishub.csastratos.models

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import java.time.Instant

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "type"
)
sealed class SocketRequestMessage(open val type: Type) {

  @JsonTypeName("INSTANT_DATA")
  data class InstantData(val instant: Instant) : SocketRequestMessage(Type.INSTANT_DATA)

  enum class Type {
    INSTANT_DATA,
  }
}

sealed class SocketResponseMessage(open val type: Type) {

  data class InstantData(val data: Stratos.Data?) : SocketResponseMessage(Type.INSTANT_DATA)

  enum class Type {
    INSTANT_DATA,
  }
}
