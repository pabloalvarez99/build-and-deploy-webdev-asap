package cl.tufarmacia.app.ui

import android.app.Activity
import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import cl.tufarmacia.app.data.AppContainer
import cl.tufarmacia.app.data.FontScalePref
import cl.tufarmacia.app.ui.erp.ErpArqueoScreen
import cl.tufarmacia.app.ui.erp.ErpBatchesScreen
import cl.tufarmacia.app.ui.erp.ErpClienteDetailScreen
import cl.tufarmacia.app.ui.erp.ErpClientsScreen
import cl.tufarmacia.app.ui.erp.ErpDashboardScreen
import cl.tufarmacia.app.ui.erp.ErpDevolucionesScreen
import cl.tufarmacia.app.ui.erp.ErpFaltasScreen
import cl.tufarmacia.app.ui.erp.ErpFinanceScreen
import cl.tufarmacia.app.ui.erp.ErpHubScreen
import cl.tufarmacia.app.ui.erp.ErpInventoryScreen
import cl.tufarmacia.app.ui.erp.ErpPosScreen
import cl.tufarmacia.app.ui.erp.ErpProductEditScreen
import cl.tufarmacia.app.ui.erp.ErpPurchaseDetailScreen
import cl.tufarmacia.app.ui.erp.ErpPurchasesScreen
import cl.tufarmacia.app.ui.erp.ErpReorderScreen
import cl.tufarmacia.app.ui.erp.ErpShiftsScreen
import cl.tufarmacia.app.ui.erp.ErpSuppliersScreen
import cl.tufarmacia.app.ui.erp.ErpTasksScreen
import cl.tufarmacia.app.ui.erp.ErpUnknownBarcodesScreen
import cl.tufarmacia.app.ui.erp.ErpViewModel
import cl.tufarmacia.app.ui.screens.AccountScreen
import cl.tufarmacia.app.ui.screens.AdminScreen
import cl.tufarmacia.app.ui.screens.CartScreen
import cl.tufarmacia.app.ui.screens.CatalogScreen
import cl.tufarmacia.app.ui.screens.CheckoutScreen
import cl.tufarmacia.app.ui.screens.ForgotPasswordScreen
import cl.tufarmacia.app.ui.screens.HomeScreen
import cl.tufarmacia.app.ui.screens.LoginScreen
import cl.tufarmacia.app.ui.screens.OrderDetailScreen
import cl.tufarmacia.app.ui.screens.OrdersScreen
import cl.tufarmacia.app.ui.screens.ProductDetailScreen
import cl.tufarmacia.app.ui.screens.RegisterScreen
import cl.tufarmacia.app.ui.screens.SplashScreen
import cl.tufarmacia.app.ui.screens.TrackScreen
import cl.tufarmacia.app.ui.theme.TuFarmaciaTheme
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

private object Routes {
    const val Login = "login"
    const val Register = "register"
    const val Home = "home"
    const val Catalog = "catalog"
    const val Account = "account"
    const val Admin = "admin"
    const val ErpDashboard = "erp_dashboard"
    const val ErpOrders = "erp_orders"
    const val ErpPos = "erp_pos"
    const val ErpInventory = "erp_inventory"
    const val ErpClients = "erp_clients"
    const val ErpPurchases = "erp_purchases"
    const val ErpSuppliers = "erp_suppliers"
    const val ErpFinance = "erp_finance"
    const val ErpTasks = "erp_tasks"
    const val ErpShifts = "erp_shifts"
    const val ErpFaltas = "erp_faltas"
    const val ErpArqueo = "erp_arqueo"
    const val ErpBatches = "erp_batches"
    const val ErpReorder = "erp_reorder"
    const val ErpDevoluciones = "erp_devoluciones"
    const val ErpBarcodes = "erp_barcodes"
    const val ErpProductEdit = "erp_product_edit"
    const val ErpClienteDetail = "erp_cliente_detail"
    const val ErpPurchaseDetail = "erp_purchase/{id}"
    const val Cart = "cart"

    fun purchaseDetail(id: String) = "erp_purchase/$id"
    const val Checkout = "checkout"
    const val Orders = "orders"
    const val Track = "track"
    const val Product = "product/{slug}"
    const val OrderDetail = "order/{id}"
    const val ForgotPassword = "forgot_password"

    fun product(slug: String) =
        "product/${URLEncoder.encode(slug, StandardCharsets.UTF_8.toString())}"

    fun order(id: String) = "order/$id"
}

@Composable
fun TuFarmaciaRoot(container: AppContainer) {
    val vm: AppViewModel = viewModel(factory = AppViewModel.factory(container))
    val erpVm: ErpViewModel = viewModel(factory = ErpViewModel.factory(container))
    val state by vm.state.collectAsStateWithLifecycle()
    val erp by erpVm.state.collectAsStateWithLifecycle()
    val cart by vm.cartLines.collectAsStateWithLifecycle()
    val cartCount = cart.sumOf { it.quantity }
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current
    val webpayLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        vm.onWebpayResult(result.resultCode == Activity.RESULT_OK)
        if (result.resultCode == Activity.RESULT_OK) {
            navController.navigate(Routes.Orders) {
                popUpTo(Routes.Home)
            }
        }
    }
    val posScanLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val code = result.data?.getStringExtra(BarcodeScannerActivity.EXTRA_BARCODE)
            if (!code.isNullOrBlank()) erpVm.scanBarcode(code)
        }
    }
    val inventoryScanLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val code = result.data?.getStringExtra(BarcodeScannerActivity.EXTRA_BARCODE)
            if (!code.isNullOrBlank()) {
                erpVm.setInventoryBarcode(code)
            }
        }
    }

    LaunchedEffect(state.snackbar) {
        val msg = state.snackbar ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(msg)
        vm.consumeSnackbar()
    }
    LaunchedEffect(erp.snackbar) {
        val msg = erp.snackbar ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(msg)
        erpVm.consumeSnackbar()
    }

    LaunchedEffect(state.webpayRedirect) {
        val wp = state.webpayRedirect ?: return@LaunchedEffect
        val intent = Intent(context, WebpayActivity::class.java).apply {
            putExtra(WebpayActivity.EXTRA_URL, wp.url)
            putExtra(WebpayActivity.EXTRA_TOKEN, wp.token)
        }
        webpayLauncher.launch(intent)
        vm.consumeWebpayRedirect()
    }

    val tabRoutes = buildSet {
        add(Routes.Home)
        add(Routes.Catalog)
        add(Routes.Cart)
        add(Routes.Account)
        if (state.user?.isAdmin == true) add(Routes.Admin)
    }

    TuFarmaciaTheme(
        fontScale = state.userPrefs.fontScale,
        highContrast = state.userPrefs.highContrast,
    ) {
    if (!state.bootstrapped) {
        SplashScreen()
        return@TuFarmaciaTheme
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            if (!state.isOnline) {
                Text(
                    "Sin conexión a internet",
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFB91C1C))
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        },
        bottomBar = {
            val route = navController.currentBackStackEntryAsState().value?.destination?.route
            val onTab = route != null && (
                route in tabRoutes || route?.startsWith("product/") == true
                )
            // Only main tabs show bottom bar
            if (route in tabRoutes) {
                NavigationBar(modifier = Modifier.height(72.dp)) {
                    NavigationBarItem(
                        selected = route == Routes.Home,
                        onClick = { navController.navigateTab(Routes.Home) },
                        icon = { Icon(Icons.Default.Home, contentDescription = "Inicio") },
                        label = { Text("Inicio") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Catalog,
                        onClick = { navController.navigateTab(Routes.Catalog) },
                        icon = { Icon(Icons.Default.ShoppingBag, contentDescription = "Catálogo") },
                        label = { Text("Catálogo") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Cart,
                        onClick = { navController.navigateTab(Routes.Cart) },
                        icon = {
                            BadgedBox(badge = {
                                if (cartCount > 0) Badge { Text("$cartCount") }
                            }) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = "Carrito")
                            }
                        },
                        label = { Text("Carrito") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Account,
                        onClick = { navController.navigateTab(Routes.Account) },
                        icon = { Icon(Icons.Default.Person, contentDescription = "Cuenta") },
                        label = { Text("Cuenta") },
                    )
                    if (state.user?.isAdmin == true) {
                        NavigationBarItem(
                            selected = route == Routes.Admin || route?.startsWith("erp_") == true,
                            onClick = { navController.navigateTab(Routes.Admin) },
                            icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = "ERP") },
                            label = { Text("ERP") },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.Home,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.Home) {
                HomeScreen(
                    user = state.user,
                    productCount = state.productsTotal,
                    cartCount = cartCount,
                    topSellers = state.topSellers,
                    onOpenCatalog = { navController.navigateTab(Routes.Catalog) },
                    onOpenCart = { navController.navigateTab(Routes.Cart) },
                    onOpenOrders = { navController.navigate(Routes.Orders) },
                    onOpenTrack = { navController.navigate(Routes.Track) },
                    onOpenLogin = { navController.navigate(Routes.Login) },
                    onOpenRegister = { navController.navigate(Routes.Register) },
                    onOpenProduct = { slug -> navController.navigate(Routes.product(slug)) },
                    onRefresh = {
                        vm.loadProducts()
                        vm.loadTopSellers()
                        vm.loadCategories()
                    },
                )
            }
            composable(Routes.Catalog) {
                CatalogScreen(
                    state = state,
                    onSearchChange = vm::onSearchChange,
                    onSearch = { vm.loadProducts() },
                    onRetry = { vm.loadProducts() },
                    onSelectCategory = vm::selectCategory,
                    onToggleInStock = vm::setInStockOnly,
                    onToggleDiscount = vm::setHasDiscountOnly,
                    onSort = vm::setSortBy,
                    onClearFilters = vm::clearCatalogFilters,
                    onSuggestion = { p ->
                        vm.applySuggestion(p)
                        navController.navigate(Routes.product(p.slug))
                    },
                    onOpenProduct = { slug -> navController.navigate(Routes.product(slug)) },
                    onLoadMore = vm::loadMoreProducts,
                    onOpenCart = { navController.navigateTab(Routes.Cart) },
                    cartCount = cartCount,
                )
            }
            composable(
                route = Routes.Product,
                arguments = listOf(navArgument("slug") { type = NavType.StringType }),
            ) { entry ->
                val slug = URLDecoder.decode(
                    entry.arguments?.getString("slug").orEmpty(),
                    StandardCharsets.UTF_8.toString(),
                )
                LaunchedEffect(slug) { vm.loadProductDetail(slug) }
                ProductDetailScreen(
                    state = state,
                    onBack = { navController.popBackStack() },
                    onAddToCart = { p, q -> vm.addToCart(p, q) },
                    onOpenCart = { navController.navigateTab(Routes.Cart) },
                    onRetry = { vm.loadProductDetail(slug) },
                )
            }
            composable(Routes.Cart) {
                LaunchedEffect(Unit) { vm.revalidateCart() }
                CartScreen(
                    lines = cart,
                    warnings = state.cartWarnings,
                    revalidating = state.cartRevalidating,
                    onBack = { navController.navigateTab(Routes.Home) },
                    onQty = vm::setCartQty,
                    onRemove = vm::removeFromCart,
                    onCheckout = {
                        vm.clearCheckoutSuccess()
                        navController.navigate(Routes.Checkout)
                    },
                    onClear = vm::clearCart,
                    onBrowse = { navController.navigateTab(Routes.Catalog) },
                    onRefresh = vm::revalidateCart,
                )
            }
            composable(Routes.Checkout) {
                CheckoutScreen(
                    state = state,
                    lines = cart,
                    onBack = { navController.popBackStack() },
                    onField = { n, s, p, e, notes ->
                        vm.updateCheckoutField(name = n, surname = s, phone = p, email = e, notes = notes)
                    },
                    onUsePoints = vm::setCheckoutUsePoints,
                    onSubmitPickup = { vm.submitStorePickup(cart) },
                    onSubmitWebpay = { vm.submitWebpay(cart) },
                    onDone = {
                        vm.clearCheckoutSuccess()
                        navController.navigate(Routes.Orders) {
                            popUpTo(Routes.Home)
                        }
                    },
                )
            }
            composable(Routes.Orders) {
                LaunchedEffect(Unit) { vm.loadOrders() }
                OrdersScreen(
                    state = state,
                    onBack = { navController.popBackStack() },
                    onOpen = { id -> navController.navigate(Routes.order(id)) },
                    onRefresh = vm::loadOrders,
                )
            }
            composable(
                route = Routes.OrderDetail,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { entry ->
                val id = entry.arguments?.getString("id").orEmpty()
                LaunchedEffect(id) { vm.loadOrderDetail(id) }
                val isStaff = state.user?.isAdmin == true
                OrderDetailScreen(
                    state = state,
                    onBack = { navController.popBackStack() },
                    isStaff = isStaff,
                    onApprove = {
                        vm.adminApproveReservation(id)
                        vm.loadOrderDetail(id)
                    },
                    onReject = {
                        vm.adminRejectReservation(id)
                        vm.loadOrderDetail(id)
                    },
                    onMarkPaid = {
                        vm.adminMarkPaid(id)
                        vm.loadOrderDetail(id)
                    },
                    onRefund = {
                        vm.adminRefund(id)
                        vm.loadOrderDetail(id)
                    },
                    onCancel = {
                        vm.adminCancel(id)
                        vm.loadOrderDetail(id)
                    },
                )
            }
            composable(Routes.Account) {
                if (state.user == null) {
                    LoginScreen(
                        loading = state.loginLoading,
                        error = state.loginError,
                        onLogin = vm::login,
                        embedded = true,
                        onRegister = { navController.navigate(Routes.Register) },
                        onForgotPassword = {
                            vm.clearForgotState()
                            navController.navigate(Routes.ForgotPassword)
                        },
                    )
                } else {
                    AccountScreen(
                        user = state.user!!,
                        loyalty = state.loyalty,
                        profilePhone = state.profilePhone,
                        profileSaving = state.profileSaving,
                        profileError = state.profileError,
                        fontScaleKey = state.userPrefs.fontScale.key,
                        highContrast = state.userPrefs.highContrast,
                        onLogout = vm::logout,
                        onOrders = { navController.navigate(Routes.Orders) },
                        onTrack = { navController.navigate(Routes.Track) },
                        onRefreshLoyalty = vm::loadLoyalty,
                        onSaveProfile = vm::updateProfile,
                        onFontScale = { key -> vm.setFontScale(FontScalePref.fromKey(key)) },
                        onHighContrast = vm::setHighContrast,
                    )
                }
            }
            composable(Routes.ForgotPassword) {
                ForgotPasswordScreen(
                    loading = state.forgotLoading,
                    error = state.forgotError,
                    success = state.forgotSuccess,
                    onSend = vm::sendPasswordReset,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.Track) {
                TrackScreen(
                    token = state.trackingTokenInput,
                    loading = state.trackingLoading,
                    error = state.trackingError,
                    result = state.trackingResult,
                    onTokenChange = vm::onTrackingTokenChange,
                    onTrack = vm::trackOrder,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.Register) {
                RegisterScreen(
                    loading = state.registerLoading,
                    error = state.registerError,
                    onRegister = { email, pass, name, surname, phone ->
                        vm.register(email, pass, name, surname, phone)
                    },
                    onBack = { navController.popBackStack() },
                )
                LaunchedEffect(state.user, state.registerSuccess) {
                    if (state.user != null && state.registerSuccess) {
                        navController.navigateTab(Routes.Account)
                    }
                }
            }
            composable(Routes.Admin) {
                LaunchedEffect(Unit) { erpVm.loadAvisos() }
                ErpHubScreen(
                    user = state.user,
                    avisos = erp.avisos,
                    onOpen = { route ->
                        when (route) {
                            Routes.ErpDashboard -> {
                                erpVm.loadDashboard()
                                navController.navigate(Routes.ErpDashboard)
                            }
                            Routes.ErpOrders -> {
                                vm.loadAdminOrders()
                                vm.loadLowStock()
                                navController.navigate(Routes.ErpOrders)
                            }
                            Routes.ErpPos -> navController.navigate(Routes.ErpPos)
                            Routes.ErpInventory -> {
                                erpVm.loadInventory()
                                navController.navigate(Routes.ErpInventory)
                            }
                            Routes.ErpClients -> {
                                erpVm.loadClientes()
                                navController.navigate(Routes.ErpClients)
                            }
                            Routes.ErpPurchases -> {
                                erpVm.loadPurchaseOrders()
                                navController.navigate(Routes.ErpPurchases)
                            }
                            Routes.ErpBatches -> {
                                erpVm.loadBatches()
                                navController.navigate(Routes.ErpBatches)
                            }
                            Routes.ErpReorder -> {
                                erpVm.loadReorderSuggestions()
                                navController.navigate(Routes.ErpReorder)
                            }
                            Routes.ErpDevoluciones -> {
                                erpVm.loadDevoluciones()
                                navController.navigate(Routes.ErpDevoluciones)
                            }
                            Routes.ErpBarcodes -> {
                                erpVm.loadUnknownBarcodes()
                                navController.navigate(Routes.ErpBarcodes)
                            }
                            Routes.ErpSuppliers -> {
                                erpVm.loadSuppliers()
                                navController.navigate(Routes.ErpSuppliers)
                            }
                            Routes.ErpFinance -> {
                                erpVm.loadFinanzas()
                                navController.navigate(Routes.ErpFinance)
                            }
                            Routes.ErpTasks -> {
                                erpVm.loadTasks()
                                navController.navigate(Routes.ErpTasks)
                            }
                            Routes.ErpShifts -> {
                                erpVm.loadTurnos()
                                navController.navigate(Routes.ErpShifts)
                            }
                            Routes.ErpFaltas -> {
                                erpVm.loadFaltas()
                                navController.navigate(Routes.ErpFaltas)
                            }
                            Routes.ErpArqueo -> {
                                erpVm.loadArqueo()
                                navController.navigate(Routes.ErpArqueo)
                            }
                        }
                    },
                    onBackToStore = { navController.navigateTab(Routes.Home) },
                )
            }
            composable(Routes.ErpDashboard) {
                ErpDashboardScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onRefresh = erpVm::loadDashboard,
                    onOpenModule = { route ->
                        when (route) {
                            Routes.ErpOrders -> {
                                vm.loadAdminOrders()
                                vm.loadLowStock()
                                navController.navigate(Routes.ErpOrders)
                            }
                            Routes.ErpInventory -> {
                                erpVm.loadInventory()
                                navController.navigate(Routes.ErpInventory)
                            }
                            Routes.ErpFaltas -> {
                                erpVm.loadFaltas()
                                navController.navigate(Routes.ErpFaltas)
                            }
                            Routes.ErpFinance -> {
                                erpVm.loadFinanzas()
                                navController.navigate(Routes.ErpFinance)
                            }
                            Routes.ErpPurchases -> {
                                erpVm.loadPurchaseOrders()
                                navController.navigate(Routes.ErpPurchases)
                            }
                            Routes.ErpBatches -> {
                                erpVm.loadBatches()
                                navController.navigate(Routes.ErpBatches)
                            }
                            Routes.ErpPos -> navController.navigate(Routes.ErpPos)
                            else -> navController.navigate(route)
                        }
                    },
                    onOpenPosPickup = { code ->
                        erpVm.prefillPickupCode(code)
                        navController.navigate(Routes.ErpPos)
                    },
                )
            }
            composable(Routes.ErpOrders) {
                AdminScreen(
                    state = state,
                    user = state.user,
                    onRefresh = {
                        vm.loadAdminOrders()
                        vm.loadLowStock()
                    },
                    onStatusFilter = vm::setAdminStatusFilter,
                    onSearchChange = vm::setAdminSearch,
                    onSearch = vm::loadAdminOrders,
                    onApprove = vm::adminApproveReservation,
                    onReject = vm::adminRejectReservation,
                    onMarkPaid = vm::adminMarkPaid,
                    onRefund = vm::adminRefund,
                    onCancel = vm::adminCancel,
                    onOpenOrder = { id -> navController.navigate(Routes.order(id)) },
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.ErpPos) {
                ErpPosScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onSearchChange = erpVm::setPosSearch,
                    onSearch = erpVm::searchPosProducts,
                    onBarcodeChange = erpVm::setPosBarcode,
                    onScanBarcode = { erpVm.scanBarcode() },
                    onOpenCamera = {
                        posScanLauncher.launch(Intent(context, BarcodeScannerActivity::class.java))
                    },
                    onAdd = erpVm::addPosLine,
                    onQty = erpVm::setPosQty,
                    onPayment = erpVm::setPosPayment,
                    onCustomer = erpVm::setPosCustomer,
                    onDiscountChange = erpVm::setPosDiscount,
                    onNotesChange = erpVm::setPosNotes,
                    onMixedAmounts = erpVm::setPosMixedAmounts,
                    onLookupCustomer = erpVm::lookupCustomerHistory,
                    onPickupCodeChange = erpVm::setPosPickupCode,
                    onLookupPickup = erpVm::lookupPickup,
                    onClearPickup = erpVm::clearPickup,
                    onApprovePickup = { id ->
                        vm.adminApproveReservation(id)
                        erpVm.lookupPickup()
                    },
                    onMarkPaidPickup = { id ->
                        vm.adminMarkPaid(id)
                        erpVm.lookupPickup()
                    },
                    onSubmit = erpVm::submitPos,
                    onClear = erpVm::clearPos,
                    onDismissLastSale = erpVm::clearLastPosSale,
                    onShareLastSale = {
                        val text = erpVm.lastPosSaleShareText() ?: return@ErpPosScreen
                        val send = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, text)
                            putExtra(Intent.EXTRA_SUBJECT, "Ticket Tu Farmacia")
                        }
                        context.startActivity(Intent.createChooser(send, "Compartir ticket"))
                    },
                    onAddRecent = erpVm::addPosRecentToCart,
                )
            }
            composable(Routes.ErpInventory) {
                ErpInventoryScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onFilter = erpVm::setInventoryFilter,
                    onSearchChange = erpVm::setInventorySearch,
                    onSearch = erpVm::loadInventory,
                    onReason = erpVm::setInventoryReason,
                    onBarcodeChange = erpVm::setInventoryBarcode,
                    onCustomDeltaChange = erpVm::setInventoryCustomDelta,
                    onAdjustBarcode = erpVm::adjustStockByBarcode,
                    onOpenCamera = {
                        inventoryScanLauncher.launch(Intent(context, BarcodeScannerActivity::class.java))
                    },
                    onAdjust = { id, d -> erpVm.adjustStock(id, d, null) },
                    onCreateFalta = { id, name -> erpVm.createFalta(id, name) },
                    onEditProduct = { id ->
                        erpVm.openProductEdit(id)
                        navController.navigate(Routes.ErpProductEdit)
                    },
                )
            }
            composable(Routes.ErpProductEdit) {
                ErpProductEditScreen(
                    state = erp,
                    onBack = {
                        erpVm.clearProductEdit()
                        navController.popBackStack()
                    },
                    onSave = { price, stock, disc -> erpVm.saveProductEdit(price, stock, disc) },
                )
            }
            composable(Routes.ErpDevoluciones) {
                ErpDevolucionesScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onRefresh = erpVm::loadDevoluciones,
                    onCreate = { name, qty, price, motivo ->
                        erpVm.createDevolucion(name, qty, price, motivo)
                    },
                )
            }
            composable(Routes.ErpBarcodes) {
                ErpUnknownBarcodesScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onRefresh = erpVm::loadUnknownBarcodes,
                    onDismiss = erpVm::dismissUnknownBarcode,
                    onStartResolve = erpVm::startResolveBarcode,
                    onCancelResolve = erpVm::clearResolveBarcode,
                    onResolveSearch = erpVm::setResolveSearch,
                    onResolvePick = erpVm::resolveUnknownBarcode,
                )
            }
            composable(Routes.ErpClients) {
                ErpClientsScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onQueryChange = erpVm::setClientsQuery,
                    onOpen = { c ->
                        val isGuest = c.type.equals("guest", ignoreCase = true) || c.id.isNullOrBlank()
                        val pathId = if (isGuest) "guest" else c.id.orEmpty()
                        erpVm.loadClienteDetail(pathId, if (isGuest) c.email else null)
                        navController.navigate(Routes.ErpClienteDetail)
                    },
                )
            }
            composable(Routes.ErpClienteDetail) {
                ErpClienteDetailScreen(
                    state = erp,
                    onBack = {
                        erpVm.clearClienteDetail()
                        navController.popBackStack()
                    },
                )
            }
            composable(Routes.ErpPurchases) {
                ErpPurchasesScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onOpen = { id ->
                        erpVm.loadPurchaseOrderDetail(id)
                        navController.navigate(Routes.purchaseDetail(id))
                    },
                )
            }
            composable(
                route = Routes.ErpPurchaseDetail,
                arguments = listOf(navArgument("id") { type = NavType.StringType }),
            ) { entry ->
                val id = entry.arguments?.getString("id").orEmpty()
                LaunchedEffect(id) { erpVm.loadPurchaseOrderDetail(id) }
                ErpPurchaseDetailScreen(
                    state = erp,
                    onBack = {
                        erpVm.clearPurchaseOrderDetail()
                        navController.popBackStack()
                    },
                    onReceive = erpVm::receivePurchaseOrder,
                )
            }
            composable(Routes.ErpBatches) {
                ErpBatchesScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onFilter = erpVm::setBatchesFilter,
                    onRefresh = erpVm::loadBatches,
                )
            }
            composable(Routes.ErpReorder) {
                ErpReorderScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onRefresh = erpVm::loadReorderSuggestions,
                    onExpress = erpVm::sendReposicionExpress,
                    onCreateOc = erpVm::createOcFromReorder,
                )
            }
            composable(Routes.ErpSuppliers) {
                ErpSuppliersScreen(state = erp, onBack = { navController.popBackStack() })
            }
            composable(Routes.ErpFinance) {
                ErpFinanceScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onPayAp = { id, amount -> erpVm.payAp(id, amount) },
                    onCreateGasto = { cat, desc, amt -> erpVm.createGasto(cat, desc, amt, null) },
                    onRefresh = erpVm::loadFinanzas,
                )
            }
            composable(Routes.ErpTasks) {
                ErpTasksScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onComplete = erpVm::completeTask,
                    onCreate = erpVm::createTask,
                )
            }
            composable(Routes.ErpShifts) {
                ErpShiftsScreen(state = erp, onBack = { navController.popBackStack() })
            }
            composable(Routes.ErpFaltas) {
                ErpFaltasScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onNotify = erpVm::markFaltaNotified,
                    onRefresh = erpVm::loadFaltas,
                )
            }
            composable(Routes.ErpArqueo) {
                ErpArqueoScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onRefresh = erpVm::loadArqueo,
                    onSetFondo = erpVm::setFondo,
                    onCerrarTurno = erpVm::cerrarTurno,
                    onSetPharmacist = erpVm::setPharmacistShift,
                    onClosePharmacist = erpVm::closePharmacistShift,
                )
            }
            composable(Routes.Login) {
                LoginScreen(
                    loading = state.loginLoading,
                    error = state.loginError,
                    onLogin = vm::login,
                    embedded = false,
                    onBack = { navController.popBackStack() },
                    onRegister = { navController.navigate(Routes.Register) },
                    onForgotPassword = {
                        vm.clearForgotState()
                        navController.navigate(Routes.ForgotPassword)
                    },
                )
            }
        }
    }
    }
}

private fun androidx.navigation.NavHostController.navigateTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
