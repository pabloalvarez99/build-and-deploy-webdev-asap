package cl.tufarmacia.shared.auth

import cl.tufarmacia.shared.api.TokenProvider
import cl.tufarmacia.shared.api.TuFarmaciaApi
import cl.tufarmacia.shared.model.AuthUser
import cl.tufarmacia.shared.model.SessionTokens
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
            // try refresh once
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
        return tokens
    }
}
