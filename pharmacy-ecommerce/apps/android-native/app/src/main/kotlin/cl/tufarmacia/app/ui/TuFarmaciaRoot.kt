package cl.tufarmacia.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import cl.tufarmacia.app.data.AppContainer
import cl.tufarmacia.app.ui.screens.AccountScreen
import cl.tufarmacia.app.ui.screens.AdminPlaceholderScreen
import cl.tufarmacia.app.ui.screens.CatalogScreen
import cl.tufarmacia.app.ui.screens.HomeScreen
import cl.tufarmacia.app.ui.screens.LoginScreen
import cl.tufarmacia.app.ui.screens.SplashScreen

private object Routes {
    const val Splash = "splash"
    const val Login = "login"
    const val Home = "home"
    const val Catalog = "catalog"
    const val Account = "account"
    const val Admin = "admin"
}

@Composable
fun TuFarmaciaRoot(container: AppContainer) {
    val vm: AppViewModel = viewModel(factory = AppViewModel.factory(container))
    val state by vm.state.collectAsStateWithLifecycle()
    val navController = rememberNavController()

    if (!state.bootstrapped) {
        SplashScreen()
        return
    }

    val showBottomBar = state.user != null ||
        navController.currentBackStackEntryAsState().value?.destination?.route in
        setOf(Routes.Home, Routes.Catalog, Routes.Account, Routes.Admin)

    Scaffold(
        bottomBar = {
            val route = navController.currentBackStackEntryAsState().value?.destination?.route
            if (route in setOf(Routes.Home, Routes.Catalog, Routes.Account, Routes.Admin)) {
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
                        selected = route == Routes.Account,
                        onClick = { navController.navigateTab(Routes.Account) },
                        icon = { Icon(Icons.Default.Person, contentDescription = null) },
                        label = { Text("Cuenta") },
                    )
                    if (state.user?.isAdmin == true) {
                        NavigationBarItem(
                            selected = route == Routes.Admin,
                            onClick = { navController.navigateTab(Routes.Admin) },
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
                    onOpenCatalog = { navController.navigateTab(Routes.Catalog) },
                    onOpenLogin = { navController.navigate(Routes.Login) },
                )
            }
            composable(Routes.Catalog) {
                CatalogScreen(
                    state = state,
                    onSearchChange = vm::onSearchChange,
                    onSearch = { vm.loadProducts() },
                    onRetry = { vm.loadProducts() },
                )
            }
            composable(Routes.Account) {
                if (state.user == null) {
                    LoginScreen(
                        loading = state.loginLoading,
                        error = state.loginError,
                        onLogin = vm::login,
                        embedded = true,
                    )
                } else {
                    AccountScreen(user = state.user!!, onLogout = vm::logout)
                }
            }
            composable(Routes.Admin) {
                AdminPlaceholderScreen(user = state.user)
            }
            composable(Routes.Login) {
                LoginScreen(
                    loading = state.loginLoading,
                    error = state.loginError,
                    onLogin = { email, pass ->
                        vm.login(email, pass)
                    },
                    embedded = false,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }

    // After successful login from Login route, go back to account
    // (user state change rebuilds Account tab content)
}

private fun androidx.navigation.NavHostController.navigateTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
