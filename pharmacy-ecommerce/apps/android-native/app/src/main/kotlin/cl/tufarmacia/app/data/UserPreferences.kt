package cl.tufarmacia.app.data

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.userPrefsDataStore by preferencesDataStore(name = "user_prefs")

enum class FontScalePref(val key: String, val multiplier: Float, val label: String) {
    Compact("compact", 0.92f, "Compacto"),
    Normal("normal", 1.0f, "Normal"),
    Large("large", 1.12f, "Grande"),
    ;

    companion object {
        fun fromKey(key: String?): FontScalePref =
            entries.find { it.key == key } ?: Normal
    }
}

data class UserPrefs(
    val fontScale: FontScalePref = FontScalePref.Normal,
    val highContrast: Boolean = false,
)

class UserPreferencesRepository(private val context: Context) {
    private val fontKey = stringPreferencesKey("font_scale")
    private val contrastKey = booleanPreferencesKey("high_contrast")

    val prefs: Flow<UserPrefs> = context.userPrefsDataStore.data.map { p ->
        UserPrefs(
            fontScale = FontScalePref.fromKey(p[fontKey]),
            highContrast = p[contrastKey] ?: false,
        )
    }

    suspend fun setFontScale(scale: FontScalePref) {
        context.userPrefsDataStore.edit { it[fontKey] = scale.key }
    }

    suspend fun setHighContrast(enabled: Boolean) {
        context.userPrefsDataStore.edit { it[contrastKey] = enabled }
    }
}
