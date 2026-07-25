package cl.tufarmacia.app.data.auth

import cl.tufarmacia.app.data.api.TokenProvider
import cl.tufarmacia.app.data.api.TuFarmaciaApi
import cl.tufarmacia.app.data.model.AuthUser
import cl.tufarmacia.app.data.model.SessionTokens
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

interface SessionStore {
    suspend fun load(): SessionTokens?
    suspend fun save(tokens: SessionTokens)
    suspend fun clear()
}

class SessionRepository(
    private val authApi: FirebaseAuthApi,
    private val store: SessionStore,
    private val apiFactory: (TokenProvider) -> TuFarmaciaApi,
) {
    private val mutex = Mutex()
    private var cached: SessionTokens? = null
    private var cachedUser: AuthUser? = null

    val tokenProvider = TokenProvider {
        ensureFreshToken()?.idToken
    }

    fun api(): TuFarmaciaApi = apiFactory(tokenProvider)

    suspend fun restore(): AuthUser? = mutex.withLock {
        val tokens = store.load() ?: return null
        cached = tokens
        try {
            val me = apiFactory(tokenProvider).me()
            cachedUser = me.user
            me.user
        } catch (_: Exception) {
            try {
                val refreshed = authApi.refreshIdToken(tokens.refreshToken)
                cached = refreshed
                store.save(refreshed)
                val me = apiFactory(tokenProvider).me()
                cachedUser = me.user
                me.user
            } catch (_: Exception) {
                store.clear()
                cached = null
                cachedUser = null
                null
            }
        }
    }

    suspend fun login(email: String, password: String): AuthUser = mutex.withLock {
        val tokens = authApi.signInWithEmail(email, password)
        cached = tokens
        store.save(tokens)
        val me = apiFactory(tokenProvider).me()
        cachedUser = me.user
        me.user
    }

    suspend fun logout() = mutex.withLock {
        store.clear()
        cached = null
        cachedUser = null
    }

    fun currentUser(): AuthUser? = cachedUser

    private suspend fun ensureFreshToken(): SessionTokens? {
        val tokens = cached ?: store.load()?.also { cached = it } ?: return null
        // Proactively refresh if ID token payload is expired (JWT exp)
        val exp = decodeJwtExp(tokens.idToken)
        val now = System.currentTimeMillis() / 1000
        if (exp != null && exp < now + 60) {
            return try {
                val refreshed = authApi.refreshIdToken(tokens.refreshToken)
                cached = refreshed
                store.save(refreshed)
                refreshed
            } catch (_: Exception) {
                tokens
            }
        }
        return tokens
    }

    private fun decodeJwtExp(jwt: String): Long? {
        return try {
            val parts = jwt.split(".")
            if (parts.size < 2) return null
            val payload = parts[1]
                .replace('-', '+')
                .replace('_', '/')
            val padded = payload + "=".repeat((4 - payload.length % 4) % 4)
            val json = String(android.util.Base64.decode(padded, android.util.Base64.DEFAULT))
            val expMatch = Regex("\"exp\"\\s*:\\s*(\\d+)").find(json)
            expMatch?.groupValues?.get(1)?.toLongOrNull()
        } catch (_: Exception) {
            null
        }
    }
}
