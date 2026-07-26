package cl.tufarmacia.app.data.auth

import cl.tufarmacia.app.data.api.ApiException
import cl.tufarmacia.app.data.model.FirebaseRefreshResponse
import cl.tufarmacia.app.data.model.FirebaseSignInResponse
import cl.tufarmacia.app.data.model.SessionTokens
import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
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
 * Firebase Auth via Identity Toolkit REST (pure Android, no google-services.json required for email login).
 * iOS will call the same endpoints with Swift URLSession.
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

    /** Sends password-reset email via Firebase Identity Toolkit. */
    suspend fun sendPasswordResetEmail(email: String) {
        val response = httpClient.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=$apiKey",
        ) {
            contentType(ContentType.Application.Json)
            setBody(
                buildJsonObject {
                    put("requestType", "PASSWORD_RESET")
                    put("email", email.trim())
                },
            )
        }
        val bodyText = response.bodyAsText()
        if (!response.status.isSuccess()) {
            val body = runCatching { json.decodeFromString<FirebaseSignInResponse>(bodyText) }.getOrNull()
            val msg = body?.error?.message ?: bodyText
            throw ApiException(friendlyAuthMessage(msg), statusCode = response.status.value)
        }
    }

    /** Updates Firebase displayName; requires valid idToken. */
    suspend fun updateDisplayName(idToken: String, displayName: String) {
        val response = httpClient.post(
            "https://identitytoolkit.googleapis.com/v1/accounts:update?key=$apiKey",
        ) {
            contentType(ContentType.Application.Json)
            setBody(
                buildJsonObject {
                    put("idToken", idToken)
                    put("displayName", displayName.trim())
                    put("returnSecureToken", false)
                },
            )
        }
        if (!response.status.isSuccess()) {
            val bodyText = response.bodyAsText()
            val body = runCatching { json.decodeFromString<FirebaseSignInResponse>(bodyText) }.getOrNull()
            throw ApiException(
                body?.error?.message ?: "No se pudo actualizar el nombre",
                statusCode = response.status.value,
            )
        }
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
        code.contains("EMAIL_NOT_FOUND", ignoreCase = true) ->
            "No hay cuenta con ese correo"
        code.contains("INVALID_EMAIL", ignoreCase = true) ->
            "Correo inválido"
        else -> code
    }

    companion object {
        fun defaultClient(): HttpClient = HttpClient(OkHttp) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true; isLenient = true })
            }
        }
    }
}
