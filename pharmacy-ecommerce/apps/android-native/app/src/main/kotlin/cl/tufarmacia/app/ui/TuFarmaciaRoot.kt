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
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
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
    const val Cart = "cart"
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
    val state by vm.state.collectAsStateWithLifecycle()
    val cart by vm.cartLines.collectAsStateWithLifecycle()
    val cartCount = cart.sumOf { it.quantity }
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    LaunchedEffect(state.snackbar) {
        val msg = state.snackbar ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(msg)
        vm.consumeSnackbar()
    }

    LaunchedEffect(state.webpayRedirect) {
        val wp = state.webpayRedirect ?: return@LaunchedEffect
        val intent = Intent(context, WebpayActivity::class.java).apply {
            putExtra(WebpayActivity.EXTRA_URL, wp.url)
            putExtra(WebpayActivity.EXTRA_TOKEN, wp.token)
        }
        context.startActivity(intent)
        vm.consumeWebpayRedirect()
        navController.navigate(Routes.Orders) {
            popUpTo(Routes.Home)
        }
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
                NavigationBar {
                    NavigationBarItem(
                        selected = route == Routes.Home,
                        onClick = { navController.navigateTab(Routes.Home) },
                        icon = { Icon(Icons.Default.Home, contentDescription = null) },
                        label = { Text("Inicio") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Catalog,
                        onClick = { navController.navigateTab(Routes.Catalog) },
                        icon = { Icon(Icons.Default.ShoppingBag, contentDescription = null) },
                        label = { Text("Catálogo") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Cart,
                        onClick = { navController.navigateTab(Routes.Cart) },
                        icon = {
                            BadgedBox(badge = {
                                if (cartCount > 0) Badge { Text("$cartCount") }
                            }) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = null)
                            }
                        },
                        label = { Text("Carrito") },
                    )
                    NavigationBarItem(
                        selected = route == Routes.Account,
                        onClick = { navController.navigateTab(Routes.Account) },
                        icon = { Icon(Icons.Default.Person, contentDescription = null) },
                        label = { Text("Cuenta") },
                    )
                    if (state.user?.isAdmin == true) {
                        NavigationBarItem(
                            selected = route == Routes.Admin,
                            onClick = {
                                vm.loadAdminOrders()
                                vm.loadLowStock()
                                navController.navigateTab(Routes.Admin)
                            },
                            icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = null) },
                            label = { Text("Admin") },
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
                    onAddToCart = { p -> vm.addToCart(p) },
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
                AdminScreen(
                    state = state,
                    user = state.user,
                    onRefresh = vm::loadAdminOrders,
                    onStatusFilter = vm::setAdminStatusFilter,
                    onSearchChange = vm::setAdminSearch,
                    onSearch = vm::loadAdminOrders,
                    onApprove = vm::adminApproveReservation,
                    onReject = vm::adminRejectReservation,
                    onMarkPaid = vm::adminMarkPaid,
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
