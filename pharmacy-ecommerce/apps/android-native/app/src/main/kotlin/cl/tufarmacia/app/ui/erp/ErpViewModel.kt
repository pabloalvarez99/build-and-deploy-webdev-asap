package cl.tufarmacia.app.ui.erp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import cl.tufarmacia.app.data.AppContainer
import cl.tufarmacia.app.data.api.ApiException
import cl.tufarmacia.app.data.model.AdminProductDto
import cl.tufarmacia.app.data.model.AdminProductUpdate
import cl.tufarmacia.app.data.model.ApOrderDto
import cl.tufarmacia.app.data.model.ApPayRequest
import cl.tufarmacia.app.data.model.ArqueoResponse
import cl.tufarmacia.app.data.model.ClienteDto
import cl.tufarmacia.app.data.model.CreateDevolucionItem
import cl.tufarmacia.app.data.model.CreateDevolucionRequest
import cl.tufarmacia.app.data.model.CreateFaltaRequest
import cl.tufarmacia.app.data.model.CreateGastoRequest
import cl.tufarmacia.app.data.model.DashboardExtras
import cl.tufarmacia.app.data.model.DevolucionDto
import cl.tufarmacia.app.data.model.FaltaDto
import cl.tufarmacia.app.data.model.FinanzasDashboard
import cl.tufarmacia.app.data.model.GastoCategoryDto
import cl.tufarmacia.app.data.model.GastoDto
import cl.tufarmacia.app.data.model.InventoryItem
import cl.tufarmacia.app.data.model.OperacionesResponse
import cl.tufarmacia.app.data.model.PosCustomerHistory
import cl.tufarmacia.app.data.model.PosPickupOrder
import cl.tufarmacia.app.data.model.PosSaleItem
import cl.tufarmacia.app.data.model.PosSaleRequest
import cl.tufarmacia.app.data.model.Product
import cl.tufarmacia.app.data.model.ProductBatchDto
import cl.tufarmacia.app.data.model.PurchaseOrderDto
import cl.tufarmacia.app.data.model.ReorderGroup
import cl.tufarmacia.app.data.model.StockAdjustRequest
import cl.tufarmacia.app.data.model.SupplierDto
import cl.tufarmacia.app.data.model.TaskDto
import cl.tufarmacia.app.data.model.TurnoCierre
import cl.tufarmacia.app.data.model.UnknownBarcodeDto
import java.time.LocalDate
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

data class PosLine(
    val productId: String,
    val name: String,
    val unitPrice: Double,
    val quantity: Int,
) {
    val lineTotal: Double get() = unitPrice * quantity
}

data class ErpUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val snackbar: String? = null,

    val operaciones: OperacionesResponse? = null,
    val dashboardExtras: DashboardExtras? = null,

    val inventory: List<InventoryItem> = emptyList(),
    val inventoryFilter: String? = "low",
    val inventorySearch: String = "",
    val inventoryReason: String = "adjustment",
    val inventoryBarcode: String = "",
    val inventoryCustomDelta: String = "",

    val posSearch: String = "",
    val posBarcode: String = "",
    val posResults: List<Product> = emptyList(),
    val posCart: List<PosLine> = emptyList(),
    val posPayment: String = "pos_cash",
    val posCustomer: String = "",
    val posPhone: String = "",
    val posDiscount: String = "",
    val posCashAmount: String = "",
    val posCardAmount: String = "",
    val posBusy: Boolean = false,
    val posCustomerUserId: String? = null,
    val posCustomerHistory: PosCustomerHistory? = null,
    val posPickupCode: String = "",
    val posPickup: PosPickupOrder? = null,
    val posPickupLoading: Boolean = false,

    val clients: List<ClienteDto> = emptyList(),
    val suppliers: List<SupplierDto> = emptyList(),
    val purchaseOrders: List<PurchaseOrderDto> = emptyList(),
    val purchaseOrderDetail: PurchaseOrderDto? = null,
    val purchaseOrderBusy: Boolean = false,
    val batches: List<ProductBatchDto> = emptyList(),
    val batchesFilter: String? = "soon30",
    val batchesExpired: Int = 0,
    val batchesSoon30: Int = 0,
    val reorderGroups: List<ReorderGroup> = emptyList(),
    val reorderThreshold: Int = 10,
    val finanzas: FinanzasDashboard? = null,
    val apOrders: List<ApOrderDto> = emptyList(),
    val gastos: List<GastoDto> = emptyList(),
    val gastoCategories: List<GastoCategoryDto> = emptyList(),
    val devoluciones: List<DevolucionDto> = emptyList(),
    val unknownBarcodes: List<UnknownBarcodeDto> = emptyList(),
    val editProduct: AdminProductDto? = null,
    val editProductBusy: Boolean = false,
    val tasks: List<TaskDto> = emptyList(),
    val turnos: List<TurnoCierre> = emptyList(),
    val faltas: List<FaltaDto> = emptyList(),
    val faltasPending: Int = 0,
    val arqueo: ArqueoResponse? = null,
)

class ErpViewModel(private val container: AppContainer) : ViewModel() {
    private val _state = MutableStateFlow(ErpUiState())
    val state: StateFlow<ErpUiState> = _state.asStateFlow()
    private var posSearchJob: Job? = null
    private var inventorySearchJob: Job? = null

    fun consumeSnackbar() {
        _state.update { it.copy(snackbar = null) }
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val ops = runCatching { container.api.adminOperaciones() }.getOrNull()
                val extras = runCatching { container.api.adminDashboardExtras() }.getOrNull()
                _state.update {
                    it.copy(
                        loading = false,
                        operaciones = ops,
                        dashboardExtras = extras,
                        error = if (ops == null) "No se pudo cargar operaciones" else null,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, error = e.message ?: "Error dashboard")
                }
            }
        }
    }

    fun setInventoryFilter(f: String?) {
        _state.update { it.copy(inventoryFilter = f) }
        loadInventory()
    }

    fun setInventorySearch(q: String) {
        _state.update { it.copy(inventorySearch = q) }
        inventorySearchJob?.cancel()
        inventorySearchJob = viewModelScope.launch {
            delay(350)
            loadInventory()
        }
    }

    fun setInventoryReason(reason: String) {
        _state.update { it.copy(inventoryReason = reason) }
    }

    fun setInventoryBarcode(code: String) {
        _state.update { it.copy(inventoryBarcode = code) }
    }

    fun setInventoryCustomDelta(delta: String) {
        _state.update { it.copy(inventoryCustomDelta = delta.filter { ch -> ch == '-' || ch.isDigit() }) }
    }

    fun loadInventory() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val s = _state.value
                val res = container.api.adminInventory(
                    filter = s.inventoryFilter,
                    search = s.inventorySearch.ifBlank { null },
                )
                _state.update { it.copy(loading = false, inventory = res.items) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, error = e.message, snackbar = e.message)
                }
            }
        }
    }

    fun adjustStock(productId: String, delta: Int, notes: String?) {
        viewModelScope.launch {
            try {
                val reason = _state.value.inventoryReason.ifBlank { "adjustment" }
                val res = container.api.adminStockAdjust(
                    StockAdjustRequest(
                        productId = productId,
                        delta = delta,
                        notes = notes,
                        reason = reason,
                    ),
                )
                _state.update {
                    it.copy(snackbar = "${res.productName}: stock ${res.newStock}")
                }
                loadInventory()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Error ajuste") }
            }
        }
    }

    fun adjustStockByBarcode() {
        viewModelScope.launch {
            val code = _state.value.inventoryBarcode.trim()
            val delta = _state.value.inventoryCustomDelta.toIntOrNull()
            if (code.isBlank()) {
                _state.update { it.copy(snackbar = "Código de barras vacío") }
                return@launch
            }
            if (delta == null || delta == 0) {
                _state.update { it.copy(snackbar = "Delta inválido (ej. -1 o 5)") }
                return@launch
            }
            try {
                val product = container.api.productByBarcode(code)
                if (product == null) {
                    _state.update { it.copy(snackbar = "Código no encontrado") }
                    return@launch
                }
                adjustStock(product.id, delta, "barcode $code")
                _state.update { it.copy(inventoryBarcode = "", inventoryCustomDelta = "") }
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Error barcode stock") }
            }
        }
    }

    fun createFalta(productId: String?, productName: String) {
        viewModelScope.launch {
            try {
                container.api.adminCreateFalta(
                    CreateFaltaRequest(
                        productId = productId,
                        productName = productName,
                        quantity = 1,
                        notes = "Desde app móvil",
                    ),
                )
                _state.update { it.copy(snackbar = "Falta registrada: $productName") }
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Error falta") }
            }
        }
    }

    fun setPosSearch(q: String) {
        _state.update { it.copy(posSearch = q) }
        posSearchJob?.cancel()
        if (q.length < 2) {
            _state.update { it.copy(posResults = emptyList()) }
            return
        }
        posSearchJob = viewModelScope.launch {
            delay(350)
            searchPosProducts()
        }
    }

    fun setPosBarcode(code: String) {
        _state.update { it.copy(posBarcode = code) }
    }

    fun scanBarcode(code: String? = null) {
        viewModelScope.launch {
            val raw = (code ?: _state.value.posBarcode).trim()
            if (raw.isBlank()) {
                _state.update { it.copy(snackbar = "Ingresa un código de barras") }
                return@launch
            }
            _state.update { it.copy(posBusy = true) }
            try {
                val product = container.api.productByBarcode(raw)
                if (product == null) {
                    _state.update {
                        it.copy(posBusy = false, snackbar = "Código no encontrado: $raw", posBarcode = "")
                    }
                    return@launch
                }
                addPosLine(product)
                _state.update {
                    it.copy(
                        posBusy = false,
                        posBarcode = "",
                        snackbar = "+ ${product.name}",
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        posBusy = false,
                        snackbar = (e as? ApiException)?.message ?: e.message ?: "Error barcode",
                    )
                }
            }
        }
    }

    fun searchPosProducts() {
        viewModelScope.launch {
            val q = _state.value.posSearch
            if (q.length < 2) return@launch
            try {
                // Pure digits of length >= 8 → try barcode first
                if (q.all { it.isDigit() } && q.length >= 8) {
                    val byBar = container.api.productByBarcode(q)
                    if (byBar != null) {
                        _state.update { it.copy(posResults = listOf(byBar)) }
                        return@launch
                    }
                }
                val page = container.api.listProducts(page = 1, limit = 20, search = q, activeOnly = true)
                _state.update { it.copy(posResults = page.products) }
            } catch (_: Exception) {
                _state.update { it.copy(posResults = emptyList()) }
            }
        }
    }

    fun addPosLine(p: Product) {
        _state.update { s ->
            val existing = s.posCart.find { it.productId == p.id }
            val cart = if (existing != null) {
                s.posCart.map {
                    if (it.productId == p.id) it.copy(quantity = it.quantity + 1) else it
                }
            } else {
                s.posCart + PosLine(p.id, p.name, p.unitPrice(), 1)
            }
            s.copy(posCart = cart)
        }
    }

    fun setPosQty(productId: String, qty: Int) {
        _state.update { s ->
            s.copy(
                posCart = if (qty <= 0) s.posCart.filterNot { it.productId == productId }
                else s.posCart.map { if (it.productId == productId) it.copy(quantity = qty) else it },
            )
        }
    }

    fun setPosPayment(method: String) {
        _state.update { it.copy(posPayment = method) }
    }

    fun setPosCustomer(name: String, phone: String) {
        _state.update { it.copy(posCustomer = name, posPhone = phone) }
    }

    fun setPosDiscount(value: String) {
        _state.update { it.copy(posDiscount = value.filter { ch -> ch.isDigit() || ch == '.' }) }
    }

    fun setPosMixedAmounts(cash: String, card: String) {
        _state.update {
            it.copy(
                posCashAmount = cash.filter { ch -> ch.isDigit() || ch == '.' },
                posCardAmount = card.filter { ch -> ch.isDigit() || ch == '.' },
            )
        }
    }

    fun setPosPickupCode(code: String) {
        _state.update { it.copy(posPickupCode = code.filter { it.isDigit() }.take(6)) }
    }

    fun lookupPickup() {
        viewModelScope.launch {
            val code = _state.value.posPickupCode.trim()
            if (code.length != 6) {
                _state.update { it.copy(snackbar = "Código de retiro: 6 dígitos") }
                return@launch
            }
            _state.update { it.copy(posPickupLoading = true, posPickup = null) }
            try {
                val order = container.api.adminPosPickup(code)
                _state.update { it.copy(posPickupLoading = false, posPickup = order) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        posPickupLoading = false,
                        snackbar = (e as? ApiException)?.message ?: e.message ?: "Reserva no encontrada",
                    )
                }
            }
        }
    }

    fun clearPickup() {
        _state.update { it.copy(posPickup = null, posPickupCode = "") }
    }

    fun lookupCustomerHistory() {
        viewModelScope.launch {
            val phone = _state.value.posPhone.trim()
            if (phone.length < 4) {
                _state.update { it.copy(snackbar = "Teléfono mínimo 4 dígitos") }
                return@launch
            }
            try {
                val hist = container.api.adminPosCustomerHistory(phone = phone)
                if (!hist.found) {
                    _state.update {
                        it.copy(posCustomerHistory = null, posCustomerUserId = null, snackbar = "Cliente no encontrado")
                    }
                    return@launch
                }
                _state.update { s ->
                    s.copy(
                        posCustomerHistory = hist,
                        posCustomerUserId = hist.userId,
                        posCustomer = hist.name?.takeIf { it.isNotBlank() } ?: s.posCustomer,
                        posPhone = hist.phone?.takeIf { it.isNotBlank() } ?: s.posPhone,
                        snackbar = "Cliente: ${hist.name ?: "—"} · ${hist.loyaltyPoints ?: 0} pts",
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(snackbar = (e as? ApiException)?.message ?: e.message ?: "Error historial")
                }
            }
        }
    }

    fun clearPos() {
        _state.update {
            it.copy(
                posCart = emptyList(),
                posResults = emptyList(),
                posSearch = "",
                posBarcode = "",
                posDiscount = "",
                posCashAmount = "",
                posCardAmount = "",
                posCustomerUserId = null,
                posCustomerHistory = null,
            )
        }
    }

    fun submitPos() {
        viewModelScope.launch {
            val s = _state.value
            if (s.posCart.isEmpty()) {
                _state.update { it.copy(snackbar = "Carrito POS vacío") }
                return@launch
            }
            val subtotal = s.posCart.sumOf { it.lineTotal }
            val discount = s.posDiscount.toDoubleOrNull()?.coerceAtLeast(0.0) ?: 0.0
            val total = (subtotal - discount).coerceAtLeast(0.0)
            val method = s.posPayment

            val cashAmount: Double?
            val cardAmount: Double?
            when (method) {
                "pos_cash" -> {
                    cashAmount = total
                    cardAmount = null
                }
                "pos_debit", "pos_credit" -> {
                    cashAmount = null
                    cardAmount = total
                }
                "pos_mixed" -> {
                    cashAmount = s.posCashAmount.toDoubleOrNull()
                    cardAmount = s.posCardAmount.toDoubleOrNull()
                    if (cashAmount == null || cardAmount == null) {
                        _state.update { it.copy(snackbar = "Completa montos efectivo y tarjeta") }
                        return@launch
                    }
                    val sum = cashAmount + cardAmount
                    if (kotlin.math.abs(sum - total) > 1.0) {
                        _state.update {
                            it.copy(
                                snackbar = "Mixta debe sumar ${total.roundToInt()} (va ${sum.roundToInt()})",
                            )
                        }
                        return@launch
                    }
                }
                else -> {
                    cashAmount = total
                    cardAmount = null
                }
            }

            _state.update { it.copy(posBusy = true) }
            try {
                val res = container.api.adminPosSale(
                    PosSaleRequest(
                        items = s.posCart.map {
                            PosSaleItem(it.productId, it.name, it.quantity, it.unitPrice)
                        },
                        paymentMethod = method,
                        cashAmount = cashAmount,
                        cardAmount = cardAmount,
                        customerName = s.posCustomer.ifBlank { null },
                        customerPhone = s.posPhone.ifBlank { null },
                        discountAmount = if (discount > 0) discount else null,
                        customerUserId = s.posCustomerUserId,
                    ),
                )
                _state.update {
                    it.copy(
                        posBusy = false,
                        posCart = emptyList(),
                        posDiscount = "",
                        posCashAmount = "",
                        posCardAmount = "",
                        snackbar = "Venta OK ${res.id?.take(8) ?: ""} total ${res.total ?: ""}",
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        posBusy = false,
                        snackbar = (e as? ApiException)?.message ?: e.message ?: "Error POS",
                    )
                }
            }
        }
    }

    fun loadClientes() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val res = container.api.adminClientes()
                val all = (res.registered + res.guests).sortedByDescending { it.totalSpend }
                _state.update { it.copy(loading = false, clients = all) }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, snackbar = e.message) }
            }
        }
    }

    fun loadSuppliers() {
        viewModelScope.launch {
            try {
                val res = container.api.adminSuppliers()
                _state.update { it.copy(suppliers = res.suppliers) }
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Solo owner ve proveedores") }
            }
        }
    }

    fun loadPurchaseOrders() {
        viewModelScope.launch {
            try {
                val res = container.api.adminPurchaseOrders(page = 1, limit = 40)
                _state.update { it.copy(purchaseOrders = res.orders) }
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Solo owner ve compras") }
            }
        }
    }

    fun loadPurchaseOrderDetail(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, purchaseOrderDetail = null) }
            try {
                val po = container.api.adminGetPurchaseOrder(id)
                _state.update { it.copy(loading = false, purchaseOrderDetail = po) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(loading = false, snackbar = e.message ?: "Error OC")
                }
            }
        }
    }

    fun clearPurchaseOrderDetail() {
        _state.update { it.copy(purchaseOrderDetail = null) }
    }

    fun receivePurchaseOrder(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(purchaseOrderBusy = true) }
            try {
                val res = container.api.adminReceivePurchaseOrder(id)
                _state.update {
                    it.copy(
                        purchaseOrderBusy = false,
                        snackbar = "Recibida: ${res.itemsUpdated} ítems (+${res.itemsSkipped} sin mapear)",
                    )
                }
                loadPurchaseOrderDetail(id)
                loadPurchaseOrders()
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        purchaseOrderBusy = false,
                        snackbar = (e as? ApiException)?.message ?: e.message ?: "Error recepción",
                    )
                }
            }
        }
    }

    fun setBatchesFilter(filter: String?) {
        _state.update { it.copy(batchesFilter = filter) }
        loadBatches()
    }

    fun loadBatches() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val res = container.api.adminBatches(filter = _state.value.batchesFilter)
                _state.update {
                    it.copy(
                        loading = false,
                        batches = res.batches,
                        batchesExpired = res.summary.expired,
                        batchesSoon30 = res.summary.soon30,
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, snackbar = e.message) }
            }
        }
    }

    fun loadReorderSuggestions() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val res = container.api.adminReorderSuggestions()
                _state.update {
                    it.copy(
                        loading = false,
                        reorderGroups = res.groups,
                        reorderThreshold = res.threshold,
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, snackbar = e.message) }
            }
        }
    }

    fun loadFinanzas() {
        viewModelScope.launch {
            try {
                val f = container.api.adminFinanzasDashboard()
                val ap = runCatching { container.api.adminApList(paid = false, limit = 40) }.getOrNull()
                val g = runCatching { container.api.adminGastos(limit = 30) }.getOrNull()
                _state.update {
                    it.copy(
                        finanzas = f,
                        apOrders = ap?.orders.orEmpty(),
                        gastos = g?.gastos.orEmpty(),
                        gastoCategories = g?.categories.orEmpty(),
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Solo owner ve finanzas") }
            }
        }
    }

    fun payAp(id: String, amount: Double, method: String = "transfer") {
        viewModelScope.launch {
            try {
                container.api.adminApPay(
                    id,
                    ApPayRequest(amount = amount, paymentMethod = method, markFullyPaid = true),
                )
                _state.update { it.copy(snackbar = "Pago AP registrado") }
                loadFinanzas()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = (e as? ApiException)?.message ?: e.message) }
            }
        }
    }

    fun createGasto(categoryId: String, description: String, amount: Double, method: String?) {
        viewModelScope.launch {
            try {
                container.api.adminCreateGasto(
                    CreateGastoRequest(
                        categoryId = categoryId,
                        description = description,
                        amount = amount,
                        expenseDate = LocalDate.now().toString(),
                        paymentMethod = method,
                    ),
                )
                _state.update { it.copy(snackbar = "Gasto registrado") }
                loadFinanzas()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = (e as? ApiException)?.message ?: e.message) }
            }
        }
    }

    fun loadDevoluciones() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val res = container.api.adminDevoluciones()
                _state.update { it.copy(loading = false, devoluciones = res.devoluciones) }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, snackbar = e.message) }
            }
        }
    }

    fun createDevolucion(
        productName: String,
        quantity: Int,
        unitPrice: Double,
        motivo: String,
        productId: String? = null,
        restock: Boolean = true,
    ) {
        viewModelScope.launch {
            try {
                container.api.adminCreateDevolucion(
                    CreateDevolucionRequest(
                        motivo = motivo,
                        metodoReembolso = "efectivo",
                        items = listOf(
                            CreateDevolucionItem(
                                productId = productId,
                                productName = productName,
                                quantity = quantity,
                                unitPrice = unitPrice,
                                restock = restock,
                            ),
                        ),
                    ),
                )
                _state.update { it.copy(snackbar = "Devolución registrada") }
                loadDevoluciones()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = (e as? ApiException)?.message ?: e.message) }
            }
        }
    }

    fun loadUnknownBarcodes() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val res = container.api.adminUnknownBarcodes()
                _state.update { it.copy(loading = false, unknownBarcodes = res.items) }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, snackbar = e.message) }
            }
        }
    }

    fun dismissUnknownBarcode(barcode: String) {
        viewModelScope.launch {
            try {
                container.api.adminDismissUnknownBarcode(barcode)
                _state.update { it.copy(snackbar = "Barcode descartado") }
                loadUnknownBarcodes()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message) }
            }
        }
    }

    fun openProductEdit(productId: String) {
        viewModelScope.launch {
            _state.update { it.copy(editProductBusy = true, editProduct = null) }
            try {
                val p = container.api.adminGetProduct(productId)
                _state.update { it.copy(editProductBusy = false, editProduct = p) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(editProductBusy = false, snackbar = e.message ?: "No se pudo cargar producto")
                }
            }
        }
    }

    fun clearProductEdit() {
        _state.update { it.copy(editProduct = null) }
    }

    fun saveProductEdit(price: Double?, stock: Int?, discountPercent: Int?) {
        viewModelScope.launch {
            val id = _state.value.editProduct?.id ?: return@launch
            _state.update { it.copy(editProductBusy = true) }
            try {
                val updated = container.api.adminUpdateProduct(
                    id,
                    AdminProductUpdate(
                        price = price,
                        stock = stock,
                        discountPercent = discountPercent,
                    ),
                )
                _state.update {
                    it.copy(
                        editProductBusy = false,
                        editProduct = updated,
                        snackbar = "Producto actualizado",
                    )
                }
                loadInventory()
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        editProductBusy = false,
                        snackbar = (e as? ApiException)?.message ?: e.message,
                    )
                }
            }
        }
    }

    fun loadTasks() {
        viewModelScope.launch {
            try {
                val res = container.api.adminTareas(scope = "open", status = "open")
                _state.update { it.copy(tasks = res.tasks) }
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message) }
            }
        }
    }

    fun completeTask(id: String) {
        viewModelScope.launch {
            try {
                container.api.adminTaskDone(id)
                _state.update { it.copy(snackbar = "Tarea completada") }
                loadTasks()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message) }
            }
        }
    }

    fun loadTurnos() {
        viewModelScope.launch {
            try {
                val res = container.api.adminTurnos()
                _state.update { it.copy(turnos = res.list) }
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message) }
            }
        }
    }

    fun loadFaltas() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val res = container.api.adminFaltas(status = "pending")
                _state.update {
                    it.copy(
                        loading = false,
                        faltas = res.faltas,
                        faltasPending = res.pendingCount ?: res.faltas.size,
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, snackbar = e.message) }
            }
        }
    }

    fun markFaltaNotified(id: String) {
        viewModelScope.launch {
            try {
                container.api.adminFaltaStatus(id, "notified")
                _state.update { it.copy(snackbar = "Falta marcada notificada") }
                loadFaltas()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message) }
            }
        }
    }

    fun loadArqueo() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true) }
            try {
                val a = container.api.adminArqueo()
                _state.update { it.copy(loading = false, arqueo = a) }
            } catch (e: Exception) {
                _state.update { it.copy(loading = false, snackbar = e.message) }
            }
        }
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return ErpViewModel(container) as T
                }
            }
    }
}
