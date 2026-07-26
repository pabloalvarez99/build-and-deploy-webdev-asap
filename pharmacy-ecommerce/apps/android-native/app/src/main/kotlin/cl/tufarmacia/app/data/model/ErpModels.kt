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

// notes already on PosSaleRequest

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
    val id: String = "",
    val title: String? = null,
    val description: String? = null,
    val status: String? = null,
    /** API may return string priority (low/normal/high). */
    val priority: String? = null,
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

@Serializable
data class ArqueoActionResponse(
    val success: Boolean = false,
    val ok: Boolean = false,
    val error: String? = null,
    @SerialName("shift_id") val shiftId: String? = null,
)

@Serializable
data class AvisoDto(
    val id: String,
    val title: String? = null,
    val body: String? = null,
    val severity: String? = null,
    val pinned: Boolean = false,
    @SerialName("visible_to") val visibleTo: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("created_by_name") val createdByName: String? = null,
)

@Serializable
data class AvisosResponse(
    val announcements: List<AvisoDto> = emptyList(),
)

@Serializable
data class CreateAvisoRequest(
    val title: String,
    val body: String,
    val severity: String = "info",
    @SerialName("visible_to") val visibleTo: String = "all",
    val pinned: Boolean = false,
    @SerialName("expires_at") val expiresAt: String? = null,
)

@Serializable
data class CreateAvisoResponse(
    val announcement: AvisoDto? = null,
)

@Serializable
data class CierreDiaPos(
    val revenue: Double = 0.0,
    val count: Int = 0,
    val efectivo: Double = 0.0,
    val debito: Double = 0.0,
    val credito: Double = 0.0,
    @SerialName("mixto_count") val mixtoCount: Int = 0,
)

@Serializable
data class CierreDiaOnline(
    val revenue: Double = 0.0,
    val count: Int = 0,
)

@Serializable
data class CierreDiaVentas(
    val total: Double = 0.0,
    val count: Int = 0,
    @SerialName("delta_pct") val deltaPct: Double? = null,
    @SerialName("prev_total") val prevTotal: Double = 0.0,
    @SerialName("avg_ticket") val avgTicket: Double = 0.0,
    val pos: CierreDiaPos = CierreDiaPos(),
    val online: CierreDiaOnline = CierreDiaOnline(),
)

@Serializable
data class CierreDiaFinanzas(
    val cogs: Double = 0.0,
    @SerialName("margen_bruto") val margenBruto: Double? = null,
    @SerialName("margen_pct") val margenPct: Double? = null,
    val gastos: Double = 0.0,
    @SerialName("gastos_count") val gastosCount: Int = 0,
)

@Serializable
data class CierreDiaCaja(
    val id: String? = null,
    @SerialName("turno_inicio") val turnoInicio: String? = null,
    @SerialName("turno_fin") val turnoFin: String? = null,
    @SerialName("fondo_inicial") val fondoInicial: Double = 0.0,
    @SerialName("ventas_total") val ventasTotal: Double = 0.0,
    @SerialName("efectivo_esperado") val efectivoEsperado: Double = 0.0,
    @SerialName("efectivo_contado") val efectivoContado: Double = 0.0,
    val diferencia: Double = 0.0,
    @SerialName("cerrado_por") val cerradoPor: String? = null,
    val notas: String? = null,
)

@Serializable
data class CierreDiaFarmaciaTurno(
    @SerialName("pharmacist_name") val pharmacistName: String? = null,
    @SerialName("shift_start") val shiftStart: String? = null,
    @SerialName("shift_end") val shiftEnd: String? = null,
)

@Serializable
data class CierreDiaFarmacia(
    @SerialName("recetas_total") val recetasTotal: Int = 0,
    @SerialName("recetas_controladas") val recetasControladas: Int = 0,
    val turno: CierreDiaFarmaciaTurno? = null,
)

@Serializable
data class CierreDiaTareas(
    @SerialName("completadas_hoy") val completadasHoy: Int = 0,
    val abiertas: Int = 0,
    val atrasadas: Int = 0,
)

@Serializable
data class CierreDiaVendedor(
    val uid: String? = null,
    val name: String? = null,
    val revenue: Double = 0.0,
    val count: Int = 0,
)

@Serializable
data class CierreDiaTopProducto(
    val name: String? = null,
    val units: Int = 0,
    val revenue: Double = 0.0,
    val cogs: Double = 0.0,
)

@Serializable
data class CierreDiaRetiroManana(
    val id: String,
    @SerialName("pickup_code") val pickupCode: String? = null,
    val total: Double = 0.0,
    val customer: String? = null,
    val phone: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
)

@Serializable
data class CierreDiaAlertas(
    @SerialName("stock_cero") val stockCero: Int = 0,
    @SerialName("lotes_7d") val lotes7d: Int = 0,
    @SerialName("faltas_con_stock") val faltasConStock: Int = 0,
)

@Serializable
data class CierreDiaManana(
    val retiros: List<CierreDiaRetiroManana> = emptyList(),
    val alertas: CierreDiaAlertas = CierreDiaAlertas(),
)

@Serializable
data class CierreDiaResponse(
    val date: String? = null,
    @SerialName("date_label") val dateLabel: String? = null,
    val ventas: CierreDiaVentas = CierreDiaVentas(),
    val finanzas: CierreDiaFinanzas = CierreDiaFinanzas(),
    val caja: CierreDiaCaja? = null,
    val farmacia: CierreDiaFarmacia = CierreDiaFarmacia(),
    val tareas: CierreDiaTareas = CierreDiaTareas(),
    @SerialName("avisos_activos") val avisosActivos: Int = 0,
    @SerialName("por_vendedor") val porVendedor: List<CierreDiaVendedor> = emptyList(),
    @SerialName("top_productos") val topProductos: List<CierreDiaTopProducto> = emptyList(),
    val manana: CierreDiaManana = CierreDiaManana(),
)

@Serializable
data class CierreDiaEmailResponse(
    val sent: Boolean = false,
    val to: String? = null,
    val error: String? = null,
)

@Serializable
data class StockMovementProduct(
    val id: String? = null,
    val name: String? = null,
    val slug: String? = null,
)

@Serializable
data class StockMovementDto(
    val id: String,
    @SerialName("product_id") val productId: String? = null,
    val delta: Int = 0,
    val reason: String? = null,
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("created_by") val createdBy: String? = null,
    @SerialName("created_by_name") val createdByName: String? = null,
    val products: StockMovementProduct? = null,
)

@Serializable
data class StockMovementsResponse(
    val movements: List<StockMovementDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 50,
    @SerialName("total_pages") val totalPages: Int = 0,
)

@Serializable
data class ClienteKpis(
    @SerialName("lifetime_spend") val lifetimeSpend: Double = 0.0,
    @SerialName("order_count") val orderCount: Int = 0,
    @SerialName("avg_ticket") val avgTicket: Double = 0.0,
    @SerialName("first_order") val firstOrder: String? = null,
    @SerialName("last_order") val lastOrder: String? = null,
    @SerialName("frequency_days") val frequencyDays: Int? = null,
    @SerialName("top_recurrent") val topRecurrent: List<TopRecurrentProduct> = emptyList(),
)

@Serializable
data class TopRecurrentProduct(
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String? = null,
    val orders: Int = 0,
    @SerialName("total_qty") val totalQty: Int = 0,
)

@Serializable
data class ClienteDetailCustomer(
    val id: String? = null,
    val email: String? = null,
    val name: String? = null,
    val surname: String? = null,
    val phone: String? = null,
    val rut: String? = null,
    val type: String? = null,
    @SerialName("loyalty_points") val loyaltyPoints: Int = 0,
)

@Serializable
data class ClienteDetailOrder(
    val id: String,
    val status: String? = null,
    val total: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("payment_provider") val paymentProvider: String? = null,
    @SerialName("pickup_code") val pickupCode: String? = null,
)

@Serializable
data class ClienteDetailResponse(
    val customer: ClienteDetailCustomer? = null,
    val kpis: ClienteKpis = ClienteKpis(),
    val orders: List<ClienteDetailOrder> = emptyList(),
)

@Serializable
data class CreateTaskRequest(
    val title: String,
    val description: String? = null,
    val priority: String = "normal",
    @SerialName("assigned_role") val assignedRole: String? = null,
)

@Serializable
data class ExpressReorderItem(
    val name: String,
    val qty: Int,
    @SerialName("unit_cost") val unitCost: Double? = null,
)

@Serializable
data class ExpressReorderRequest(
    @SerialName("supplier_id") val supplierId: String,
    val items: List<ExpressReorderItem>,
    val notes: String? = null,
)

@Serializable
data class ExpressReorderResponse(
    val success: Boolean = false,
    val error: String? = null,
)

@Serializable
data class CreatePurchaseOrderItem(
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name_invoice") val productNameInvoice: String? = null,
    @SerialName("supplier_product_code") val supplierProductCode: String? = null,
    val quantity: Int,
    @SerialName("unit_cost") val unitCost: Double,
    val subtotal: Double,
)

@Serializable
data class CreatePurchaseOrderRequest(
    @SerialName("supplier_id") val supplierId: String,
    @SerialName("invoice_number") val invoiceNumber: String? = null,
    val notes: String? = null,
    @SerialName("po_reference") val poReference: String? = null,
    val items: List<CreatePurchaseOrderItem>,
)

@Serializable
data class PrescriptionKpis(
    val hoy: Int = 0,
    val mes: Int = 0,
)

@Serializable
data class PrescriptionRecordDto(
    val id: String,
    @SerialName("order_id") val orderId: String? = null,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String? = null,
    val quantity: Int = 1,
    @SerialName("prescription_number") val prescriptionNumber: String? = null,
    @SerialName("patient_name") val patientName: String? = null,
    @SerialName("patient_rut") val patientRut: String? = null,
    @SerialName("doctor_name") val doctorName: String? = null,
    @SerialName("medical_center") val medicalCenter: String? = null,
    @SerialName("prescription_date") val prescriptionDate: String? = null,
    @SerialName("is_controlled") val isControlled: Boolean = false,
    @SerialName("dispensed_by") val dispensedBy: String? = null,
    @SerialName("dispensed_at") val dispensedAt: String? = null,
)

@Serializable
data class PrescriptionsResponse(
    val records: List<PrescriptionRecordDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 50,
    val kpis: PrescriptionKpis = PrescriptionKpis(),
)

@Serializable
data class CreatePrescriptionRequest(
    @SerialName("product_name") val productName: String,
    val quantity: Int,
    @SerialName("patient_name") val patientName: String,
    @SerialName("patient_rut") val patientRut: String? = null,
    @SerialName("prescription_number") val prescriptionNumber: String? = null,
    @SerialName("doctor_name") val doctorName: String? = null,
    @SerialName("medical_center") val medicalCenter: String? = null,
    @SerialName("prescription_date") val prescriptionDate: String? = null,
    @SerialName("is_controlled") val isControlled: Boolean = false,
    @SerialName("dispensed_by") val dispensedBy: String? = null,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("order_id") val orderId: String? = null,
)

// ── Descuentos bulk + fidelización ──────────────────────────────

@Serializable
data class DiscountCategorySummary(
    val name: String? = null,
    val count: Int = 0,
    @SerialName("avg_discount") val avgDiscount: Int = 0,
)

@Serializable
data class DiscountSummary(
    @SerialName("total_discounted") val totalDiscounted: Int = 0,
    @SerialName("by_category") val byCategory: List<DiscountCategorySummary> = emptyList(),
)

@Serializable
data class DiscountProductDto(
    val id: String,
    val name: String? = null,
    /** API sends Decimal as string */
    val price: String? = null,
    @SerialName("discount_percent") val discountPercent: Int = 0,
    @SerialName("category_id") val categoryId: String? = null,
    @SerialName("category_name") val categoryName: String? = null,
    val stock: Int = 0,
    @SerialName("image_url") val imageUrl: String? = null,
) {
    val priceValue: Double
        get() = price?.toDoubleOrNull() ?: 0.0
}

@Serializable
data class DiscountCategoryDto(
    val id: String,
    val name: String? = null,
)

@Serializable
data class LoyaltyTransactionDto(
    val id: String,
    val points: Int = 0,
    val reason: String? = null,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class LoyaltyProgramDto(
    val enabled: Boolean = true,
    @SerialName("points_per_clp") val pointsPerClp: Int = 1000,
    @SerialName("clp_per_point") val clpPerPoint: Int = 100,
    @SerialName("total_users_with_points") val totalUsersWithPoints: Int = 0,
    @SerialName("total_points_in_circulation") val totalPointsInCirculation: Int = 0,
    @SerialName("total_clp_equivalent") val totalClpEquivalent: Double = 0.0,
    @SerialName("recent_transactions") val recentTransactions: List<LoyaltyTransactionDto> = emptyList(),
)

@Serializable
data class DescuentosResponse(
    val summary: DiscountSummary = DiscountSummary(),
    val products: List<DiscountProductDto> = emptyList(),
    val categories: List<DiscountCategoryDto> = emptyList(),
    val loyalty: LoyaltyProgramDto = LoyaltyProgramDto(),
)

@Serializable
data class DescuentosActionResponse(
    val success: Boolean = false,
    val updated: Int = 0,
    val push: DescuentosPushResult? = null,
    val error: String? = null,
)

@Serializable
data class DescuentosPushResult(
    val sent: Int = 0,
    val failed: Int = 0,
    val total: Int = 0,
)

// ── Reportes: ventas / cash-flow / PyL ──────────────────────────

@Serializable
data class ReportesKpis(
    val totalRevenue: Double = 0.0,
    val totalOrders: Int = 0,
    val avgTicket: Double = 0.0,
    val totalCost: Double = 0.0,
    val grossMargin: Double = 0.0,
    val marginPct: Double = 0.0,
)

@Serializable
data class ReportesPrevKpis(
    val totalRevenue: Double = 0.0,
    val totalOrders: Int = 0,
    val avgTicket: Double = 0.0,
)

@Serializable
data class ReportesChannelOnline(
    val orders: Int = 0,
    val revenue: Double = 0.0,
)

@Serializable
data class ReportesChannelPos(
    val orders: Int = 0,
    val revenue: Double = 0.0,
    val cash: Int = 0,
    val debit: Int = 0,
    val credit: Int = 0,
)

@Serializable
data class ReportesChannelBreakdown(
    val online: ReportesChannelOnline = ReportesChannelOnline(),
    val pos: ReportesChannelPos = ReportesChannelPos(),
)

@Serializable
data class ReportesSalesByDay(
    val date: String? = null,
    val ventas: Double = 0.0,
    val ordenes: Int = 0,
    @SerialName("ventas_pos") val ventasPos: Double = 0.0,
    @SerialName("ordenes_pos") val ordenesPos: Int = 0,
)

@Serializable
data class ReportesSalesByHour(
    val hour: Int = 0,
    val ordenes: Int = 0,
    val ventas: Double = 0.0,
)

@Serializable
data class ReportesTopProduct(
    val name: String? = null,
    val units: Int = 0,
    val revenue: Double = 0.0,
    val cost: Double = 0.0,
    @SerialName("has_cost") val hasCost: Boolean = false,
    val category: String? = null,
    val margin: Double? = null,
    @SerialName("margin_pct") val marginPct: Double? = null,
)

@Serializable
data class ReportesCategory(
    val name: String? = null,
    val revenue: Double = 0.0,
    val units: Int = 0,
    val cost: Double = 0.0,
    val margin: Double = 0.0,
)

@Serializable
data class ReportesTopCustomer(
    val name: String? = null,
    val spend: Double = 0.0,
    val orders: Int = 0,
)

@Serializable
data class ReportesCustomerMetrics(
    val totalUniqueCustomers: Int = 0,
    val uniqueRegistered: Int = 0,
    val uniqueGuests: Int = 0,
    val registeredOrderCount: Int = 0,
    val guestOrderCount: Int = 0,
    val avgOrdersPerCustomer: Double = 0.0,
    val avgRevenuePerCustomer: Double = 0.0,
    val topCustomers: List<ReportesTopCustomer> = emptyList(),
)

@Serializable
data class ReportesResponse(
    val kpis: ReportesKpis = ReportesKpis(),
    val prevKpis: ReportesPrevKpis = ReportesPrevKpis(),
    val channelBreakdown: ReportesChannelBreakdown = ReportesChannelBreakdown(),
    val salesByDay: List<ReportesSalesByDay> = emptyList(),
    val salesByHour: List<ReportesSalesByHour> = emptyList(),
    val topProducts: List<ReportesTopProduct> = emptyList(),
    val topByMargin: List<ReportesTopProduct> = emptyList(),
    val byCategory: List<ReportesCategory> = emptyList(),
    val customerMetrics: ReportesCustomerMetrics = ReportesCustomerMetrics(),
)

@Serializable
data class CashFlowDay(
    val date: String? = null,
    val inflow: Double = 0.0,
    val outflow: Double = 0.0,
    @SerialName("projected_outflow") val projectedOutflow: Double = 0.0,
    val balance: Double = 0.0,
    @SerialName("is_past") val isPast: Boolean = true,
)

@Serializable
data class CashFlowResponse(
    val days: List<CashFlowDay> = emptyList(),
)

@Serializable
data class PylMonth(
    val month: Int = 0,
    val ingresos: Double = 0.0,
    val gastos: Double = 0.0,
    val margen: Double = 0.0,
    @SerialName("ingresos_prev") val ingresosPrev: Double = 0.0,
    @SerialName("gastos_prev") val gastosPrev: Double = 0.0,
    @SerialName("margen_prev") val margenPrev: Double = 0.0,
)

@Serializable
data class PylYtd(
    val ingresos: Double = 0.0,
    val gastos: Double = 0.0,
    val margen: Double = 0.0,
)

@Serializable
data class PylResponse(
    val year: Int = 0,
    val months: List<PylMonth> = emptyList(),
    val ytd: PylYtd = PylYtd(),
)
