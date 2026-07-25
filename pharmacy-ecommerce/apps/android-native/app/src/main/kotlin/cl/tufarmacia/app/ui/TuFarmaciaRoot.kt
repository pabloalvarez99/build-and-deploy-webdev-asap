package cl.tufarmacia.app.ui

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
import android.app.Activity
import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
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
import cl.tufarmacia.app.ui.screens.AccountScreen
import cl.tufarmacia.app.ui.screens.AdminScreen
import cl.tufarmacia.app.ui.erp.ErpArqueoScreen
import cl.tufarmacia.app.ui.erp.ErpBatchesScreen
import cl.tufarmacia.app.ui.erp.ErpClientsScreen
import cl.tufarmacia.app.ui.erp.ErpDashboardScreen
import cl.tufarmacia.app.ui.erp.ErpFaltasScreen
import cl.tufarmacia.app.ui.erp.ErpFinanceScreen
import cl.tufarmacia.app.ui.erp.ErpHubScreen
import cl.tufarmacia.app.ui.erp.ErpInventoryScreen
import cl.tufarmacia.app.ui.erp.ErpPosScreen
import cl.tufarmacia.app.ui.erp.ErpPurchaseDetailScreen
import cl.tufarmacia.app.ui.erp.ErpPurchasesScreen
import cl.tufarmacia.app.ui.erp.ErpReorderScreen
import cl.tufarmacia.app.ui.erp.ErpShiftsScreen
import cl.tufarmacia.app.ui.erp.ErpSuppliersScreen
import cl.tufarmacia.app.ui.erp.ErpTasksScreen
import cl.tufarmacia.app.ui.erp.ErpViewModel
import cl.tufarmacia.app.ui.screens.CartScreen
import cl.tufarmacia.app.ui.screens.CatalogScreen
import cl.tufarmacia.app.ui.screens.CheckoutScreen
import cl.tufarmacia.app.ui.screens.HomeScreen
import cl.tufarmacia.app.ui.screens.LoginScreen
import cl.tufarmacia.app.ui.screens.OrderDetailScreen
import cl.tufarmacia.app.ui.screens.OrdersScreen
import cl.tufarmacia.app.ui.screens.ProductDetailScreen
import cl.tufarmacia.app.ui.screens.RegisterScreen
import cl.tufarmacia.app.ui.screens.SplashScreen
import cl.tufarmacia.app.ui.screens.TrackScreen
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
    const val ErpPurchaseDetail = "erp_purchase/{id}"
    const val Cart = "cart"

    fun purchaseDetail(id: String) = "erp_purchase/$id"
    const val Checkout = "checkout"
    const val Orders = "orders"
    const val Track = "track"
    const val Product = "product/{slug}"
    const val OrderDetail = "order/{id}"

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

    if (!state.bootstrapped) {
        SplashScreen()
        return
    }

    val tabRoutes = buildSet {
        add(Routes.Home)
        add(Routes.Catalog)
        add(Routes.Cart)
        add(Routes.Account)
        if (state.user?.isAdmin == true) add(Routes.Admin)
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
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
                )
            }
            composable(Routes.Catalog) {
                CatalogScreen(
                    state = state,
                    onSearchChange = vm::onSearchChange,
                    onSearch = { vm.loadProducts() },
                    onRetry = { vm.loadProducts() },
                    onSelectCategory = vm::selectCategory,
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
                )
            }
            composable(Routes.Cart) {
                CartScreen(
                    lines = cart,
                    onBack = { navController.navigateTab(Routes.Home) },
                    onQty = vm::setCartQty,
                    onRemove = vm::removeFromCart,
                    onCheckout = {
                        vm.clearCheckoutSuccess()
                        navController.navigate(Routes.Checkout)
                    },
                    onClear = vm::clearCart,
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
                OrderDetailScreen(
                    state = state,
                    onBack = { navController.popBackStack() },
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
                    )
                } else {
                    AccountScreen(
                        user = state.user!!,
                        loyalty = state.loyalty,
                        onLogout = vm::logout,
                        onOrders = { navController.navigate(Routes.Orders) },
                        onTrack = { navController.navigate(Routes.Track) },
                        onRefreshLoyalty = vm::loadLoyalty,
                    )
                }
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
                ErpHubScreen(
                    user = state.user,
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
                    onAdd = erpVm::addPosLine,
                    onQty = erpVm::setPosQty,
                    onPayment = erpVm::setPosPayment,
                    onCustomer = erpVm::setPosCustomer,
                    onDiscountChange = erpVm::setPosDiscount,
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
                    onAdjust = { id, d -> erpVm.adjustStock(id, d, null) },
                    onCreateFalta = { id, name -> erpVm.createFalta(id, name) },
                )
            }
            composable(Routes.ErpClients) {
                ErpClientsScreen(state = erp, onBack = { navController.popBackStack() })
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
                )
            }
            composable(Routes.ErpSuppliers) {
                ErpSuppliersScreen(state = erp, onBack = { navController.popBackStack() })
            }
            composable(Routes.ErpFinance) {
                ErpFinanceScreen(state = erp, onBack = { navController.popBackStack() })
            }
            composable(Routes.ErpTasks) {
                ErpTasksScreen(
                    state = erp,
                    onBack = { navController.popBackStack() },
                    onComplete = erpVm::completeTask,
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
                )
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
