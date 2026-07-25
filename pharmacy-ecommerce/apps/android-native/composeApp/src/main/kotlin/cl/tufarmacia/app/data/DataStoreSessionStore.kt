package cl.tufarmacia.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import cl.tufarmacia.shared.auth.SessionStore
import cl.tufarmacia.shared.model.SessionTokens
import kotlinx.coroutines.flow.first

private val Context.sessionDataStore by preferencesDataStore(name = "session")

class DataStoreSessionStore(private val context: Context) : SessionStore {
    private val idTokenKey = stringPreferencesKey("id_token")
    private val refreshTokenKey = stringPreferencesKey("refresh_token")
    private val userIdKey = stringPreferencesKey("user_id")
    private val emailKey = stringPreferencesKey("email")

    override suspend fun load(): SessionTokens? {
        val prefs = context.sessionDataStore.data.first()
        val id = prefs[idTokenKey] ?: return null
        val refresh = prefs[refreshTokenKey] ?: return null
        val userId = prefs[userIdKey].orEmpty()
        val email = prefs[emailKey]
        return SessionTokens(idToken = id, refreshToken = refresh, userId = userId, email = email)
    }

    override suspend fun save(tokens: SessionTokens) {
        context.sessionDataStore.edit { prefs ->
            prefs[idTokenKey] = tokens.idToken
            prefs[refreshTokenKey] = tokens.refreshToken
            prefs[userIdKey] = tokens.userId
            if (tokens.email != null) prefs[emailKey] = tokens.email!!
        }
    }

    override suspend fun clear() {
        context.sessionDataStore.edit { it.clear() }
    }
}
