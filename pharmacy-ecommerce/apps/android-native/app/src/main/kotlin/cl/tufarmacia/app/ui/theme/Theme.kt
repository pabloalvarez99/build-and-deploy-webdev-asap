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

// Ops brand — dense counter UI for staff (caja / ERP), not consumer storefront
val BrandCyan = Color(0xFF0F766E)
val BrandCyanBright = Color(0xFF0D9488)
val BrandCyanSoft = Color(0xFFCCFBF1)
val BrandTeal = Color(0xFF115E59)
val Ink = Color(0xFF111827)
val InkMuted = Color(0xFF6B7280)
val InkFaint = Color(0xFF9CA3AF)
val SurfaceBg = Color(0xFFF3F4F6)
val SurfaceCard = Color(0xFFFFFFFF)
val BorderSoft = Color(0xFFD1D5DB)
val Success = Color(0xFF15803D)
val SuccessBg = Color(0xFFDCFCE7)
val Warning = Color(0xFFB45309)
val WarningBg = Color(0xFFFEF3C7)
val Danger = Color(0xFFB91C1C)
val DangerBg = Color(0xFFFEE2E2)
val Amber = Color(0xFFD97706)

private val LightColors = lightColorScheme(
    primary = BrandCyan,
    onPrimary = Color.White,
    primaryContainer = BrandCyanSoft,
    onPrimaryContainer = Color(0xFF042F2E),
    secondary = Color(0xFF1F2937),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE5E7EB),
    onSecondaryContainer = Color(0xFF111827),
    tertiary = Amber,
    background = SurfaceBg,
    onBackground = Ink,
    surface = SurfaceCard,
    onSurface = Ink,
    surfaceVariant = Color(0xFFE5E7EB),
    onSurfaceVariant = InkMuted,
    outline = BorderSoft,
    error = Danger,
    onError = Color.White,
    errorContainer = DangerBg,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF2DD4BF),
    onPrimary = Color(0xFF042F2E),
    primaryContainer = Color(0xFF115E59),
    secondary = Color(0xFF9CA3AF),
    background = Color(0xFF0B1220),
    onBackground = Color(0xFFF3F4F6),
    surface = Color(0xFF111827),
    onSurface = Color(0xFFF3F4F6),
    surfaceVariant = Color(0xFF1F2937),
    onSurfaceVariant = Color(0xFFD1D5DB),
    outline = Color(0xFF374151),
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
    extraSmall = RoundedCornerShape(6.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(14.dp),
    extraLarge = RoundedCornerShape(18.dp),
)

/** Compact type for counter speed; scale multiplier only if worker opts in. */
private fun scaledTypography(multiplier: Float): Typography {
    fun s(base: Float) = (base * multiplier).sp
    return Typography(
        displayLarge = TextStyle(fontSize = s(32f), fontWeight = FontWeight.Bold),
        displayMedium = TextStyle(fontSize = s(28f), fontWeight = FontWeight.Bold),
        displaySmall = TextStyle(fontSize = s(24f), fontWeight = FontWeight.Bold),
        headlineLarge = TextStyle(fontSize = s(24f), fontWeight = FontWeight.SemiBold),
        headlineMedium = TextStyle(fontSize = s(20f), fontWeight = FontWeight.SemiBold),
        headlineSmall = TextStyle(fontSize = s(18f), fontWeight = FontWeight.SemiBold),
        titleLarge = TextStyle(fontSize = s(17f), fontWeight = FontWeight.SemiBold, lineHeight = s(22f)),
        titleMedium = TextStyle(fontSize = s(15f), fontWeight = FontWeight.SemiBold, lineHeight = s(20f)),
        titleSmall = TextStyle(fontSize = s(14f), fontWeight = FontWeight.SemiBold, lineHeight = s(18f)),
        bodyLarge = TextStyle(fontSize = s(15f), lineHeight = s(20f)),
        bodyMedium = TextStyle(fontSize = s(14f), lineHeight = s(18f)),
        bodySmall = TextStyle(fontSize = s(12f), lineHeight = s(16f)),
        labelLarge = TextStyle(fontSize = s(14f), fontWeight = FontWeight.SemiBold),
        labelMedium = TextStyle(fontSize = s(12f), fontWeight = FontWeight.Medium),
        labelSmall = TextStyle(fontSize = s(11f), fontWeight = FontWeight.Medium),
    )
}

@Composable
fun TuFarmaciaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    fontScale: FontScalePref = FontScalePref.Normal,
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
