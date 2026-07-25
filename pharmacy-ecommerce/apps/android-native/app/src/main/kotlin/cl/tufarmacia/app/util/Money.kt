package cl.tufarmacia.app.util

import java.text.NumberFormat
import java.util.Locale

private val clp: NumberFormat = NumberFormat.getCurrencyInstance(Locale("es", "CL"))

fun formatClp(amount: Double): String =
    runCatching { clp.format(amount) }.getOrElse { "$${amount.toLong()}" }

fun formatClp(amount: String): String =
    formatClp(amount.toDoubleOrNull() ?: 0.0)
