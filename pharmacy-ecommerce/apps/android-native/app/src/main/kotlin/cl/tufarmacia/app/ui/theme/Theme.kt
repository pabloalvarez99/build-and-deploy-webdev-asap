package cl.tufarmacia.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Cyan = Color(0xFF0891B2)
private val CyanDark = Color(0xFF0E7490)
private val SurfaceLight = Color(0xFFF8FAFC)

private val LightColors = lightColorScheme(
    primary = Cyan,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFCFFAFE),
    secondary = CyanDark,
    background = SurfaceLight,
    surface = Color.White,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF22D3EE),
    onPrimary = Color(0xFF083344),
    background = Color(0xFF0F172A),
    surface = Color(0xFF1E293B),
)

@Composable
fun TuFarmaciaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
