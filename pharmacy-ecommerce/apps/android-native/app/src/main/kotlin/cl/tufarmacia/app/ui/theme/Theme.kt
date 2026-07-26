package cl.tufarmacia.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import cl.tufarmacia.app.data.FontScalePref

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

/** High contrast: near-black text, pure white surfaces, strong primary. */
private val HighContrastLight = lightColorScheme(
    primary = Color(0xFF000000),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE5E5E5),
    secondary = Color(0xFF111111),
    background = Color(0xFFFFFFFF),
    surface = Color(0xFFFFFFFF),
    onBackground = Color(0xFF000000),
    onSurface = Color(0xFF000000),
    error = Color(0xFFB00020),
)

private val HighContrastDark = darkColorScheme(
    primary = Color(0xFFFFFFFF),
    onPrimary = Color(0xFF000000),
    primaryContainer = Color(0xFF222222),
    secondary = Color(0xFFEEEEEE),
    background = Color(0xFF000000),
    surface = Color(0xFF111111),
    onBackground = Color(0xFFFFFFFF),
    onSurface = Color(0xFFFFFFFF),
    error = Color(0xFFFF6B6B),
)

private fun scaledTypography(multiplier: Float): Typography {
    fun s(base: Float) = (base * multiplier).sp
    return Typography(
        displayLarge = TextStyle(fontSize = s(36f), fontWeight = FontWeight.Bold),
        displayMedium = TextStyle(fontSize = s(30f), fontWeight = FontWeight.Bold),
        headlineLarge = TextStyle(fontSize = s(28f), fontWeight = FontWeight.SemiBold),
        headlineMedium = TextStyle(fontSize = s(24f), fontWeight = FontWeight.SemiBold),
        titleLarge = TextStyle(fontSize = s(22f), fontWeight = FontWeight.SemiBold),
        titleMedium = TextStyle(fontSize = s(18f), fontWeight = FontWeight.Medium),
        titleSmall = TextStyle(fontSize = s(16f), fontWeight = FontWeight.Medium),
        bodyLarge = TextStyle(fontSize = s(17f), lineHeight = s(24f)),
        bodyMedium = TextStyle(fontSize = s(16f), lineHeight = s(22f)),
        bodySmall = TextStyle(fontSize = s(14f), lineHeight = s(20f)),
        labelLarge = TextStyle(fontSize = s(15f), fontWeight = FontWeight.Medium),
        labelMedium = TextStyle(fontSize = s(13f), fontWeight = FontWeight.Medium),
        labelSmall = TextStyle(fontSize = s(12f), fontWeight = FontWeight.Medium),
    )
}

@Composable
fun TuFarmaciaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    fontScale: FontScalePref = FontScalePref.Large,
    highContrast: Boolean = false,
    content: @Composable () -> Unit,
) {
    val colors = when {
        highContrast && darkTheme -> HighContrastDark
        highContrast -> HighContrastLight
        darkTheme -> DarkColors
        else -> LightColors
    }
    MaterialTheme(
        colorScheme = colors,
        typography = scaledTypography(fontScale.multiplier),
        content = content,
    )
}
