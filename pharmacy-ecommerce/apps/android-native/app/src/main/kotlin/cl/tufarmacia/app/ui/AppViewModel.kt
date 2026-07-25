package cl.tufarmacia.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import cl.tufarmacia.app.data.AppContainer
import cl.tufarmacia.app.data.api.ApiException
import cl.tufarmacia.app.data.model.AuthUser
import cl.tufarmacia.app.data.model.CartLine
import cl.tufarmacia.app.data.model.Category
import cl.tufarmacia.app.data.model.OrderDto
import cl.tufarmacia.app.data.model.Product
import cl.tufarmacia.app.data.model.LoyaltyResponse
import cl.tufarmacia.app.data.model.RegisterRequest
import cl.tufarmacia.app.data.model.StorePickupItem
import cl.tufarmacia.app.data.model.StorePickupRequest
import cl.tufarmacia.app.data.model.StorePickupResponse
import cl.tufarmacia.app.data.model.TopSeller
import cl.tufarmacia.app.data.model.TrackingResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AppUiState(
    val bootstrapped: Boolean = false,
    val user: AuthUser? = null,
    val loginLoading: Boolean = false,
    val loginError: String? = null,

    val products: List<Product> = emptyList(),
    val productsLoading: Boolean = false,
    val productsError: String? = null,
    val productsTotal: Int = 0,
    val productsPage: Int = 1,
    val productsTotalPages: Int = 1,
    val searchQuery: String = "",
    val selectedCategorySlug: String? = null,
    val categories: List<Category> = emptyList(),

    val productDetail: Product? = null,
    val productDetailLoading: Boolean = false,
    val productDetailError: String? = null,

    val orders: List<OrderDto> = emptyList(),
    val ordersLoading: Boolean = false,
    val ordersError: String? = null,
    val orderDetail: OrderDto? = null,
    val orderDetailLoading: Boolean = false,

    val checkoutName: String = "",
    val checkoutSurname: String = "",
    val checkoutPhone: String = "",
    val checkoutEmail: String = "",
    val checkoutNotes: String = "",
    val checkoutUsePoints: Boolean = false,
    val checkoutLoading: Boolean = false,
    val checkoutError: String? = null,
    val checkoutSuccess: StorePickupResponse? = null,

    val adminOrders: List<OrderDto> = emptyList(),
    val adminOrdersLoading: Boolean = false,
    val adminOrdersError: String? = null,
    val adminStatusFilter: String? = null,
    val adminSearch: String = "",
    val lowStock: List<Product> = emptyList(),
    val lowStockLoading: Boolean = false,

    val topSellers: List<TopSeller> = emptyList(),

    val registerLoading: Boolean = false,
    val registerError: String? = null,
    val registerSuccess: Boolean = false,

    val loyalty: LoyaltyResponse? = null,
    val trackingTokenInput: String = "",
    val trackingResult: TrackingResponse? = null,
    val trackingLoading: Boolean = false,
    val trackingError: String? = null,

    val snackbar: String? = null,
)

class AppViewModel(private val container: AppContainer) : ViewModel() {
    private val _state = MutableStateFlow(AppUiState())
    val state: StateFlow<AppUiState> = _state.asStateFlow()

    val cartLines: StateFlow<List<CartLine>> = container.cartRepository.lines
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    init {
        viewModelScope.launch {
            val user = runCatching { container.sessionRepository.restore() }.getOrNull()
            _state.update {
                it.copy(
                    bootstrapped = true,
                    user = user,
                    checkoutEmail = user?.email.orEmpty(),
                    checkoutName = user?.name.orEmpty(),
                )
            }
            loadProducts()
            loadCategories()
            loadTopSellers()
            if (user != null) {
                loadOrders()
                loadLoyalty()
            }
            if (user?.isAdmin == true) loadAdminOrders()
        }
    }

    fun loadLoyalty() {
        viewModelScope.launch {
            if (_state.value.user == null) return@launch
            runCatching { container.api.loyalty() }
                .onSuccess { l -> _state.update { it.copy(loyalty = l) } }
        }
    }

    fun onTrackingTokenChange(t: String) {
        _state.update { it.copy(trackingTokenInput = t, trackingError = null) }
    }

    fun trackOrder() {
        viewModelScope.launch {
            val token = _state.value.trackingTokenInput.trim()
            if (token.length < 16) {
                _state.update { it.copy(trackingError = "Token inválido") }
                return@launch
            }
            _state.update { it.copy(trackingLoading = true, trackingError = null, trackingResult = null) }
            try {
                val res = container.api.track(token)
                _state.update { it.copy(trackingLoading = false, trackingResult = res) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        trackingLoading = false,
                        trackingError = e.message ?: "No encontrado",
                    )
                }
            }
        }
    }

    fun loadTopSellers() {
        viewModelScope.launch {
            runCatching { container.api.topSellers(8) }
                .onSuccess { list -> _state.update { it.copy(topSellers = list) } }
        }
    }

    fun register(email: String, password: String, name: String, surname: String, phone: String) {
        viewModelScope.launch {
            _state.update { it.copy(registerLoading = true, registerError = null, registerSuccess = false) }
            try {
                val res = container.api.register(
                    RegisterRequest(
                        email = email.trim(),
                        password = password,
                        name = name.trim(),
                        surname = surname.trim().ifBlank { null },
                        phone = phone.trim().ifBlank { null },
                    )
                )
                if (!res.success && res.error != null) {
                    _state.update { it.copy(registerLoading = false, registerError = res.error) }
                    return@launch
                }
                // auto login after register
                val user = container.sessionRepository.login(email.trim(), password)
                _state.update {
                    it.copy(
                        registerLoading = false,
                        registerSuccess = true,
                        user = user,
                        checkoutEmail = user.email.orEmpty(),
                        checkoutName = user.name.orEmpty(),
                        snackbar = "Cuenta creada",
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        registerLoading = false,
                        registerError = (e as? ApiException)?.message ?: e.message ?: "Error al registrar",
                    )
                }
            }
        }
    }

    fun consumeSnackbar() {
        _state.update { it.copy(snackbar = null) }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _state.update { it.copy(loginLoading = true, loginError = null) }
            try {
                val user = container.sessionRepository.login(email, password)
                _state.update {
                    it.copy(
                        loginLoading = false,
                        user = user,
                        loginError = null,
                        checkoutEmail = user.email.orEmpty(),
                        checkoutName = user.name.orEmpty(),
                    )
                }
                loadOrders()
                loadLoyalty()
                if (user.isAdmin) loadAdminOrders()
            } catch (e: Exception) {
                val msg = (e as? ApiException)?.message ?: e.message ?: "Error al iniciar sesión"
                _state.update { it.copy(loginLoading = false, loginError = msg) }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            container.sessionRepository.logout()
            _state.update {
                it.copy(
                    user = null,
                    orders = emptyList(),
                    orderDetail = null,
                    adminOrders = emptyList(),
                )
            }
        }
    }

    fun onSearchChange(q: String) {
        _state.update { it.copy(searchQuery = q) }
    }

    fun selectCategory(slug: String?) {
        _state.update { it.copy(selectedCategorySlug = slug) }
        loadProducts()
    }

    fun loadCategories() {
        viewModelScope.launch {
            runCatching { container.api.listCategories() }
                .onSuccess { cats -> _state.update { it.copy(categories = cats) } }
        }
    }

    fun loadProducts(page: Int = 1, append: Boolean = false) {
        viewModelScope.launch {
            _state.update { it.copy(productsLoading = true, productsError = null) }
            try {
                val s = _state.value
                val result = container.api.listProducts(
                    page = page,
                    limit = 24,
                    search = s.searchQuery.ifBlank { null },
                    categorySlug = s.selectedCategorySlug,
                )
                _state.update {
                    it.copy(
                        productsLoading = false,
                        products = if (append) it.products + result.products else result.products,
                        productsTotal = result.total,
                        productsPage = result.page,
                        productsTotalPages = result.totalPages.coerceAtLeast(1),
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        productsLoading = false,
                        productsError = e.message ?: "No se pudo cargar el catálogo",
                    )
                }
            }
        }
    }

    fun loadMoreProducts() {
        val s = _state.value
        if (s.productsLoading || s.productsPage >= s.productsTotalPages) return
        loadProducts(page = s.productsPage + 1, append = true)
    }

    fun loadProductDetail(slug: String) {
        viewModelScope.launch {
            _state.update {
                it.copy(productDetailLoading = true, productDetailError = null, productDetail = null)
            }
            try {
                val p = container.api.getProduct(slug)
                _state.update { it.copy(productDetailLoading = false, productDetail = p) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        productDetailLoading = false,
                        productDetailError = e.message ?: "Producto no encontrado",
                    )
                }
            }
        }
    }

    fun addToCart(product: Product, qty: Int = 1) {
        viewModelScope.launch {
            container.cartRepository.add(product, qty)
            _state.update { it.copy(snackbar = "Agregado al carrito") }
        }
    }

    fun setCartQty(productId: String, qty: Int) {
        viewModelScope.launch { container.cartRepository.setQuantity(productId, qty) }
    }

    fun removeFromCart(productId: String) {
        viewModelScope.launch { container.cartRepository.remove(productId) }
    }

    fun clearCart() {
        viewModelScope.launch { container.cartRepository.clear() }
    }

    fun updateCheckoutField(
        name: String? = null,
        surname: String? = null,
        phone: String? = null,
        email: String? = null,
        notes: String? = null,
    ) {
        _state.update {
            it.copy(
                checkoutName = name ?: it.checkoutName,
                checkoutSurname = surname ?: it.checkoutSurname,
                checkoutPhone = phone ?: it.checkoutPhone,
                checkoutEmail = email ?: it.checkoutEmail,
                checkoutNotes = notes ?: it.checkoutNotes,
                checkoutError = null,
            )
        }
    }

    fun setCheckoutUsePoints(use: Boolean) {
        _state.update { it.copy(checkoutUsePoints = use) }
    }

    fun clearCheckoutSuccess() {
        _state.update { it.copy(checkoutSuccess = null, checkoutError = null) }
    }

    fun submitStorePickup(lines: List<CartLine>) {
        viewModelScope.launch {
            val s = _state.value
            if (s.user == null) {
                _state.update { it.copy(checkoutError = "Inicia sesión para reservar retiro en tienda") }
                return@launch
            }
            if (lines.isEmpty()) {
                _state.update { it.copy(checkoutError = "El carrito está vacío") }
                return@launch
            }
            if (s.checkoutPhone.isBlank()) {
                _state.update { it.copy(checkoutError = "Teléfono es obligatorio") }
                return@launch
            }
            _state.update { it.copy(checkoutLoading = true, checkoutError = null, checkoutSuccess = null) }
            try {
                val res = container.api.storePickup(
                    StorePickupRequest(
                        items = lines.map { StorePickupItem(it.productId, it.quantity) },
                        name = s.checkoutName.ifBlank { "Cliente" },
                        surname = s.checkoutSurname,
                        email = s.checkoutEmail.ifBlank { s.user.email },
                        phone = s.checkoutPhone.trim(),
                        notes = s.checkoutNotes.ifBlank { null },
                        sessionId = container.guestSessionId,
                        usePoints = s.checkoutUsePoints,
                    )
                )
                container.cartRepository.clear()
                _state.update {
                    it.copy(checkoutLoading = false, checkoutSuccess = res, snackbar = "Reserva creada")
                }
                loadOrders()
                loadLoyalty()
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        checkoutLoading = false,
                        checkoutError = (e as? ApiException)?.message ?: e.message ?: "Error al reservar",
                    )
                }
            }
        }
    }

    fun loadOrders() {
        viewModelScope.launch {
            if (_state.value.user == null) return@launch
            _state.update { it.copy(ordersLoading = true, ordersError = null) }
            try {
                val page = container.api.listOrders(page = 1, limit = 30)
                _state.update { it.copy(ordersLoading = false, orders = page.orders) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        ordersLoading = false,
                        ordersError = e.message ?: "No se pudieron cargar pedidos",
                    )
                }
            }
        }
    }

    fun loadOrderDetail(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(orderDetailLoading = true, orderDetail = null) }
            try {
                val o = container.api.getOrder(id)
                _state.update { it.copy(orderDetailLoading = false, orderDetail = o) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        orderDetailLoading = false,
                        ordersError = e.message ?: "Pedido no encontrado",
                    )
                }
            }
        }
    }

    fun setAdminStatusFilter(status: String?) {
        _state.update { it.copy(adminStatusFilter = status) }
        loadAdminOrders()
    }

    fun setAdminSearch(q: String) {
        _state.update { it.copy(adminSearch = q) }
    }

    fun loadAdminOrders() {
        viewModelScope.launch {
            if (_state.value.user?.isAdmin != true) return@launch
            _state.update { it.copy(adminOrdersLoading = true, adminOrdersError = null) }
            try {
                val s = _state.value
                val page = container.api.adminListOrders(
                    page = 1,
                    limit = 40,
                    status = s.adminStatusFilter,
                    search = s.adminSearch.ifBlank { null },
                )
                _state.update { it.copy(adminOrdersLoading = false, adminOrders = page.orders) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        adminOrdersLoading = false,
                        adminOrdersError = e.message ?: "Sin acceso a órdenes admin",
                    )
                }
            }
        }
    }

    fun loadLowStock() {
        viewModelScope.launch {
            if (_state.value.user?.isAdmin != true) return@launch
            _state.update { it.copy(lowStockLoading = true) }
            try {
                val page = container.api.listProducts(
                    page = 1,
                    limit = 40,
                    stockFilter = "low",
                    activeOnly = true,
                )
                _state.update { it.copy(lowStockLoading = false, lowStock = page.products) }
            } catch (_: Exception) {
                _state.update { it.copy(lowStockLoading = false, lowStock = emptyList()) }
            }
        }
    }

    fun adminApproveReservation(orderId: String) {
        viewModelScope.launch {
            try {
                container.api.adminOrderAction(orderId, "approve_reservation")
                _state.update { it.copy(snackbar = "Reserva aprobada") }
                loadAdminOrders()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Error al aprobar") }
            }
        }
    }

    fun adminRejectReservation(orderId: String) {
        viewModelScope.launch {
            try {
                container.api.adminOrderAction(orderId, "reject_reservation")
                _state.update { it.copy(snackbar = "Reserva rechazada") }
                loadAdminOrders()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Error al rechazar") }
            }
        }
    }

    fun adminMarkPaid(orderId: String) {
        viewModelScope.launch {
            try {
                container.api.adminSetOrderStatus(orderId, "paid")
                _state.update { it.copy(snackbar = "Marcada pagada") }
                loadAdminOrders()
            } catch (e: Exception) {
                _state.update { it.copy(snackbar = e.message ?: "Error al actualizar") }
            }
        }
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return AppViewModel(container) as T
                }
            }
    }
}
