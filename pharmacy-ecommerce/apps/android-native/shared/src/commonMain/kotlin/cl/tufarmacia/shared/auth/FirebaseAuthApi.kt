package cl.tufarmacia.shared.auth

import cl.tufarmacia.shared.api.ApiException
import cl.tufarmacia.shared.api.createPlatformHttpClient
import cl.tufarmacia.shared.model.FirebaseRefreshResponse
import cl.tufarmacia.shared.model.FirebaseSignInResponse
import cl.tufarmacia.shared.model.SessionTokens
import io.ktor.client.HttpClient
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.forms.submitForm
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.Parameters
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/**
 * Firebase Auth via Identity Toolkit REST (KMP-friendly, no google-services required).
 * Same project as the web app (tu-farmacia-prod).
 */
class FirebaseAuthApi(
    private val apiKey: String,
    private val httpClient: HttpClient = defaultClient(),
) {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    suspend fun signInWithEmail(email: String, password: String): SessionTokens {
        val response = httpClient.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey"
        ) {
            contentType(ContentType.Application.Json)
            setBody(
                buildJsonObject {
                    put("email", email.trim())
                    put("password", password)
                    put("returnSecureToken", true)
                }
            )
        }
        val bodyText = response.bodyAsText()
        val body = json.decodeFromString<FirebaseSignInResponse>(bodyText)
        if (!response.status.isSuccess() || body.idToken == null || body.refreshToken == null) {
            val msg = body.error?.message ?: "Login failed"
            throw ApiException(friendlyAuthMessage(msg), statusCode = response.status.value)
        }
        return SessionTokens(
            idToken = body.idToken,
            refreshToken = body.refreshToken,
            userId = body.localId.orEmpty(),
            email = body.email,
        )
    }

    suspend fun refreshIdToken(refreshToken: String): SessionTokens {
        val response = httpClient.submitForm(
            url = "https://securetoken.googleapis.com/v1/token?key=$apiKey",
            formParameters = Parameters.build {
                append("grant_type", "refresh_token")
                append("refresh_token", refreshToken)
            },
        )
        val bodyText = response.bodyAsText()
        val body = json.decodeFromString<FirebaseRefreshResponse>(bodyText)
        if (!response.status.isSuccess() || body.idToken == null || body.refreshToken == null) {
            throw ApiException(body.error?.message ?: "Session expired", statusCode = response.status.value)
        }
        return SessionTokens(
            idToken = body.idToken,
            refreshToken = body.refreshToken,
            userId = body.userId.orEmpty(),
            email = null,
        )
    }

    fun close() = httpClient.close()

    private fun friendlyAuthMessage(code: String): String = when {
        code.contains("INVALID_LOGIN_CREDENTIALS", ignoreCase = true) ||
            code.contains("INVALID_PASSWORD", ignoreCase = true) ||
            code.contains("EMAIL_NOT_FOUND", ignoreCase = true) ->
            "Correo o contraseña incorrectos"
        code.contains("USER_DISABLED", ignoreCase = true) ->
            "Cuenta deshabilitada"
        code.contains("TOO_MANY_ATTEMPTS", ignoreCase = true) ->
            "Demasiados intentos. Espera un momento."
        else -> code
    }

    companion object {
        fun defaultClient(): HttpClient = createPlatformHttpClient {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true; isLenient = true })
            }
        }
    }
}
