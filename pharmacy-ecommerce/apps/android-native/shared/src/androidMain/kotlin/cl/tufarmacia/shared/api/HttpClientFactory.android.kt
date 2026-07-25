package cl.tufarmacia.shared.api

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp

actual fun createPlatformHttpClient(block: io.ktor.client.HttpClientConfig<*>.() -> Unit): HttpClient {
    return HttpClient(OkHttp, block)
}
