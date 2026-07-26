package cl.tufarmacia.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cl.tufarmacia.app.data.FontScalePref

// Brand — pharmacy / trust / senior-friendly contrast
val BrandCyan = Color(0xFF0E7490)
val BrandCyanBright = Color(0xFF0891B2)
val BrandCyanSoft = Color(0xFFE0F2FE)
val BrandTeal = Color(0xFF0F766E)
val Ink = Color(0xFF0F172A)
val InkMuted = Color(0xFF64748B)
val InkFaint = Color(0xFF94A3B8)
val SurfaceBg = Color(0xFFF1F5F9)
val SurfaceCard = Color(0xFFFFFFFF)
val BorderSoft = Color(0xFFE2E8F0)
val Success = Color(0xFF15803D)
val SuccessBg = Color(0xFFDCFCE7)
val Warning = Color(0xFFB45309)
val WarningBg = Color(0xFFFEF3C7)
val Danger = Color(0xFFB91C1C)
val DangerBg = Color(0xFFFEE2E2)

private val LightColors = lightColorScheme(
    primary = BrandCyan,
    onPrimary = Color.White,
    primaryContainer = BrandCyanSoft,
    onPrimaryContainer = Color(0xFF083344),
    secondary = BrandTeal,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFCCFBF1),
    onSecondaryContainer = Color(0xFF134E4A),
    tertiary = Color(0xFF7C3AED),
    background = SurfaceBg,
    onBackground = Ink,
    surface = SurfaceCard,
    onSurface = Ink,
    surfaceVariant = Color(0xFFE2E8F0),
    onSurfaceVariant = InkMuted,
    outline = BorderSoft,
    error = Danger,
    onError = Color.White,
    errorContainer = DangerBg,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF22D3EE),
    onPrimary = Color(0xFF083344),
    primaryContainer = Color(0xFF164E63),
    secondary = Color(0xFF2DD4BF),
    background = Color(0xFF0F172A),
    onBackground = Color(0xFFF1F5F9),
    surface = Color(0xFF1E293B),
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = Color(0xFF334155),
    onSurfaceVariant = Color(0xFFCBD5E1),
    outline = Color(0xFF475569),
    error = Color(0xFFFCA5A5),
)

private val HighContrastLight = lightColorScheme(
    primary = Color(0xFF000000),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFE5E5E5),
    secondary = Color(0xFF111111),
    background = Color(0xFFFFFFFF),
    surface = Color(0xFFFFFFFF),
    onBackground = Color(0xFF000000),
    onSurface = Color(0xFF000000),
    outline = Color(0xFF000000),
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
    outline = Color(0xFFFFFFFF),
    error = Color(0xFFFF6B6B),
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

private fun scaledTypography(multiplier: Float): Typography {
    fun s(base: Float) = (base * multiplier).sp
    return Typography(
        displayLarge = TextStyle(fontSize = s(36f), fontWeight = FontWeight.Bold, color = Ink),
        displayMedium = TextStyle(fontSize = s(30f), fontWeight = FontWeight.Bold),
        displaySmall = TextStyle(fontSize = s(26f), fontWeight = FontWeight.Bold),
        headlineLarge = TextStyle(fontSize = s(28f), fontWeight = FontWeight.SemiBold),
        headlineMedium = TextStyle(fontSize = s(24f), fontWeight = FontWeight.SemiBold),
        headlineSmall = TextStyle(fontSize = s(22f), fontWeight = FontWeight.SemiBold),
        titleLarge = TextStyle(fontSize = s(20f), fontWeight = FontWeight.SemiBold, lineHeight = s(26f)),
        titleMedium = TextStyle(fontSize = s(17f), fontWeight = FontWeight.SemiBold, lineHeight = s(24f)),
        titleSmall = TextStyle(fontSize = s(15f), fontWeight = FontWeight.SemiBold, lineHeight = s(20f)),
        bodyLarge = TextStyle(fontSize = s(17f), lineHeight = s(26f), fontWeight = FontWeight.Normal),
        bodyMedium = TextStyle(fontSize = s(16f), lineHeight = s(24f)),
        bodySmall = TextStyle(fontSize = s(14f), lineHeight = s(20f)),
        labelLarge = TextStyle(fontSize = s(15f), fontWeight = FontWeight.SemiBold),
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
        shapes = AppShapes,
        content = content,
    )
}
