package cl.tufarmacia.app.data.api

import cl.tufarmacia.app.data.model.ApiError
import cl.tufarmacia.app.data.model.Category
import cl.tufarmacia.app.data.model.MeResponse
import cl.tufarmacia.app.data.model.PaginatedProducts
import cl.tufarmacia.app.data.model.Product
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * Android-only HTTP client for tu-farmacia.cl APIs.
 * Uses Ktor + OkHttp (standard on Android). iOS will use URLSession / Alamofire separately.
 */
class TuFarmaciaApi(
    private val baseUrl: String,
    private val tokenProvider: TokenProvider,
    private val httpClient: HttpClient = createHttpClient(baseUrl),
) {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    suspend fun listProducts(
        page: Int = 1,
        limit: Int = 20,
        search: String? = null,
        activeOnly: Boolean = true,
    ): PaginatedProducts {
        return get("/api/products") {
            parameter("page", page)
            parameter("limit", limit)
            parameter("active_only", activeOnly)
            if (!search.isNullOrBlank()) parameter("search", search)
        }
    }

    suspend fun getProduct(slug: String): Product {
        return get("/api/products/$slug")
    }

    suspend fun listCategories(): List<Category> {
        return get("/api/categories")
    }

    suspend fun me(): MeResponse {
        return get("/api/auth/me", auth = true)
    }

    private suspend inline fun <reified T> get(
        path: String,
        auth: Boolean = false,
        crossinline block: io.ktor.client.request.HttpRequestBuilder.() -> Unit = {},
    ): T {
        val response = httpClient.get(path) {
            contentType(ContentType.Application.Json)
            if (auth) {
                val token = tokenProvider.currentIdToken()
                    ?: throw ApiException("Not authenticated", statusCode = 401)
                bearerAuth(token)
            }
            block()
        }
        if (!response.status.isSuccess()) {
            val text = response.bodyAsText()
            val err = runCatching { json.decodeFromString<ApiError>(text) }.getOrNull()
            throw ApiException(
                message = err?.error ?: err?.detail ?: text.ifBlank { "HTTP ${response.status.value}" },
                statusCode = response.status.value,
                code = err?.code,
            )
        }
        return response.body()
    }

    fun close() = httpClient.close()

    companion object {
        fun createHttpClient(baseUrl: String): HttpClient = HttpClient(OkHttp) {
            expectSuccess = false
            install(ContentNegotiation) {
                json(
                    Json {
                        ignoreUnknownKeys = true
                        isLenient = true
                        coerceInputValues = true
                    }
                )
            }
            install(HttpTimeout) {
                requestTimeoutMillis = 30_000
                connectTimeoutMillis = 15_000
            }
            install(Logging) {
                level = LogLevel.INFO
            }
            defaultRequest {
                url(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
            }
        }
    }
}
