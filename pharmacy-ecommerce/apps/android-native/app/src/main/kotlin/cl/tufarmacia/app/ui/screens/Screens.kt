package cl.tufarmacia.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import cl.tufarmacia.app.data.model.AuthUser
import cl.tufarmacia.app.data.model.CartLine
import cl.tufarmacia.app.data.model.OrderDto
import cl.tufarmacia.app.data.model.Product
import cl.tufarmacia.app.data.model.StorePickupResponse
import cl.tufarmacia.app.data.model.LoyaltyResponse
import cl.tufarmacia.app.data.model.TopSeller
import cl.tufarmacia.app.data.model.TrackingResponse
import cl.tufarmacia.app.ui.AppUiState
import cl.tufarmacia.app.util.formatClp
import cl.tufarmacia.app.util.orderStatusLabel
import cl.tufarmacia.app.util.orderStatusStyle
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter

@Composable
fun SplashScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0891B2)),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "Tu Farmacia",
                style = MaterialTheme.typography.headlineLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Text("Coquimbo · App nativa Android", color = Color.White.copy(alpha = 0.9f))
            Spacer(Modifier.height(24.dp))
            CircularProgressIndicator(color = Color.White)
        }
    }
}

@Composable
fun HomeScreen(
    user: AuthUser?,
    productCount: Int,
    cartCount: Int,
    topSellers: List<TopSeller>,
    onOpenCatalog: () -> Unit,
    onOpenCart: () -> Unit,
    onOpenOrders: () -> Unit,
    onOpenTrack: () -> Unit,
    onOpenLogin: () -> Unit,
    onOpenRegister: () -> Unit,
    onOpenProduct: (String) -> Unit,
    onRefresh: () -> Unit = {},
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Tu Farmacia",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(
                "Actualizar",
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .clickable(onClick = onRefresh)
                    .padding(8.dp),
            )
        }
        Text(
            if (user != null) "Hola, ${user.name ?: user.email ?: "usuario"}"
            else "Farmacia en Coquimbo · adultos mayores",
            style = MaterialTheme.typography.bodyLarge,
        )
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Kotlin nativo · Jetpack Compose", fontWeight = FontWeight.SemiBold)
                Text(
                    "Catálogo en vivo, carrito local, retiro en tienda y mis pedidos. " +
                        "Misma API de producción que la web.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (productCount > 0) {
                    Text("$productCount productos en catálogo", fontWeight = FontWeight.Medium)
                }
            }
        }
        Button(onClick = onOpenCatalog, modifier = Modifier.fillMaxWidth()) {
            Text("Ver catálogo")
        }
        OutlinedButton(onClick = onOpenCart, modifier = Modifier.fillMaxWidth()) {
            Text(if (cartCount > 0) "Carrito ($cartCount)" else "Carrito")
        }
        OutlinedButton(onClick = onOpenTrack, modifier = Modifier.fillMaxWidth()) {
            Text("Rastrear pedido")
        }
        if (user != null) {
            OutlinedButton(onClick = onOpenOrders, modifier = Modifier.fillMaxWidth()) {
                Text("Mis pedidos")
            }
        } else {
            OutlinedButton(onClick = onOpenLogin, modifier = Modifier.fillMaxWidth()) {
                Text("Iniciar sesión")
            }
            OutlinedButton(onClick = onOpenRegister, modifier = Modifier.fillMaxWidth()) {
                Text("Crear cuenta")
            }
        }
        if (topSellers.isNotEmpty()) {
            Text("Más vendidos", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            topSellers.forEach { item ->
                Card(
                    Modifier
                        .fillMaxWidth()
                        .clickable { onOpenProduct(item.slug) },
                ) {
                    Row(
                        Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        ProductThumb(item.imageUrl, item.name)
                        Column(Modifier.weight(1f)) {
                            Text(item.name, maxLines = 2, fontWeight = FontWeight.Medium)
                            Text(formatClp(item.price), color = MaterialTheme.colorScheme.primary)
                            Text("${item.unitsSold} vendidos", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogScreen(
    state: AppUiState,
    onSearchChange: (String) -> Unit,
    onSearch: () -> Unit,
    onRetry: () -> Unit,
    onSelectCategory: (String?) -> Unit,
    onToggleInStock: (Boolean) -> Unit,
    onToggleDiscount: (Boolean) -> Unit,
    onSort: (String?) -> Unit,
    onClearFilters: () -> Unit,
    onSuggestion: (Product) -> Unit,
    onOpenProduct: (String) -> Unit,
    onLoadMore: () -> Unit,
    onOpenCart: () -> Unit,
    cartCount: Int,
) {
    val listState = rememberLazyListState()
    LaunchedEffect(listState, state.products.size, state.productsLoading) {
        snapshotFlow {
            val info = listState.layoutInfo
            val last = info.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= info.totalItemsCount - 3
        }
            .distinctUntilChanged()
            .filter { it }
            .collect { onLoadMore() }
    }

    val hasFilters = state.inStockOnly || state.hasDiscountOnly ||
        state.sortBy != null || state.selectedCategorySlug != null || state.searchQuery.isNotBlank()
    val chipColors = FilterChipDefaults.filterChipColors(
        selectedContainerColor = MaterialTheme.colorScheme.primary,
        selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
        containerColor = MaterialTheme.colorScheme.surface,
        labelColor = MaterialTheme.colorScheme.onSurface,
    )

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = {
                Text("Catálogo", fontWeight = FontWeight.SemiBold)
            },
            actions = {
                IconButton(onClick = onOpenCart) {
                    BadgedBox(badge = {
                        if (cartCount > 0) Badge { Text("$cartCount") }
                    }) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Carrito")
                    }
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.background,
            ),
        )
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = onSearchChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            placeholder = { Text("Buscar medicamento…") },
            leadingIcon = {
                Icon(
                    Icons.Default.Search,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
            },
            shape = RoundedCornerShape(14.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = Color(0xFFD1D5DB),
            ),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSearch() }),
        )
        if (state.suggestions.isNotEmpty()) {
            Card(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp),
            ) {
                Column(Modifier.padding(vertical = 4.dp)) {
                    state.suggestions.take(6).forEach { s ->
                        Text(
                            s.name,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSuggestion(s) }
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }
        }
        Row(
            Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            FilterChip(
                selected = state.inStockOnly,
                onClick = { onToggleInStock(!state.inStockOnly) },
                label = { Text("En stock") },
                colors = chipColors,
            )
            FilterChip(
                selected = state.hasDiscountOnly,
                onClick = { onToggleDiscount(!state.hasDiscountOnly) },
                label = { Text("Oferta") },
                colors = chipColors,
            )
            FilterChip(
                selected = state.sortBy == "price_asc",
                onClick = { onSort(if (state.sortBy == "price_asc") null else "price_asc") },
                label = { Text("Más barato") },
                colors = chipColors,
            )
            FilterChip(
                selected = state.sortBy == "price_desc",
                onClick = { onSort(if (state.sortBy == "price_desc") null else "price_desc") },
                label = { Text("Más caro") },
                colors = chipColors,
            )
            FilterChip(
                selected = state.sortBy == "name",
                onClick = { onSort(if (state.sortBy == "name") null else "name") },
                label = { Text("A–Z") },
                colors = chipColors,
            )
            if (hasFilters) {
                TextButton(onClick = onClearFilters) {
                    Text("Limpiar", color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        Row(
            Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(start = 16.dp, end = 16.dp, bottom = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            FilterChip(
                selected = state.selectedCategorySlug == null,
                onClick = { onSelectCategory(null) },
                label = { Text("Todas") },
                colors = chipColors,
            )
            state.categories.take(30).forEach { cat ->
                FilterChip(
                    selected = state.selectedCategorySlug == cat.slug,
                    onClick = { onSelectCategory(cat.slug) },
                    label = {
                        Text(
                            cat.name,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    },
                    colors = chipColors,
                )
            }
        }
        if (!state.productsLoading && state.products.isNotEmpty()) {
            Text(
                if (state.productsTotal > 0) {
                    "${state.products.size} de ${state.productsTotal} productos"
                } else {
                    "${state.products.size} productos"
                },
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp),
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF64748B),
            )
        }
        when {
            state.productsLoading && state.products.isEmpty() -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            state.productsError != null && state.products.isEmpty() -> {
                Column(
                    Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(state.productsError, color = MaterialTheme.colorScheme.error)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = onRetry) { Text("Reintentar") }
                }
            }
            else -> {
                LazyColumn(
                    state = listState,
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(state.products, key = { it.id }) { product ->
                        ProductRow(product, onClick = { onOpenProduct(product.slug) })
                    }
                    if (state.productsLoading) {
                        item {
                            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(Modifier.padding(16.dp))
                            }
                        }
                    }
                    if (state.products.isEmpty()) {
                        item {
                            Column(
                                Modifier.fillMaxWidth().padding(32.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text("Sin resultados", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    "Prueba otra búsqueda o limpia filtros.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color(0xFF64748B),
                                )
                                Spacer(Modifier.height(16.dp))
                                OutlinedButton(onClick = onClearFilters) { Text("Limpiar filtros") }
                            }
                        }
                    }
                    item { Spacer(Modifier.height(8.dp)) }
                }
            }
        }
    }
}

@Composable
fun ProductRow(product: Product, onClick: () -> Unit) {
    val stockLabel = when {
        product.stock <= 0 -> "Agotado"
        product.stock <= 5 -> "Pocas unidades (${product.stock})"
        else -> "Disponible"
    }
    val stockBg = when {
        product.stock <= 0 -> Color(0xFFFEE2E2)
        product.stock <= 5 -> Color(0xFFFEF3C7)
        else -> Color(0xFFDCFCE7)
    }
    val stockFg = when {
        product.stock <= 0 -> Color(0xFFB91C1C)
        product.stock <= 5 -> Color(0xFFB45309)
        else -> Color(0xFF15803D)
    }
    val disc = product.discountPercent ?: 0

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(
            Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ProductThumb(product.imageUrl, product.name)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    product.name,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF0F172A),
                )
                product.activeIngredient?.takeIf { it.isNotBlank() }?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        formatClp(product.unitPrice()),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                    )
                    if (disc > 0) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color(0xFFFEE2E2),
                        ) {
                            Text(
                                "-$disc%",
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                style = MaterialTheme.typography.labelMedium,
                                color = Color(0xFFB91C1C),
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = stockBg,
                ) {
                    Text(
                        stockLabel,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = stockFg,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
        }
    }
}

@Composable
private fun ProductThumb(url: String?, name: String) {
    val shape = RoundedCornerShape(12.dp)
    if (!url.isNullOrBlank()) {
        AsyncImage(
            model = url,
            contentDescription = name,
            modifier = Modifier
                .size(72.dp)
                .clip(shape)
                .background(Color(0xFFF1F5F9)),
            contentScale = ContentScale.Crop,
        )
    } else {
        Box(
            Modifier
                .size(72.dp)
                .clip(shape)
                .background(Color(0xFFE0F2FE)),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "Rx",
                    color = Color(0xFF0369A1),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium,
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    state: AppUiState,
    onBack: () -> Unit,
    onAddToCart: (Product, Int) -> Unit,
    onOpenCart: () -> Unit = {},
    onRetry: () -> Unit = {},
) {
    var qty by remember { mutableStateOf(1) }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Producto") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
        )
        when {
            state.productDetailLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.productDetailError != null -> Column(
                Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(state.productDetailError, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(12.dp))
                Button(onClick = onRetry) { Text("Reintentar") }
            }
            state.productDetail != null -> {
                val p = state.productDetail
                Column(
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    if (p.imageUrl != null) {
                        AsyncImage(
                            model = p.imageUrl,
                            contentDescription = p.name,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(280.dp)
                                .clip(RoundedCornerShape(12.dp)),
                            contentScale = ContentScale.Crop,
                        )
                    }
                    Text(p.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text(formatClp(p.unitPrice()), style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
                    p.activeIngredient?.let { Text("Principio activo: $it") }
                    p.laboratory?.let { Text("Laboratorio: $it") }
                    p.presentation?.let { Text("Presentación: $it") }
                    p.therapeuticAction?.let { Text("Acción: $it") }
                    p.prescriptionType?.let { Text("Receta: $it") }
                    p.categoryName?.let { Text("Categoría: $it") }
                    val stockLabel = when {
                        p.stock <= 0 -> "Agotado"
                        p.stock <= 5 -> "Stock bajo (${p.stock})"
                        else -> "Disponible (${p.stock})"
                    }
                    Text(
                        stockLabel,
                        fontWeight = FontWeight.SemiBold,
                        color = when {
                            p.stock <= 0 -> MaterialTheme.colorScheme.error
                            p.stock <= 5 -> Color(0xFFD97706)
                            else -> Color(0xFF16A34A)
                        },
                    )
                    p.description?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium, color = Color.DarkGray)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Cantidad:", fontWeight = FontWeight.Medium)
                        IconButton(
                            onClick = { qty = (qty - 1).coerceAtLeast(1) },
                            enabled = qty > 1,
                        ) { Icon(Icons.Default.Remove, contentDescription = "-") }
                        Text("$qty", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        IconButton(
                            onClick = { qty = (qty + 1).coerceAtMost(p.stock.coerceAtLeast(1)) },
                            enabled = qty < p.stock,
                        ) { Icon(Icons.Default.Add, contentDescription = "+") }
                    }
                    Text("Subtotal: ${formatClp(p.unitPrice() * qty)}", fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = { onAddToCart(p, qty) },
                        enabled = p.stock > 0,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (p.stock > 0) "Agregar $qty al carrito" else "Sin stock")
                    }
                    OutlinedButton(onClick = onOpenCart, modifier = Modifier.fillMaxWidth()) {
                        Text("Ver carrito")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    lines: List<CartLine>,
    warnings: List<String> = emptyList(),
    revalidating: Boolean = false,
    onBack: () -> Unit,
    onQty: (String, Int) -> Unit,
    onRemove: (String) -> Unit,
    onCheckout: () -> Unit,
    onClear: () -> Unit,
    onBrowse: () -> Unit = {},
    onRefresh: () -> Unit = {},
) {
    val total = lines.sumOf { it.lineTotal }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Carrito") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                if (lines.isNotEmpty()) {
                    Text(
                        if (revalidating) "…" else "Actualizar",
                        Modifier.clickable(onClick = onRefresh).padding(16.dp),
                        color = MaterialTheme.colorScheme.primary,
                    )
                    IconButton(onClick = onClear) {
                        Icon(Icons.Default.Delete, contentDescription = "Vaciar")
                    }
                }
            },
        )
        if (lines.isEmpty()) {
            Column(
                Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("Tu carrito está vacío", fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(12.dp))
                Button(onClick = onBrowse) { Text("Ir al catálogo") }
            }
        } else {
            if (warnings.isNotEmpty()) {
                Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                    warnings.forEach { w ->
                        Text(w, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(lines, key = { it.productId }) { line ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(
                            Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            ProductThumb(line.imageUrl, line.productName)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(line.productName, maxLines = 2, fontWeight = FontWeight.Medium)
                                Text(formatClp(line.unitPrice), color = MaterialTheme.colorScheme.primary)
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    IconButton(onClick = { onQty(line.productId, line.quantity - 1) }) {
                                        Icon(Icons.Default.Remove, contentDescription = "-")
                                    }
                                    Text("${line.quantity}", fontWeight = FontWeight.Bold)
                                    IconButton(onClick = { onQty(line.productId, line.quantity + 1) }) {
                                        Icon(Icons.Default.Add, contentDescription = "+")
                                    }
                                }
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(formatClp(line.lineTotal), fontWeight = FontWeight.SemiBold)
                                IconButton(onClick = { onRemove(line.productId) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Quitar")
                                }
                            }
                        }
                    }
                }
            }
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Total: ${formatClp(total)}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Button(onClick = onCheckout, modifier = Modifier.fillMaxWidth()) {
                    Text("Retiro en tienda")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    state: AppUiState,
    lines: List<CartLine>,
    onBack: () -> Unit,
    onField: (name: String?, surname: String?, phone: String?, email: String?, notes: String?) -> Unit,
    onUsePoints: (Boolean) -> Unit,
    onSubmitPickup: () -> Unit,
    onSubmitWebpay: () -> Unit,
    onDone: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Retiro en tienda") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
        )
        if (state.checkoutSuccess != null) {
            CheckoutSuccess(state.checkoutSuccess, onDone)
            return
        }
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("${lines.size} productos · ${formatClp(lines.sumOf { it.lineTotal })}", fontWeight = FontWeight.Medium)
            if (state.user == null) {
                Text("Debes iniciar sesión para reservar.", color = MaterialTheme.colorScheme.error)
            }
            OutlinedTextField(
                value = state.checkoutName,
                onValueChange = { onField(it, null, null, null, null) },
                label = { Text("Nombre") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = state.checkoutSurname,
                onValueChange = { onField(null, it, null, null, null) },
                label = { Text("Apellido") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = state.checkoutPhone,
                onValueChange = { onField(null, null, it, null, null) },
                label = { Text("Teléfono *") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            )
            OutlinedTextField(
                value = state.checkoutEmail,
                onValueChange = { onField(null, null, null, it, null) },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            )
            OutlinedTextField(
                value = state.checkoutNotes,
                onValueChange = { onField(null, null, null, null, it) },
                label = { Text("Notas") },
                modifier = Modifier.fillMaxWidth(),
            )
            if ((state.loyalty?.points ?: 0) > 0) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(
                        checked = state.checkoutUsePoints,
                        onCheckedChange = onUsePoints,
                    )
                    Text("Usar ${state.loyalty?.points} puntos de fidelidad")
                }
            }
            state.checkoutError?.let {
                Text(it, color = MaterialTheme.colorScheme.error)
            }
            Button(
                onClick = onSubmitPickup,
                enabled = !state.checkoutLoading && lines.isNotEmpty() && state.user != null,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state.checkoutLoading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Retiro en tienda (sin pago online)")
            }
            OutlinedButton(
                onClick = onSubmitWebpay,
                enabled = !state.checkoutLoading && lines.isNotEmpty() && state.user != null,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Pagar con Webpay")
            }
            Text(
                "Webpay abre Transbank en un WebView seguro. Retiro en tienda crea reserva con código.",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray,
            )
        }
    }
}

@Composable
private fun CheckoutSuccess(res: StorePickupResponse, onDone: () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("¡Reserva lista!", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("Código de retiro", color = Color.Gray)
        Text(res.pickupCode, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Text("Total: ${formatClp(res.total)}")
        Text("Orden: ${res.orderId}", style = MaterialTheme.typography.labelSmall)
        res.expiresAt?.let { Text("Vence: $it", style = MaterialTheme.typography.bodySmall) }
        res.trackingToken?.let {
            Text("Token seguimiento:", style = MaterialTheme.typography.labelMedium)
            Text(it, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(16.dp))
        Button(onClick = onDone, modifier = Modifier.fillMaxWidth()) { Text("Listo") }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    state: AppUiState,
    onBack: () -> Unit,
    onOpen: (String) -> Unit,
    onRefresh: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Mis pedidos") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                Text(
                    "Actualizar",
                    modifier = Modifier
                        .clickable(onClick = onRefresh)
                        .padding(16.dp),
                    color = MaterialTheme.colorScheme.primary,
                )
            },
        )
        when {
            state.ordersLoading && state.orders.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.ordersError != null && state.orders.isEmpty() -> Column(
                Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(state.ordersError, color = MaterialTheme.colorScheme.error)
                Button(onClick = onRefresh) { Text("Reintentar") }
            }
            state.orders.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Aún no tienes pedidos")
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.orders, key = { it.id }) { order ->
                    OrderCard(order, onClick = { onOpen(order.id) })
                }
            }
        }
    }
}

@Composable
private fun OrderCard(
    order: OrderDto,
    onClick: () -> Unit,
    staffActions: Boolean = false,
    onApprove: (() -> Unit)? = null,
    onReject: (() -> Unit)? = null,
    onMarkPaid: (() -> Unit)? = null,
    onRefund: (() -> Unit)? = null,
    onCancel: (() -> Unit)? = null,
) {
    val statusStyle = orderStatusStyle(order.status)
    Card(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(statusStyle.label, fontWeight = FontWeight.Bold, color = statusStyle.color)
                Text(formatClp(order.total), fontWeight = FontWeight.SemiBold)
            }
            Text("ID: ${order.id.take(8)}…", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
            order.createdAt?.let { Text(it.take(16).replace('T', ' '), style = MaterialTheme.typography.bodySmall) }
            order.pickupCode?.let { Text("Retiro: $it", fontWeight = FontWeight.Medium) }
            order.guestName?.let { Text("$it ${order.guestSurname.orEmpty()}".trim()) }
            order.customerPhone?.let { Text("Tel: $it") }
            Text("${order.lineItems.size} ítems", style = MaterialTheme.typography.bodySmall)
            if (staffActions && order.status.equals("reserved", ignoreCase = true)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { onApprove?.invoke() }, modifier = Modifier.weight(1f)) {
                        Text("Aprobar")
                    }
                    OutlinedButton(onClick = { onReject?.invoke() }, modifier = Modifier.weight(1f)) {
                        Text("Rechazar")
                    }
                }
                OutlinedButton(onClick = { onMarkPaid?.invoke() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Marcar pagada")
                }
            }
            if (staffActions && order.status.equals("paid", ignoreCase = true)) {
                OutlinedButton(onClick = { onRefund?.invoke() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Reembolsar")
                }
            }
            if (staffActions && order.status.lowercase() in setOf("pending", "reserved", "processing")) {
                OutlinedButton(onClick = { onCancel?.invoke() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Anular")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailScreen(
    state: AppUiState,
    onBack: () -> Unit,
    isStaff: Boolean = false,
    onApprove: (() -> Unit)? = null,
    onReject: (() -> Unit)? = null,
    onMarkPaid: (() -> Unit)? = null,
    onRefund: (() -> Unit)? = null,
    onCancel: (() -> Unit)? = null,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Detalle pedido") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
        )
        if (state.orderDetailLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        val o = state.orderDetail
        if (o == null) {
            Text("Sin datos", Modifier.padding(24.dp))
            return
        }
        val statusLower = o.status.lowercase()
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(orderStatusLabel(o.status), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = orderStatusStyle(o.status).color)
            Text("Total: ${formatClp(o.total)}", style = MaterialTheme.typography.titleMedium)
            o.pickupCode?.let { Text("Código retiro: $it", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary) }
            o.customerPhone?.let { Text("Tel: $it") }
            o.createdAt?.let { Text("Creado: $it") }
            o.reservationExpiresAt?.let { Text("Reserva vence: $it") }
            o.notes?.let { Text("Notas: $it") }
            if (isStaff) {
                Spacer(Modifier.height(4.dp))
                Text("Acciones staff", fontWeight = FontWeight.Bold)
                if (statusLower == "reserved") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { onApprove?.invoke() }, modifier = Modifier.weight(1f)) {
                            Text("Aprobar")
                        }
                        OutlinedButton(onClick = { onReject?.invoke() }, modifier = Modifier.weight(1f)) {
                            Text("Rechazar")
                        }
                    }
                    OutlinedButton(onClick = { onMarkPaid?.invoke() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Marcar pagada")
                    }
                }
                if (statusLower == "paid") {
                    OutlinedButton(onClick = { onRefund?.invoke() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Reembolsar")
                    }
                }
                if (statusLower in setOf("pending", "reserved", "processing")) {
                    OutlinedButton(onClick = { onCancel?.invoke() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Anular")
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Text("Ítems", fontWeight = FontWeight.Bold)
            o.lineItems.forEach { item ->
                Card(Modifier.fillMaxWidth()) {
                    Row(
                        Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(item.productName, fontWeight = FontWeight.Medium)
                            Text("x${item.quantity}")
                        }
                        Text(formatClp(item.priceAtPurchase))
                    }
                }
                Spacer(Modifier.height(6.dp))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    loading: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit,
    embedded: Boolean,
    onBack: (() -> Unit)? = null,
    onRegister: (() -> Unit)? = null,
    onForgotPassword: (() -> Unit)? = null,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize()) {
        if (!embedded) {
            TopAppBar(
                title = { Text("Iniciar sesión") },
                navigationIcon = {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                        }
                    }
                },
            )
        } else {
            TopAppBar(title = { Text("Cuenta") })
        }
        Column(
            Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Misma cuenta de tu-farmacia.cl", style = MaterialTheme.typography.bodyMedium)
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Correo") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next, keyboardType = KeyboardType.Email),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Contraseña") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(
                    onDone = { if (email.isNotBlank() && password.isNotBlank()) onLogin(email, password) },
                ),
            )
            if (error != null) Text(error, color = MaterialTheme.colorScheme.error)
            Button(
                onClick = { onLogin(email, password) },
                enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Entrar")
            }
            if (onForgotPassword != null) {
                Text(
                    "¿Olvidaste tu contraseña?",
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .clickable(onClick = onForgotPassword)
                        .padding(vertical = 8.dp),
                )
            }
            if (onRegister != null) {
                OutlinedButton(onClick = onRegister, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                    Text("Crear cuenta")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForgotPasswordScreen(
    loading: Boolean,
    error: String?,
    success: Boolean,
    onSend: (String) -> Unit,
    onBack: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Recuperar contraseña") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
        )
        Column(
            Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                "Te enviaremos un enlace a tu correo para restablecer la contraseña (Firebase).",
                style = MaterialTheme.typography.bodyMedium,
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Correo") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            )
            if (error != null) Text(error, color = MaterialTheme.colorScheme.error)
            if (success) {
                Text(
                    "Correo enviado. Revisa tu bandeja (y spam).",
                    color = Color(0xFF16A34A),
                    fontWeight = FontWeight.Medium,
                )
            }
            Button(
                onClick = { onSend(email.trim()) },
                enabled = !loading && email.contains("@"),
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Enviar enlace")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    loading: Boolean,
    error: String?,
    onRegister: (email: String, password: String, name: String, surname: String, phone: String) -> Unit,
    onBack: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var surname by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Crear cuenta") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
        )
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nombre *") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = surname, onValueChange = { surname = it }, label = { Text("Apellido") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Correo *") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            )
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Teléfono") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Contraseña * (mín. 6)") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )
            if (error != null) Text(error, color = MaterialTheme.colorScheme.error)
            Button(
                onClick = { onRegister(email, password, name, surname, phone) },
                enabled = !loading && email.isNotBlank() && password.length >= 6 && name.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Registrarme")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountScreen(
    user: AuthUser,
    loyalty: LoyaltyResponse?,
    profilePhone: String,
    profileSaving: Boolean,
    profileError: String?,
    fontScaleKey: String,
    highContrast: Boolean,
    onLogout: () -> Unit,
    onOrders: () -> Unit,
    onTrack: () -> Unit,
    onRefreshLoyalty: () -> Unit,
    onSaveProfile: (name: String, phone: String) -> Unit,
    onFontScale: (String) -> Unit,
    onHighContrast: (Boolean) -> Unit,
) {
    var name by remember(user.name) { mutableStateOf(user.name.orEmpty()) }
    var phone by remember(profilePhone) { mutableStateOf(profilePhone) }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Mi cuenta") })
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(user.name ?: "Usuario", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(user.email ?: "—")
            Text("Rol: ${user.role}")
            if (user.isAdmin) {
                Text("Staff: pestaña ERP disponible", color = MaterialTheme.colorScheme.primary)
            }
            Text("Editar perfil", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nombre") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Teléfono") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            )
            if (profileError != null) Text(profileError, color = MaterialTheme.colorScheme.error)
            Button(
                onClick = { onSaveProfile(name, phone) },
                enabled = !profileSaving,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                if (profileSaving) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Guardar perfil")
            }
            Text("Accesibilidad", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
            Row(
                Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                listOf("normal" to "Normal", "large" to "Grande", "extra" to "Extra").forEach { (key, label) ->
                    FilterChip(
                        selected = fontScaleKey == key,
                        onClick = { onFontScale(key) },
                        label = { Text(label) },
                    )
                }
            }
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Alto contraste")
                FilterChip(
                    selected = highContrast,
                    onClick = { onHighContrast(!highContrast) },
                    label = { Text(if (highContrast) "Activado" else "Apagado") },
                )
            }
            if (loyalty != null) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Fidelidad", fontWeight = FontWeight.SemiBold)
                        Text("${loyalty.points} puntos · valor ~${formatClp(loyalty.pointsValue.toDouble())}")
                        Text(
                            "Actualizar puntos",
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.clickable(onClick = onRefreshLoyalty),
                        )
                    }
                }
                if (loyalty.transactions.isNotEmpty()) {
                    Text("Movimientos de puntos", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                    loyalty.transactions.take(15).forEach { tx ->
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp)) {
                                val sign = if (tx.points >= 0) "+" else ""
                                Text(
                                    "$sign${tx.points} pts",
                                    fontWeight = FontWeight.Bold,
                                    color = if (tx.points >= 0) Color(0xFF16A34A) else MaterialTheme.colorScheme.error,
                                )
                                tx.reason?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                                tx.createdAt?.let {
                                    Text(it.take(16).replace('T', ' '), style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                                }
                            }
                        }
                    }
                }
            }
            Button(onClick = onOrders, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Mis pedidos") }
            OutlinedButton(onClick = onTrack, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Rastrear pedido") }
            OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text("Cerrar sesión") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackScreen(
    token: String,
    loading: Boolean,
    error: String?,
    result: TrackingResponse?,
    onTokenChange: (String) -> Unit,
    onTrack: () -> Unit,
    onBack: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Rastrear pedido") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
        )
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Pega el token de seguimiento del email o SMS.", style = MaterialTheme.typography.bodyMedium)
            OutlinedTextField(
                value = token,
                onValueChange = onTokenChange,
                label = { Text("Token de tracking") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            if (error != null) Text(error, color = MaterialTheme.colorScheme.error)
            Button(onClick = onTrack, enabled = !loading && token.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Buscar")
            }
            result?.let { r ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(orderStatusLabel(r.status), fontWeight = FontWeight.Bold, color = orderStatusStyle(r.status).color)
                        Text("Total: ${formatClp(r.total)}")
                        r.pickupCode?.let { Text("Código retiro: $it", fontWeight = FontWeight.SemiBold) }
                        r.customerName?.let { Text("Cliente: $it") }
                        r.createdAt?.let { Text("Creado: $it", style = MaterialTheme.typography.bodySmall) }
                        Text("Ítems:", fontWeight = FontWeight.Medium)
                        r.items.forEach { item ->
                            Text("• ${item.productName} x${item.quantity} — ${formatClp(item.priceAtPurchase)}")
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminScreen(
    state: AppUiState,
    user: AuthUser?,
    onRefresh: () -> Unit,
    onStatusFilter: (String?) -> Unit,
    onSearchChange: (String) -> Unit,
    onSearch: () -> Unit,
    onApprove: (String) -> Unit,
    onReject: (String) -> Unit,
    onMarkPaid: (String) -> Unit,
    onRefund: (String) -> Unit = {},
    onCancel: (String) -> Unit = {},
    onOpenOrder: (String) -> Unit = {},
    onBack: (() -> Unit)? = null,
) {
    val statuses = listOf(null to "Todas", "reserved" to "Reservadas", "paid" to "Pagadas", "processing" to "Proceso", "cancelled" to "Anuladas")
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("ERP · Órdenes") },
            navigationIcon = {
                if (onBack != null) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            },
            actions = {
                Text(
                    "Actualizar",
                    modifier = Modifier
                        .clickable(onClick = onRefresh)
                        .padding(16.dp),
                    color = MaterialTheme.colorScheme.primary,
                )
            },
        )
        Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Usuario: ${user?.email ?: "—"} · ${user?.role ?: "—"}", style = MaterialTheme.typography.bodySmall)
            OutlinedTextField(
                value = state.adminSearch,
                onValueChange = onSearchChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Buscar nombre, teléfono, id…") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { onSearch() }),
            )
            Row(
                Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                statuses.forEach { (value, label) ->
                    FilterChip(
                        selected = state.adminStatusFilter == value,
                        onClick = { onStatusFilter(value) },
                        label = { Text(label) },
                    )
                }
            }
        }
        when {
            state.adminOrdersLoading && state.adminOrders.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.adminOrdersError != null && state.adminOrders.isEmpty() -> Column(
                Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(state.adminOrdersError, color = MaterialTheme.colorScheme.error)
                Button(onClick = onRefresh) { Text("Reintentar") }
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Text("Órdenes", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                }
                items(state.adminOrders, key = { it.id }) { order ->
                    OrderCard(
                        order = order,
                        onClick = { onOpenOrder(order.id) },
                        staffActions = true,
                        onApprove = { onApprove(order.id) },
                        onReject = { onReject(order.id) },
                        onMarkPaid = { onMarkPaid(order.id) },
                        onRefund = { onRefund(order.id) },
                        onCancel = { onCancel(order.id) },
                    )
                }
                if (state.adminOrders.isEmpty()) {
                    item { Text("Sin órdenes", Modifier.padding(8.dp)) }
                }
                item {
                    Spacer(Modifier.height(12.dp))
                    Text("Stock bajo", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                }
                if (state.lowStockLoading) {
                    item { CircularProgressIndicator(Modifier.padding(8.dp)) }
                } else if (state.lowStock.isEmpty()) {
                    item { Text("Sin alertas de stock bajo", style = MaterialTheme.typography.bodySmall, color = Color.Gray) }
                } else {
                    items(state.lowStock, key = { "ls-${it.id}" }) { p ->
                        Card(Modifier.fillMaxWidth()) {
                            Row(
                                Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(p.name, Modifier.weight(1f), maxLines = 2)
                                Text("Stock ${p.stock}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
    }
}
