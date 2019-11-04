package com.artemishub.csastratos

import io.ktor.http.*
import io.ktor.locations.*
import kotlin.test.*
import io.ktor.server.testing.*
import kotlinx.coroutines.FlowPreview

@KtorExperimentalLocationsAPI
class ApplicationTest {
  @FlowPreview
  @Test
  fun testRoot() {
    withTestApplication({ module() }) {
      handleRequest(HttpMethod.Get, "/").apply {
        assertEquals(HttpStatusCode.OK, response.status())
        assertEquals("HELLO WORLD!", response.content)
      }
    }
  }
}
