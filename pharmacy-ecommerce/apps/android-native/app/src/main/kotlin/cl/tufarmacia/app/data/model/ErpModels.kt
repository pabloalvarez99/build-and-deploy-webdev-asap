package cl.tufarmacia.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class OperacionesKpis(
    @SerialName("ventas_hoy") val ventasHoy: Double = 0.0,
    @SerialName("ordenes_hoy") val ordenesHoy: Int = 0,
    @SerialName("ventas_ayer") val ventasAyer: Double = 0.0,
    @SerialName("ordenes_ayer") val ordenesAyer: Int = 0,
    @SerialName("pedidos_pendientes_webpay") val pedidosPendientesWebpay: Int = 0,
)

@Serializable
data class OperacionesPl(
    @SerialName("costo_hoy") val costoHoy: Double = 0.0,
    @SerialName("margen_bruto_hoy") val margenBrutoHoy: Double = 0.0,
    @SerialName("margen_pct_hoy") val margenPctHoy: Int = 0,
)

@Serializable
data class OperacionesMetas(
    val diaria: Double? = null,
    val mensual: Double? = null,
    @SerialName("ventas_mes") val ventasMes: Double = 0.0,
    @SerialName("ordenes_mes") val ordenesMes: Int = 0,
)

@Serializable
data class OperacionesReserva(
    val id: String,
    val nombre: String? = null,
    @SerialName("pickup_code") val pickupCode: String? = null,
    val expiry: String? = null,
    val total: Double = 0.0,
)

@Serializable
data class OperacionesResponse(
    val kpis: OperacionesKpis = OperacionesKpis(),
    val pl: OperacionesPl? = null,
    val metas: OperacionesMetas? = null,
    @SerialName("stock_critico_count") val stockCriticoCount: Int = 0,
    @SerialName("stock_cero_count") val stockCeroCount: Int = 0,
    @SerialName("faltas_pending_total") val faltasPendingTotal: Int = 0,
    @SerialName("reservas_urgentes") val reservasUrgentes: List<OperacionesReserva> = emptyList(),
    @SerialName("reservas_expiradas") val reservasExpiradas: List<OperacionesReserva> = emptyList(),
)

@Serializable
data class InventoryItem(
    val id: String,
    val name: String,
    val slug: String? = null,
    val stock: Int = 0,
    val price: Double = 0.0,
    @SerialName("cost_price") val costPrice: Double? = null,
    val category: String? = null,
    @SerialName("low_stock") val lowStock: Boolean = false,
    @SerialName("units_sold_30d") val unitsSold30d: Int = 0,
)

@Serializable
data class InventorySummary(
    @SerialName("total_products") val totalProducts: Int = 0,
    @SerialName("products_with_cost") val productsWithCost: Int = 0,
)

@Serializable
data class InventoryResponse(
    val items: List<InventoryItem> = emptyList(),
    val summary: InventorySummary = InventorySummary(),
)

@Serializable
data class StockAdjustRequest(
    @SerialName("product_id") val productId: String,
    val delta: Int,
    val notes: String? = null,
    val reason: String = "adjustment",
)

@Serializable
data class StockAdjustResponse(
    val success: Boolean = false,
    @SerialName("new_stock") val newStock: Int = 0,
    @SerialName("product_name") val productName: String? = null,
)

@Serializable
data class PosSaleItem(
    @SerialName("product_id") val productId: String,
    @SerialName("product_name") val productName: String,
    val quantity: Int,
    val price: Double,
)

@Serializable
data class PosSaleRequest(
    val items: List<PosSaleItem>,
    @SerialName("payment_method") val paymentMethod: String,
    @SerialName("cash_amount") val cashAmount: Double? = null,
    @SerialName("card_amount") val cardAmount: Double? = null,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("customer_phone") val customerPhone: String? = null,
    @SerialName("discount_amount") val discountAmount: Double? = null,
    val notes: String? = null,
)

@Serializable
data class PosSaleResponse(
    val id: String? = null,
    val total: String? = null,
    val status: String? = null,
    val error: String? = null,
)

@Serializable
data class ClienteDto(
    val id: String? = null,
    val email: String? = null,
    val name: String? = null,
    val surname: String? = null,
    val phone: String? = null,
    @SerialName("order_count") val orderCount: Int = 0,
    @SerialName("total_spend") val totalSpend: Double = 0.0,
    @SerialName("last_order") val lastOrder: String? = null,
    val type: String = "registered",
)

@Serializable
data class ClientesResponse(
    val registered: List<ClienteDto> = emptyList(),
    val guests: List<ClienteDto> = emptyList(),
)

@Serializable
data class SupplierDto(
    val id: String,
    val name: String,
    val email: String? = null,
    val phone: String? = null,
    val active: Boolean = true,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class SuppliersResponse(
    val suppliers: List<SupplierDto> = emptyList(),
)

@Serializable
data class PurchaseOrderDto(
    val id: String,
    val status: String? = null,
    @SerialName("total_cost") val totalCost: String? = null,
    @SerialName("invoice_number") val invoiceNumber: String? = null,
    val paid: Boolean = false,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val suppliers: SupplierName? = null,
)

@Serializable
data class SupplierName(
    val id: String? = null,
    val name: String? = null,
)

@Serializable
data class PurchaseOrdersResponse(
    val orders: List<PurchaseOrderDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    @SerialName("total_pages") val totalPages: Int = 1,
)

@Serializable
data class FinanzasDashboard(
    @SerialName("pending_ap_count") val pendingApCount: Int = 0,
    @SerialName("pending_ap_amount") val pendingApAmount: Double = 0.0,
    @SerialName("gastos_mes") val gastosMes: Double = 0.0,
    @SerialName("ingresos_mes") val ingresosMes: Double = 0.0,
    @SerialName("overdue_ap_count") val overdueApCount: Int = 0,
)

@Serializable
data class TaskDto(
    val id: String,
    val title: String? = null,
    val description: String? = null,
    val status: String? = null,
    val priority: Int = 0,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("assigned_to_uid") val assignedToUid: String? = null,
    @SerialName("assigned_role") val assignedRole: String? = null,
)

@Serializable
data class TasksResponse(
    val tasks: List<TaskDto> = emptyList(),
)

@Serializable
data class DashboardExtras(
    @SerialName("ocs_to_pay") val ocsToPay: OcsStat? = null,
    @SerialName("ocs_overdue") val ocsOverdue: OcsStat? = null,
    @SerialName("expiring_batches") val expiring: ExpiringStat? = null,
)

@Serializable
data class OcsStat(
    val count: Int = 0,
    val total: Double = 0.0,
)

@Serializable
data class ExpiringStat(
    val count: Int = 0,
    val products: Int = 0,
)

@Serializable
data class TurnoCierre(
    val id: String? = null,
    @SerialName("turno_fin") val turnoFin: String? = null,
    @SerialName("turno_inicio") val turnoInicio: String? = null,
    @SerialName("cerrado_por") val cerradoPor: String? = null,
    @SerialName("ventas_total") val ventasTotal: Double = 0.0,
    @SerialName("num_transacciones") val numTransacciones: Int = 0,
    @SerialName("diferencia") val diferencia: Double = 0.0,
)

@Serializable
data class TurnosResponse(
    val cierres: List<TurnoCierre> = emptyList(),
    val items: List<TurnoCierre> = emptyList(),
    val total: Int = 0,
) {
    val list: List<TurnoCierre> get() = if (cierres.isNotEmpty()) cierres else items
}

@Serializable
data class TaskActionResponse(
    val success: Boolean = true,
    val error: String? = null,
)

@Serializable
data class FaltaDto(
    val id: String,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String? = null,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("customer_phone") val customerPhone: String? = null,
    val quantity: Int = 1,
    val notes: String? = null,
    val status: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("notified_at") val notifiedAt: String? = null,
)

@Serializable
data class FaltasResponse(
    val faltas: List<FaltaDto> = emptyList(),
    val pendingCount: Int? = null,
)

@Serializable
data class ArqueoVentas(
    val efectivo: Double = 0.0,
    val debito: Double = 0.0,
    val credito: Double = 0.0,
    val mixto: Double = 0.0,
    val total: Double = 0.0,
    @SerialName("num_transacciones") val numTransacciones: Int = 0,
)

@Serializable
data class ArqueoOrder(
    val id: String,
    val total: Double = 0.0,
    @SerialName("payment_provider") val paymentProvider: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val customer: String? = null,
)

@Serializable
data class ArqueoResponse(
    @SerialName("turno_inicio") val turnoInicio: String? = null,
    @SerialName("fondo_inicial") val fondoInicial: Double = 0.0,
    val ventas: ArqueoVentas = ArqueoVentas(),
    @SerialName("efectivo_esperado") val efectivoEsperado: Double = 0.0,
    @SerialName("recent_orders") val recentOrders: List<ArqueoOrder> = emptyList(),
    @SerialName("pharmacist_name") val pharmacistName: String? = null,
)
