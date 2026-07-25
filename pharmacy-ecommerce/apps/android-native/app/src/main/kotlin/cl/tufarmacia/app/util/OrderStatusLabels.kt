package cl.tufarmacia.app.util

import androidx.compose.ui.graphics.Color

data class OrderStatusStyle(
    val label: String,
    val color: Color,
)

/**
 * Spanish labels for order statuses (parity with web mis-pedidos statusConfig).
 */
fun orderStatusStyle(status: String?): OrderStatusStyle {
    return when (status?.lowercase()) {
        "pending" -> OrderStatusStyle("Pendiente", Color(0xFFCA8A04))
        "reserved" -> OrderStatusStyle("Reservado", Color(0xFFD97706))
        "paid" -> OrderStatusStyle("Pagado", Color(0xFF16A34A))
        "processing" -> OrderStatusStyle("En proceso", Color(0xFF2563EB))
        "shipped" -> OrderStatusStyle("Enviado", Color(0xFF7C3AED))
        "delivered", "completed" -> OrderStatusStyle("Entregado", Color(0xFF059669))
        "cancelled" -> OrderStatusStyle("Anulado", Color(0xFFDC2626))
        "refunded" -> OrderStatusStyle("Reembolsado", Color(0xFF64748B))
        else -> OrderStatusStyle(status?.replaceFirstChar { it.uppercase() } ?: "—", Color(0xFF64748B))
    }
}

fun orderStatusLabel(status: String?): String = orderStatusStyle(status).label
