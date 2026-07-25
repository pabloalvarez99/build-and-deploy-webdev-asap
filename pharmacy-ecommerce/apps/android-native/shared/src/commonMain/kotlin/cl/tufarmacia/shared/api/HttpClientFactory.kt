package cl.tufarmacia.shared.api

import io.ktor.client.HttpClient

expect fun createPlatformHttpClient(block: io.ktor.client.HttpClientConfig<*>.() -> Unit = {}): HttpClient
