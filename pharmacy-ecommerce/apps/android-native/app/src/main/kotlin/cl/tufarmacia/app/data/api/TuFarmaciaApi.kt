package cl.tufarmacia.app.data.api

import cl.tufarmacia.app.data.model.ApiError
import cl.tufarmacia.app.data.model.Category
import cl.tufarmacia.app.data.model.MeResponse
import cl.tufarmacia.app.data.model.OrderDto
import cl.tufarmacia.app.data.model.PaginatedOrders
import cl.tufarmacia.app.data.model.PaginatedProducts
import cl.tufarmacia.app.data.model.Product
import cl.tufarmacia.app.data.model.LoyaltyResponse
import cl.tufarmacia.app.data.model.ProfileResponse
import cl.tufarmacia.app.data.model.RegisterRequest
import cl.tufarmacia.app.data.model.RegisterResponse
import cl.tufarmacia.app.data.model.StorePickupRequest
import cl.tufarmacia.app.data.model.StorePickupResponse
import cl.tufarmacia.app.data.model.SuggestResponse
import cl.tufarmacia.app.data.model.TopSeller
import cl.tufarmacia.app.data.model.TrackingResponse
import cl.tufarmacia.app.data.model.WebpayCreateResponse
import cl.tufarmacia.app.data.model.ClientesResponse
import cl.tufarmacia.app.data.model.DashboardExtras
import cl.tufarmacia.app.data.model.FinanzasDashboard
import cl.tufarmacia.app.data.model.InventoryResponse
import cl.tufarmacia.app.data.model.OperacionesResponse
import cl.tufarmacia.app.data.model.AdminProductDto
import cl.tufarmacia.app.data.model.AdminProductUpdate
import cl.tufarmacia.app.data.model.ApListResponse
import cl.tufarmacia.app.data.model.ApPayRequest
import cl.tufarmacia.app.data.model.ApPayResponse
import cl.tufarmacia.app.data.model.BatchesResponse
import cl.tufarmacia.app.data.model.CreateDevolucionRequest
import cl.tufarmacia.app.data.model.CreateFaltaRequest
import cl.tufarmacia.app.data.model.CreateGastoRequest
import cl.tufarmacia.app.data.model.CreatePurchaseOrderRequest
import cl.tufarmacia.app.data.model.DevolucionDto
import cl.tufarmacia.app.data.model.DevolucionesResponse
import cl.tufarmacia.app.data.model.GastoDto
import cl.tufarmacia.app.data.model.GastosResponse
import cl.tufarmacia.app.data.model.PosCustomerHistory
import cl.tufarmacia.app.data.model.PosPickupOrder
import cl.tufarmacia.app.data.model.PosSaleRequest
import cl.tufarmacia.app.data.model.PosSaleResponse
import cl.tufarmacia.app.data.model.PurchaseOrderDto
import cl.tufarmacia.app.data.model.PurchaseOrdersResponse
import cl.tufarmacia.app.data.model.ReceivePoResponse
import cl.tufarmacia.app.data.model.ReorderSuggestionsResponse
import cl.tufarmacia.app.data.model.StockAdjustRequest
import cl.tufarmacia.app.data.model.StockAdjustResponse
import cl.tufarmacia.app.data.model.SuppliersResponse
import cl.tufarmacia.app.data.model.ArqueoActionResponse
import cl.tufarmacia.app.data.model.ArqueoResponse
import cl.tufarmacia.app.data.model.AvisosResponse
import cl.tufarmacia.app.data.model.CashFlowResponse
import cl.tufarmacia.app.data.model.CierreDiaEmailResponse
import cl.tufarmacia.app.data.model.CierreDiaResponse
import cl.tufarmacia.app.data.model.ClienteDetailResponse
import cl.tufarmacia.app.data.model.CreateAvisoRequest
import cl.tufarmacia.app.data.model.CreateAvisoResponse
import cl.tufarmacia.app.data.model.CreatePrescriptionRequest
import cl.tufarmacia.app.data.model.CreateTaskRequest
import cl.tufarmacia.app.data.model.DescuentosActionResponse
import cl.tufarmacia.app.data.model.DescuentosResponse
import cl.tufarmacia.app.data.model.ExpressReorderRequest
import cl.tufarmacia.app.data.model.ExpressReorderResponse
import cl.tufarmacia.app.data.model.FaltaDto
import cl.tufarmacia.app.data.model.FaltasResponse
import cl.tufarmacia.app.data.model.FarmaciaPanelResponse
import cl.tufarmacia.app.data.model.LiquidacionApplyRequest
import cl.tufarmacia.app.data.model.LiquidacionApplyResponse
import cl.tufarmacia.app.data.model.LiquidacionResponse
import cl.tufarmacia.app.data.model.PrescriptionRecordDto
import cl.tufarmacia.app.data.model.PrescriptionsResponse
import cl.tufarmacia.app.data.model.PylResponse
import cl.tufarmacia.app.data.model.ReportesResponse
import cl.tufarmacia.app.data.model.StockMovementsResponse
import cl.tufarmacia.app.data.model.TaskActionResponse
import cl.tufarmacia.app.data.model.TaskDto
import cl.tufarmacia.app.data.model.TasksResponse
import cl.tufarmacia.app.data.model.TurnosResponse
import cl.tufarmacia.app.data.model.UnknownBarcodesResponse
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class TuFarmaciaApi(
    private val baseUrl: String,
    private val tokenProvider: TokenProvider,
    private val httpClient: HttpClient = createHttpClient(baseUrl),
) {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    suspend fun listProducts(
        page: Int = 1,
        limit: Int = 20,
        search: String? = null,
        categorySlug: String? = null,
        activeOnly: Boolean = true,
        inStock: Boolean = false,
        stockFilter: String? = null,
        barcode: String? = null,
        sortBy: String? = null,
        hasDiscount: Boolean = false,
    ): PaginatedProducts {
        return get("/api/products") {
            parameter("page", page)
            parameter("limit", limit)
            parameter("active_only", activeOnly)
            if (!search.isNullOrBlank()) parameter("search", search)
            if (!categorySlug.isNullOrBlank()) parameter("category", categorySlug)
            if (inStock) parameter("in_stock", "true")
            if (!stockFilter.isNullOrBlank()) parameter("stock_filter", stockFilter)
            if (!barcode.isNullOrBlank()) parameter("barcode", barcode)
            if (!sortBy.isNullOrBlank()) parameter("sort_by", sortBy)
            if (hasDiscount) parameter("has_discount", "true")
        }
    }

    /** Exact barcode lookup; returns first product or null. */
    suspend fun productByBarcode(code: String): Product? {
        val page = listProducts(page = 1, limit = 1, barcode = code.trim(), activeOnly = true)
        return page.products.firstOrNull()
    }

    suspend fun getProduct(slug: String): Product = get("/api/products/$slug")

    suspend fun listCategories(): List<Category> = get("/api/categories")

    suspend fun suggest(q: String): SuggestResponse = get("/api/search/suggest") {
        parameter("q", q)
    }

    suspend fun topSellers(limit: Int = 8): List<TopSeller> =
        get("/api/products/top-sellers") {
            parameter("limit", limit)
        }

    suspend fun register(body: RegisterRequest): RegisterResponse =
        post("/api/auth/register", body = body, auth = false)

    suspend fun me(): MeResponse = get("/api/auth/me", auth = true)

    suspend fun updateProfilePhone(phone: String): ProfileResponse {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.patch("/api/profile") {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(buildJsonObject { put("phone", phone) })
        }
        return parse(response)
    }

    suspend fun loyalty(): LoyaltyResponse = get("/api/loyalty", auth = true)

    suspend fun track(token: String): TrackingResponse = get("/api/tracking/$token")

    suspend fun listOrders(page: Int = 1, limit: Int = 20): PaginatedOrders =
        get("/api/orders", auth = true) {
            parameter("page", page)
            parameter("limit", limit)
        }

    suspend fun getOrder(id: String): OrderDto = get("/api/orders/$id", auth = true)

    suspend fun storePickup(body: StorePickupRequest): StorePickupResponse =
        post("/api/store-pickup", body = body, auth = true)

    suspend fun webpayCreate(body: StorePickupRequest): WebpayCreateResponse =
        post("/api/webpay/create", body = body, auth = true)

    /** Admin orders (staff). */
    suspend fun adminListOrders(
        page: Int = 1,
        limit: Int = 20,
        status: String? = null,
        search: String? = null,
    ): PaginatedOrders =
        get("/api/admin/orders", auth = true) {
            parameter("page", page)
            parameter("limit", limit)
            if (!status.isNullOrBlank()) parameter("status", status)
            if (!search.isNullOrBlank()) parameter("search", search)
        }

    suspend fun adminOrderAction(orderId: String, action: String): OrderDto {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.put("/api/admin/orders/$orderId") {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(buildJsonObject { put("action", action) })
        }
        return parse(response)
    }

    suspend fun adminSetOrderStatus(orderId: String, status: String): OrderDto {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.put("/api/admin/orders/$orderId") {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(buildJsonObject { put("status", status) })
        }
        return parse(response)
    }

    // ── ERP modules ─────────────────────────────────────────────

    suspend fun adminOperaciones(): OperacionesResponse =
        get("/api/admin/operaciones", auth = true)

    suspend fun adminDashboardExtras(): DashboardExtras =
        get("/api/admin/dashboard-extras", auth = true)

    suspend fun adminInventory(filter: String? = null, search: String? = null): InventoryResponse =
        get("/api/admin/inventory", auth = true) {
            if (!filter.isNullOrBlank()) parameter("filter", filter)
            if (!search.isNullOrBlank()) parameter("search", search)
        }

    suspend fun adminStockAdjust(body: StockAdjustRequest): StockAdjustResponse =
        post("/api/admin/stock-movements/adjust", body = body, auth = true)

    suspend fun adminPosSale(body: PosSaleRequest): PosSaleResponse =
        post("/api/admin/pos/sale", body = body, auth = true)

    suspend fun adminPosPickup(code: String): PosPickupOrder =
        get("/api/admin/pos/pickup", auth = true) {
            parameter("code", code.trim())
        }

    suspend fun adminPosCustomerHistory(phone: String? = null, rut: String? = null): PosCustomerHistory =
        get("/api/admin/pos/customer-history", auth = true) {
            if (!phone.isNullOrBlank()) parameter("phone", phone)
            if (!rut.isNullOrBlank()) parameter("rut", rut)
        }

    suspend fun adminGetOrder(id: String): OrderDto =
        get("/api/admin/orders/$id", auth = true)

    suspend fun adminClientes(): ClientesResponse =
        get("/api/admin/clientes", auth = true)

    suspend fun adminSuppliers(): SuppliersResponse =
        get("/api/admin/suppliers", auth = true)

    suspend fun adminPurchaseOrders(
        page: Int = 1,
        limit: Int = 30,
        status: String? = null,
        paid: Boolean? = null,
    ): PurchaseOrdersResponse =
        get("/api/admin/purchase-orders", auth = true) {
            parameter("page", page)
            parameter("limit", limit)
            if (!status.isNullOrBlank()) parameter("status", status)
            if (paid != null) parameter("paid", paid)
        }

    suspend fun adminGetPurchaseOrder(id: String): PurchaseOrderDto =
        get("/api/admin/purchase-orders/$id", auth = true)

    suspend fun adminReceivePurchaseOrder(id: String): ReceivePoResponse {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.post("/api/admin/purchase-orders/$id/receive") {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
        }
        return parse(response)
    }

    suspend fun adminCreatePurchaseOrder(body: CreatePurchaseOrderRequest): PurchaseOrderDto =
        post("/api/admin/purchase-orders", body = body, auth = true)

    suspend fun adminBatches(filter: String? = "soon30"): BatchesResponse =
        get("/api/admin/batches", auth = true) {
            if (!filter.isNullOrBlank()) parameter("filter", filter)
        }

    suspend fun adminReorderSuggestions(): ReorderSuggestionsResponse =
        get("/api/admin/inventory/reorder-suggestions", auth = true)

    suspend fun adminCreateFalta(body: CreateFaltaRequest): FaltaDto =
        post("/api/admin/faltas", body = body, auth = true)

    suspend fun adminFinanzasDashboard(): FinanzasDashboard =
        get("/api/admin/finanzas/dashboard", auth = true)

    suspend fun adminDevoluciones(page: Int = 1, limit: Int = 30): DevolucionesResponse =
        get("/api/admin/devoluciones", auth = true) {
            parameter("page", page)
            parameter("limit", limit)
        }

    suspend fun adminCreateDevolucion(body: CreateDevolucionRequest): DevolucionDto =
        post("/api/admin/devoluciones", body = body, auth = true)

    suspend fun adminGetProduct(id: String): AdminProductDto =
        get("/api/admin/products/$id", auth = true)

    suspend fun adminUpdateProduct(id: String, body: AdminProductUpdate): AdminProductDto =
        putJson("/api/admin/products/$id", body)

    suspend fun adminUnknownBarcodes(): UnknownBarcodesResponse =
        get("/api/admin/barcodes/unknown", auth = true)

    suspend fun adminDismissUnknownBarcode(barcode: String) {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.delete("/api/admin/barcodes/unknown") {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(buildJsonObject { put("barcode", barcode) })
        }
        if (!response.status.isSuccess()) {
            val text = response.bodyAsText()
            throw ApiException(text.ifBlank { "HTTP ${response.status.value}" }, response.status.value)
        }
    }

    /** Assign unknown barcode to existing product. */
    suspend fun adminResolveUnknownBarcode(barcode: String, productId: String) {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.post("/api/admin/barcodes/unknown/resolve") {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(
                buildJsonObject {
                    put("barcode", barcode)
                    put("product_id", productId)
                },
            )
        }
        if (!response.status.isSuccess()) {
            val text = response.bodyAsText()
            val err = runCatching { json.decodeFromString<ApiError>(text) }.getOrNull()
            throw ApiException(
                message = err?.error ?: err?.detail ?: text.ifBlank { "HTTP ${response.status.value}" },
                statusCode = response.status.value,
                code = err?.code,
            )
        }
    }

    suspend fun adminApList(paid: Boolean = false, page: Int = 1, limit: Int = 30): ApListResponse =
        get("/api/admin/finanzas/ap", auth = true) {
            parameter("paid", paid)
            parameter("page", page)
            parameter("limit", limit)
        }

    suspend fun adminApPay(id: String, body: ApPayRequest): ApPayResponse {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.post("/api/admin/finanzas/ap/$id/pay") {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(body)
        }
        return parse(response)
    }

    suspend fun adminGastos(page: Int = 1, limit: Int = 30): GastosResponse =
        get("/api/admin/finanzas/gastos", auth = true) {
            parameter("page", page)
            parameter("limit", limit)
        }

    suspend fun adminCreateGasto(body: CreateGastoRequest): GastoDto =
        post("/api/admin/finanzas/gastos", body = body, auth = true)

    suspend fun adminTareas(scope: String = "mine", status: String? = null): TasksResponse =
        get("/api/admin/tareas", auth = true) {
            parameter("scope", scope)
            if (!status.isNullOrBlank()) parameter("status", status)
        }

    suspend fun adminTaskDone(taskId: String): TaskActionResponse =
        putJson("/api/admin/tareas/$taskId", buildJsonObject { put("action", "complete") })

    suspend fun adminTurnos(page: Int = 1, limit: Int = 20): TurnosResponse =
        get("/api/admin/turnos", auth = true) {
            parameter("page", page)
            parameter("limit", limit)
        }

    suspend fun adminFaltas(status: String? = "pending"): FaltasResponse =
        get("/api/admin/faltas", auth = true) {
            if (!status.isNullOrBlank()) parameter("status", status)
        }

    suspend fun adminFaltaStatus(id: String, status: String): FaltaDto =
        patchJson("/api/admin/faltas/$id", buildJsonObject { put("status", status) })

    suspend fun adminArqueo(): ArqueoResponse =
        get("/api/admin/arqueo", auth = true)

    suspend fun adminArqueoAction(body: kotlinx.serialization.json.JsonObject): ArqueoActionResponse =
        post("/api/admin/arqueo", body = body, auth = true)

    suspend fun adminAvisos(): AvisosResponse =
        get("/api/admin/avisos", auth = true)

    suspend fun adminCreateAviso(body: CreateAvisoRequest): CreateAvisoResponse =
        post("/api/admin/avisos", body = body, auth = true)

    suspend fun adminCierreDia(date: String? = null): CierreDiaResponse =
        get("/api/admin/cierre-dia", auth = true) {
            if (!date.isNullOrBlank()) parameter("date", date)
        }

    suspend fun adminCierreDiaEmail(date: String? = null, to: String? = null): CierreDiaEmailResponse {
        val body = buildJsonObject {
            if (!date.isNullOrBlank()) put("date", date)
            if (!to.isNullOrBlank()) put("to", to)
        }
        return post("/api/admin/cierre-dia/email", body = body, auth = true)
    }

    suspend fun adminStockMovements(
        page: Int = 1,
        limit: Int = 50,
        productId: String? = null,
        reason: String? = null,
    ): StockMovementsResponse =
        get("/api/admin/stock-movements", auth = true) {
            parameter("page", page)
            parameter("limit", limit)
            if (!productId.isNullOrBlank()) parameter("product_id", productId)
            if (!reason.isNullOrBlank()) parameter("reason", reason)
        }

    suspend fun adminClienteDetail(id: String, guestEmail: String? = null): ClienteDetailResponse =
        get("/api/admin/clientes/$id", auth = true) {
            if (!guestEmail.isNullOrBlank()) parameter("email", guestEmail)
        }

    suspend fun adminCreateTask(body: CreateTaskRequest): TaskDto =
        post("/api/admin/tareas", body = body, auth = true)

    suspend fun adminReposicionExpress(body: ExpressReorderRequest): ExpressReorderResponse =
        post("/api/admin/reposicion/express", body = body, auth = true)

    suspend fun adminPrescriptions(
        page: Int = 1,
        controlled: Boolean? = null,
        from: String? = null,
        to: String? = null,
    ): PrescriptionsResponse =
        get("/api/admin/prescriptions", auth = true) {
            parameter("page", page)
            if (controlled != null) parameter("controlled", controlled.toString())
            if (!from.isNullOrBlank()) parameter("from", from)
            if (!to.isNullOrBlank()) parameter("to", to)
        }

    suspend fun adminCreatePrescription(body: CreatePrescriptionRequest): PrescriptionRecordDto =
        post("/api/admin/prescriptions", body = body, auth = true)

    suspend fun adminDescuentos(): DescuentosResponse =
        get("/api/admin/descuentos", auth = true)

    /**
     * Bulk discount actions.
     * @param action `apply_bulk` | `remove_bulk` | `update_loyalty`
     */
    suspend fun adminDescuentosAction(body: kotlinx.serialization.json.JsonObject): DescuentosActionResponse =
        post("/api/admin/descuentos", body = body, auth = true)

    /** Owner reportes: KPIs, canal, top productos, clientes. */
    suspend fun adminReportes(from: String? = null, to: String? = null): ReportesResponse =
        get("/api/admin/reportes", auth = true) {
            if (!from.isNullOrBlank()) parameter("from", from)
            if (!to.isNullOrBlank()) parameter("to", to)
        }

    /** Owner cash-flow 30d real + 30d proyección. */
    suspend fun adminCashFlow(): CashFlowResponse =
        get("/api/admin/finanzas/cash-flow", auth = true)

    /** Owner PyL mensual por año. */
    suspend fun adminPyl(year: Int? = null): PylResponse =
        get("/api/admin/finanzas/pyl", auth = true) {
            if (year != null) parameter("year", year)
        }

    /** Panel farmacéutico: recetas, sin registro, lotes, turno. */
    suspend fun adminFarmaciaPanel(): FarmaciaPanelResponse =
        get("/api/admin/farmacia", auth = true)

    /** Liquidación por vencimiento (≤60d). */
    suspend fun adminLiquidacion(): LiquidacionResponse =
        get("/api/admin/farmacia/liquidacion", auth = true)

    /** Aplicar descuentos de liquidación a productos seleccionados. */
    suspend fun adminApplyLiquidacion(body: LiquidacionApplyRequest): LiquidacionApplyResponse =
        post("/api/admin/farmacia/liquidacion", body = body, auth = true)

    private suspend inline fun <reified T> patchJson(path: String, body: Any): T {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.patch(path) {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(body)
        }
        return parse(response)
    }

    private suspend inline fun <reified T> putJson(path: String, body: Any): T {
        val token = tokenProvider.currentIdToken()
            ?: throw ApiException("Not authenticated", statusCode = 401)
        val response = httpClient.put(path) {
            contentType(ContentType.Application.Json)
            bearerAuth(token)
            setBody(body)
        }
        return parse(response)
    }

    private suspend inline fun <reified T> get(
        path: String,
        auth: Boolean = false,
        crossinline block: HttpRequestBuilder.() -> Unit = {},
    ): T {
        val token = if (auth) {
            tokenProvider.currentIdToken()
                ?: throw ApiException("Not authenticated", statusCode = 401)
        } else null
        val response = httpClient.get(path) {
            contentType(ContentType.Application.Json)
            if (token != null) bearerAuth(token)
            block()
        }
        return parse(response)
    }

    private suspend inline fun <reified T> post(
        path: String,
        body: Any,
        auth: Boolean = false,
    ): T {
        val token = if (auth) {
            tokenProvider.currentIdToken()
                ?: throw ApiException("Not authenticated", statusCode = 401)
        } else null
        val response = httpClient.post(path) {
            contentType(ContentType.Application.Json)
            if (token != null) bearerAuth(token)
            setBody(body)
        }
        return parse(response)
    }

    private suspend inline fun <reified T> parse(response: HttpResponse): T {
        if (!response.status.isSuccess()) {
            val text = response.bodyAsText()
            val err = runCatching { json.decodeFromString<ApiError>(text) }.getOrNull()
            throw ApiException(
                message = err?.error ?: err?.detail ?: text.ifBlank { "HTTP ${response.status.value}" },
                statusCode = response.status.value,
                code = err?.code,
            )
        }
        return response.body()
    }

    fun close() = httpClient.close()

    companion object {
        fun createHttpClient(baseUrl: String): HttpClient = HttpClient(OkHttp) {
            expectSuccess = false
            install(ContentNegotiation) {
                json(
                    Json {
                        ignoreUnknownKeys = true
                        isLenient = true
                        coerceInputValues = true
                    }
                )
            }
            install(HttpTimeout) {
                requestTimeoutMillis = 30_000
                connectTimeoutMillis = 15_000
            }
            install(Logging) {
                level = LogLevel.INFO
            }
            defaultRequest {
                url(if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/")
            }
        }
    }
}
