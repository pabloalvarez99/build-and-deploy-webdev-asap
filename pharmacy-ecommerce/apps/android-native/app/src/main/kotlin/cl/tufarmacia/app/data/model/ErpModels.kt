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
    @SerialName("customer_user_id") val customerUserId: String? = null,
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
data class PosPickupItem(
    @SerialName("product_name") val productName: String,
    val quantity: Int = 0,
    @SerialName("price_at_purchase") val priceAtPurchase: String? = null,
)

@Serializable
data class PosPickupOrder(
    val id: String,
    val status: String,
    val total: String,
    @SerialName("pickup_code") val pickupCode: String? = null,
    @SerialName("reservation_expires_at") val reservationExpiresAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("guest_name") val guestName: String? = null,
    @SerialName("guest_surname") val guestSurname: String? = null,
    @SerialName("guest_email") val guestEmail: String? = null,
    @SerialName("customer_phone") val customerPhone: String? = null,
    val items: List<PosPickupItem> = emptyList(),
)

@Serializable
data class PosRecentOrder(
    val date: String? = null,
    val total: Double = 0.0,
    val items: String? = null,
)

@Serializable
data class PosCustomerHistory(
    val found: Boolean = false,
    val name: String? = null,
    @SerialName("user_id") val userId: String? = null,
    val phone: String? = null,
    @SerialName("loyalty_points") val loyaltyPoints: Int? = null,
    @SerialName("visit_count") val visitCount: Int = 0,
    @SerialName("top_products") val topProducts: List<String> = emptyList(),
    @SerialName("recent_orders") val recentOrders: List<PosRecentOrder> = emptyList(),
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
    val items: List<PurchaseOrderItemDto> = emptyList(),
)

@Serializable
data class PurchaseOrderItemDto(
    val id: String? = null,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String? = null,
    val description: String? = null,
    val quantity: Int = 0,
    @SerialName("unit_cost") val unitCost: String? = null,
    val subtotal: String? = null,
    @SerialName("supplier_product_code") val supplierProductCode: String? = null,
    val products: MappedProductName? = null,
)

@Serializable
data class MappedProductName(
    val id: String? = null,
    val name: String? = null,
    val slug: String? = null,
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
data class ReceivePoResponse(
    val success: Boolean = false,
    @SerialName("items_updated") val itemsUpdated: Int = 0,
    @SerialName("items_skipped") val itemsSkipped: Int = 0,
    val error: String? = null,
)

@Serializable
data class BatchProduct(
    val id: String? = null,
    val name: String? = null,
    val slug: String? = null,
    val stock: Int = 0,
)

@Serializable
data class ProductBatchDto(
    val id: String,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("batch_code") val batchCode: String? = null,
    @SerialName("expiry_date") val expiryDate: String? = null,
    val quantity: Int = 0,
    val notes: String? = null,
    val products: BatchProduct? = null,
)

@Serializable
data class BatchesSummary(
    val expired: Int = 0,
    val soon30: Int = 0,
    val soon90: Int = 0,
    val total: Int = 0,
)

@Serializable
data class BatchesResponse(
    val batches: List<ProductBatchDto> = emptyList(),
    val summary: BatchesSummary = BatchesSummary(),
)

@Serializable
data class ReorderItem(
    @SerialName("product_id") val productId: String,
    val name: String,
    val stock: Int = 0,
    val price: Double = 0.0,
    @SerialName("cost_price") val costPrice: Double? = null,
    @SerialName("supplier_code") val supplierCode: String? = null,
)

@Serializable
data class ReorderSupplier(
    val id: String? = null,
    val name: String? = null,
    @SerialName("contact_name") val contactName: String? = null,
    @SerialName("contact_phone") val contactPhone: String? = null,
)

@Serializable
data class ReorderGroup(
    val supplier: ReorderSupplier? = null,
    val items: List<ReorderItem> = emptyList(),
)

@Serializable
data class ReorderSuggestionsResponse(
    val threshold: Int = 10,
    val groups: List<ReorderGroup> = emptyList(),
    @SerialName("total_products") val totalProducts: Int = 0,
)

@Serializable
data class CreateFaltaRequest(
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("customer_phone") val customerPhone: String? = null,
    val quantity: Int = 1,
    val notes: String? = null,
)

@Serializable
data class DevolucionItemDto(
    val id: String? = null,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String? = null,
    val quantity: Int = 0,
    @SerialName("unit_price") val unitPrice: Double = 0.0,
    val restock: Boolean = false,
)

@Serializable
data class DevolucionDto(
    val id: String,
    @SerialName("order_id") val orderId: String? = null,
    val tipo: String? = null,
    val motivo: String? = null,
    val notas: String? = null,
    @SerialName("total_devuelto") val totalDevuelto: Double = 0.0,
    @SerialName("metodo_reembolso") val metodoReembolso: String? = null,
    @SerialName("procesado_por") val procesadoPor: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    val items: List<DevolucionItemDto> = emptyList(),
)

@Serializable
data class DevolucionesResponse(
    val devoluciones: List<DevolucionDto> = emptyList(),
    val total: Int = 0,
    val pages: Int = 1,
)

@Serializable
data class CreateDevolucionItem(
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String,
    val quantity: Int,
    @SerialName("unit_price") val unitPrice: Double,
    val restock: Boolean = true,
)

@Serializable
data class CreateDevolucionRequest(
    @SerialName("order_id") val orderId: String? = null,
    val tipo: String = "venta",
    val motivo: String,
    val notas: String? = null,
    @SerialName("metodo_reembolso") val metodoReembolso: String? = null,
    val items: List<CreateDevolucionItem>,
)

@Serializable
data class AdminProductDto(
    val id: String,
    val name: String,
    val slug: String? = null,
    val price: String? = null,
    val stock: Int = 0,
    @SerialName("cost_price") val costPrice: String? = null,
    @SerialName("discount_percent") val discountPercent: Int? = null,
    val active: Boolean = true,
    val barcodes: List<String> = emptyList(),
)

@Serializable
data class AdminProductUpdate(
    val price: Double? = null,
    val stock: Int? = null,
    @SerialName("discount_percent") val discountPercent: Int? = null,
    val active: Boolean? = null,
)

@Serializable
data class UnknownBarcodeDto(
    val barcode: String,
    @SerialName("scan_count") val scanCount: Int = 0,
    @SerialName("last_scanned_at") val lastScannedAt: String? = null,
    @SerialName("last_user_id") val lastUserId: String? = null,
    @SerialName("resolved_at") val resolvedAt: String? = null,
)

@Serializable
data class UnknownBarcodesResponse(
    val items: List<UnknownBarcodeDto> = emptyList(),
)

@Serializable
data class ApOrderDto(
    val id: String,
    val status: String? = null,
    val paid: Boolean = false,
    @SerialName("total_cost") val totalCost: Double? = null,
    @SerialName("invoice_number") val invoiceNumber: String? = null,
    @SerialName("due_date") val dueDate: String? = null,
    val suppliers: SupplierName? = null,
)

@Serializable
data class ApListResponse(
    val orders: List<ApOrderDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class ApPayRequest(
    val amount: Double,
    @SerialName("payment_method") val paymentMethod: String,
    @SerialName("mark_fully_paid") val markFullyPaid: Boolean = true,
    val notes: String? = null,
)

@Serializable
data class ApPayResponse(
    val success: Boolean = false,
)

@Serializable
data class GastoCategoryDto(
    val id: String,
    val name: String? = null,
)

@Serializable
data class GastoDto(
    val id: String,
    val description: String? = null,
    val amount: Double? = null,
    @SerialName("expense_date") val expenseDate: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null,
    @SerialName("gasto_categories") val category: GastoCategoryDto? = null,
)

@Serializable
data class GastosResponse(
    val gastos: List<GastoDto> = emptyList(),
    val total: Int = 0,
    val categories: List<GastoCategoryDto> = emptyList(),
)

@Serializable
data class CreateGastoRequest(
    @SerialName("category_id") val categoryId: String,
    val description: String,
    val amount: Double,
    @SerialName("expense_date") val expenseDate: String,
    @SerialName("payment_method") val paymentMethod: String? = null,
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
