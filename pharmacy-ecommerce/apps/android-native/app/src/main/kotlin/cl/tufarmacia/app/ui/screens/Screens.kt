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
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.ui.text.style.TextAlign
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
import cl.tufarmacia.app.ui.components.EmptyState
import cl.tufarmacia.app.ui.components.HeroBanner
import cl.tufarmacia.app.ui.components.PillKind
import cl.tufarmacia.app.ui.components.QtyStepper
import cl.tufarmacia.app.ui.components.QuickActionTile
import cl.tufarmacia.app.ui.components.SectionTitle
import cl.tufarmacia.app.ui.components.StatusPill
import cl.tufarmacia.app.ui.components.TfCard
import cl.tufarmacia.app.ui.components.TfPrimaryButton
import cl.tufarmacia.app.ui.components.TfSecondaryButton
import cl.tufarmacia.app.ui.components.TfTextField
import cl.tufarmacia.app.ui.theme.BorderSoft
import cl.tufarmacia.app.ui.theme.BrandCyanSoft
import cl.tufarmacia.app.ui.theme.Danger
import cl.tufarmacia.app.ui.theme.DangerBg
import cl.tufarmacia.app.ui.theme.Ink
import cl.tufarmacia.app.ui.theme.InkMuted
import cl.tufarmacia.app.ui.theme.Success
import cl.tufarmacia.app.ui.theme.SuccessBg
import cl.tufarmacia.app.ui.theme.Warning
import cl.tufarmacia.app.ui.theme.WarningBg
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
            .background(MaterialTheme.colorScheme.primary),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = Color.White.copy(alpha = 0.15f),
            ) {
                Text(
                    "TF",
                    modifier = Modifier.padding(horizontal = 22.dp, vertical = 14.dp),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.headlineMedium,
                )
            }
            Spacer(Modifier.height(20.dp))
            Text(
                "Tu Farmacia",
                style = MaterialTheme.typography.headlineLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Text("Coquimbo · Retiro en tienda", color = Color.White.copy(alpha = 0.9f))
            Spacer(Modifier.height(28.dp))
            CircularProgressIndicator(color = Color.White, strokeWidth = 3.dp)
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
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    "Tu Farmacia",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text(
                    if (user != null) "Hola, ${user.name ?: user.email ?: "usuario"}"
                    else "Coquimbo · adultos mayores",
                    style = MaterialTheme.typography.bodyMedium,
                    color = InkMuted,
                )
            }
            TextButton(onClick = onRefresh) {
                Text("Actualizar")
            }
        }

        HeroBanner(
            title = if (productCount > 0) "$productCount productos listos" else "Tu farmacia de confianza",
            subtitle = "Catálogo en vivo · carrito · retiro en tienda · misma cuenta web",
        )

        TfPrimaryButton(text = "Ver catálogo", onClick = onOpenCatalog)

        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            QuickActionTile(
                title = if (cartCount > 0) "Carrito ($cartCount)" else "Carrito",
                subtitle = "Revisa y reserva",
                icon = Icons.Default.ShoppingCart,
                onClick = onOpenCart,
                modifier = Modifier.weight(1f),
                highlight = cartCount > 0,
            )
            QuickActionTile(
                title = "Rastrear",
                subtitle = "Código de pedido",
                icon = Icons.Default.Search,
                onClick = onOpenTrack,
                modifier = Modifier.weight(1f),
            )
        }

        if (user != null) {
            QuickActionTile(
                title = "Mis pedidos",
                subtitle = "Historial y estados",
                icon = Icons.Default.Person,
                onClick = onOpenOrders,
                modifier = Modifier.fillMaxWidth(),
            )
        } else {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(Modifier.weight(1f)) {
                    TfSecondaryButton(text = "Iniciar sesión", onClick = onOpenLogin)
                }
                Box(Modifier.weight(1f)) {
                    TfPrimaryButton(text = "Crear cuenta", onClick = onOpenRegister)
                }
            }
        }

        if (topSellers.isNotEmpty()) {
            SectionTitle("Más vendidos")
            topSellers.forEach { item ->
                TfCard(onClick = { onOpenProduct(item.slug) }) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        ProductThumb(item.imageUrl, item.name)
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                item.name,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = Ink,
                            )
                            Text(
                                formatClp(item.price),
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.titleMedium,
                            )
                            StatusPill("${item.unitsSold} vendidos", PillKind.Info)
                        }
                    }
                }
            }
        }
        Spacer(Modifier.height(8.dp))
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Producto", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        when {
            state.productDetailLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            state.productDetailError != null -> EmptyState(
                title = "No se pudo cargar",
                subtitle = state.productDetailError,
                actionLabel = "Reintentar",
                onAction = onRetry,
            )
            state.productDetail != null -> {
                val p = state.productDetail
                val disc = p.discountPercent ?: 0
                Column(Modifier.fillMaxSize()) {
                    Column(
                        Modifier
                            .weight(1f)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        if (p.imageUrl != null) {
                            AsyncImage(
                                model = p.imageUrl,
                                contentDescription = p.name,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(260.dp)
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFFF1F5F9)),
                                contentScale = ContentScale.Crop,
                            )
                        } else {
                            Box(
                                Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(BrandCyanSoft),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text("Rx", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            }
                        }
                        Text(p.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(
                                formatClp(p.unitPrice()),
                                style = MaterialTheme.typography.headlineMedium,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold,
                            )
                            if (disc > 0) StatusPill("-$disc%", PillKind.Danger)
                        }
                        StatusPill(
                            text = when {
                                p.stock <= 0 -> "Agotado"
                                p.stock <= 5 -> "Pocas unidades (${p.stock})"
                                else -> "Disponible (${p.stock})"
                            },
                            kind = when {
                                p.stock <= 0 -> PillKind.Danger
                                p.stock <= 5 -> PillKind.Warning
                                else -> PillKind.Success
                            },
                        )
                        TfCard {
                            p.activeIngredient?.let { MetaLine("Principio activo", it) }
                            p.laboratory?.let { MetaLine("Laboratorio", it) }
                            p.presentation?.let { MetaLine("Presentación", it) }
                            p.therapeuticAction?.let { MetaLine("Acción", it) }
                            p.prescriptionType?.let { MetaLine("Receta", it) }
                            p.categoryName?.let { MetaLine("Categoría", it) }
                        }
                        p.description?.takeIf { it.isNotBlank() }?.let {
                            SectionTitle("Descripción")
                            Text(it, style = MaterialTheme.typography.bodyLarge, color = InkMuted)
                        }
                        Spacer(Modifier.height(8.dp))
                    }
                    Surface(
                        tonalElevation = 3.dp,
                        shadowElevation = 8.dp,
                        color = MaterialTheme.colorScheme.surface,
                    ) {
                        Column(
                            Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                QtyStepper(
                                    qty = qty,
                                    onMinus = { qty = (qty - 1).coerceAtLeast(1) },
                                    onPlus = { qty = (qty + 1).coerceAtMost(p.stock.coerceAtLeast(1)) },
                                    minusEnabled = qty > 1,
                                    plusEnabled = qty < p.stock,
                                )
                                Text(
                                    formatClp(p.unitPrice() * qty),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = Ink,
                                )
                            }
                            TfPrimaryButton(
                                text = if (p.stock > 0) "Agregar $qty al carrito" else "Sin stock",
                                onClick = { onAddToCart(p, qty) },
                                enabled = p.stock > 0,
                            )
                            TfSecondaryButton(text = "Ver carrito", onClick = onOpenCart)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetaLine(label: String, value: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = InkMuted)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, color = Ink)
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Carrito", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                if (lines.isNotEmpty()) {
                    TextButton(onClick = onRefresh) {
                        Text(if (revalidating) "…" else "Actualizar")
                    }
                    IconButton(onClick = onClear) {
                        Icon(Icons.Default.Delete, contentDescription = "Vaciar", tint = Danger)
                    }
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        if (lines.isEmpty()) {
            EmptyState(
                title = "Tu carrito está vacío",
                subtitle = "Agrega medicamentos desde el catálogo para reservar retiro en tienda.",
                actionLabel = "Ir al catálogo",
                onAction = onBrowse,
            )
        } else {
            if (warnings.isNotEmpty()) {
                Surface(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = DangerBg,
                ) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        warnings.forEach { w ->
                            Text(w, color = Danger, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(lines, key = { it.productId }) { line ->
                    TfCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            ProductThumb(line.imageUrl, line.productName)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    line.productName,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                    fontWeight = FontWeight.SemiBold,
                                    style = MaterialTheme.typography.titleSmall,
                                )
                                Text(formatClp(line.unitPrice), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                QtyStepper(
                                    qty = line.quantity,
                                    onMinus = { onQty(line.productId, line.quantity - 1) },
                                    onPlus = { onQty(line.productId, line.quantity + 1) },
                                    minusEnabled = true,
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(formatClp(line.lineTotal), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                                IconButton(onClick = { onRemove(line.productId) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Quitar", tint = InkMuted)
                                }
                            }
                        }
                    }
                }
            }
            Surface(shadowElevation = 10.dp, color = MaterialTheme.colorScheme.surface) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total", style = MaterialTheme.typography.titleMedium, color = InkMuted)
                        Text(formatClp(total), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = Ink)
                    }
                    TfPrimaryButton(text = "Continuar · retiro en tienda", onClick = onCheckout)
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Retiro en tienda", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
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
            TfCard {
                Text("Resumen", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(6.dp))
                Text(
                    "${lines.size} productos · ${formatClp(lines.sumOf { it.lineTotal })}",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
            }
            if (state.user == null) {
                Surface(shape = RoundedCornerShape(12.dp), color = DangerBg, modifier = Modifier.fillMaxWidth()) {
                    Text(
                        "Debes iniciar sesión para reservar.",
                        Modifier.padding(12.dp),
                        color = Danger,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
            SectionTitle("Tus datos")
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
            TfPrimaryButton(
                text = "Reservar retiro (sin pago online)",
                onClick = onSubmitPickup,
                enabled = !state.checkoutLoading && lines.isNotEmpty() && state.user != null,
                loading = state.checkoutLoading,
            )
            TfSecondaryButton(
                text = "Pagar con Webpay",
                onClick = onSubmitWebpay,
                enabled = !state.checkoutLoading && lines.isNotEmpty() && state.user != null,
            )
            Text(
                "Webpay abre Transbank de forma segura. El retiro genera un código de 6 dígitos.",
                style = MaterialTheme.typography.bodySmall,
                color = InkMuted,
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
        verticalArrangement = Arrangement.spacedBy(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Surface(shape = CircleShape, color = SuccessBg, modifier = Modifier.size(72.dp)) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("✓", style = MaterialTheme.typography.headlineLarge, color = Success, fontWeight = FontWeight.Bold)
            }
        }
        Text("¡Reserva lista!", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("Código de retiro", color = InkMuted)
        Surface(shape = RoundedCornerShape(16.dp), color = BrandCyanSoft, modifier = Modifier.fillMaxWidth()) {
            Text(
                res.pickupCode,
                modifier = Modifier.padding(vertical = 20.dp).fillMaxWidth(),
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                textAlign = TextAlign.Center,
            )
        }
        Text("Total: ${formatClp(res.total)}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Text("Orden: ${res.orderId.take(8)}…", style = MaterialTheme.typography.labelMedium, color = InkMuted)
        res.expiresAt?.let { Text("Vence: $it", style = MaterialTheme.typography.bodySmall, color = InkMuted) }
        Spacer(Modifier.height(8.dp))
        TfPrimaryButton(text = "Listo", onClick = onDone)
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Mis pedidos", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                TextButton(onClick = onRefresh) { Text("Actualizar") }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
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
            state.orders.isEmpty() -> EmptyState(
                title = "Aún no tienes pedidos",
                subtitle = "Cuando reserves o pagues, aparecerán aquí con su estado.",
            )
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
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(shape = RoundedCornerShape(8.dp), color = statusStyle.color.copy(alpha = 0.12f)) {
                    Text(
                        statusStyle.label,
                        Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Bold,
                        color = statusStyle.color,
                        style = MaterialTheme.typography.labelMedium,
                    )
                }
                Text(
                    formatClp(order.total),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium,
                    color = Ink,
                )
            }
            Text("ID: ${order.id.take(8)}…", style = MaterialTheme.typography.labelSmall, color = InkMuted)
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Detalle pedido", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
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
            SectionTitle("Ítems")
            o.lineItems.forEach { item ->
                TfCard {
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(item.productName, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Text("×${item.quantity}", color = InkMuted, style = MaterialTheme.typography.bodySmall)
                        }
                        Text(formatClp(item.priceAtPurchase), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    }
                }
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

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        if (!embedded) {
            TopAppBar(
                title = { Text("Iniciar sesión", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        } else {
            TopAppBar(
                title = { Text("Cuenta", fontWeight = FontWeight.SemiBold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        }
        Column(
            Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            if (!embedded) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Tu Farmacia", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
                        Text("Coquimbo · misma cuenta web", color = Color.White.copy(alpha = 0.9f), style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
            Text(
                "Misma cuenta de tu-farmacia.cl",
                style = MaterialTheme.typography.bodyLarge,
                color = InkMuted,
            )
            TfTextField(
                value = email,
                onValueChange = { email = it },
                label = "Correo",
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next, keyboardType = KeyboardType.Email),
            )
            TfTextField(
                value = password,
                onValueChange = { password = it },
                label = "Contraseña",
                visualTransformation = PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(
                    onDone = { if (email.isNotBlank() && password.isNotBlank()) onLogin(email, password) },
                ),
            )
            if (error != null) Text(error, color = Danger, fontWeight = FontWeight.Medium)
            TfPrimaryButton(
                text = "Entrar",
                onClick = { onLogin(email, password) },
                enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                loading = loading,
            )
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
                TfSecondaryButton(text = "Crear cuenta", onClick = onRegister)
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Recuperar contraseña", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        Column(
            Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            TfCard {
                Text(
                    "Te enviaremos un enlace a tu correo para restablecer la contraseña.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = InkMuted,
                )
            }
            TfTextField(
                value = email,
                onValueChange = { email = it },
                label = "Correo",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            )
            if (error != null) Text(error, color = Danger, fontWeight = FontWeight.Medium)
            if (success) {
                StatusPill("Correo enviado. Revisa bandeja y spam.", PillKind.Success)
            }
            TfPrimaryButton(
                text = "Enviar enlace",
                onClick = { onSend(email.trim()) },
                enabled = !loading && email.contains("@"),
                loading = loading,
            )
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

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Crear cuenta", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Datos personales", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium, color = Ink)
            TfTextField(value = name, onValueChange = { name = it }, label = "Nombre *")
            TfTextField(value = surname, onValueChange = { surname = it }, label = "Apellido")
            TfTextField(
                value = email,
                onValueChange = { email = it },
                label = "Correo *",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            )
            TfTextField(
                value = phone,
                onValueChange = { phone = it },
                label = "Teléfono",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            )
            TfTextField(
                value = password,
                onValueChange = { password = it },
                label = "Contraseña * (mín. 6)",
                visualTransformation = PasswordVisualTransformation(),
            )
            if (error != null) Text(error, color = Danger, fontWeight = FontWeight.Medium)
            TfPrimaryButton(
                text = "Registrarme",
                onClick = { onRegister(email, password, name, surname, phone) },
                enabled = !loading && email.isNotBlank() && password.length >= 6 && name.isNotBlank(),
                loading = loading,
            )
            Text(
                "Al crear la cuenta usas el mismo acceso que en tu-farmacia.cl",
                style = MaterialTheme.typography.bodySmall,
                color = InkMuted,
            )
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Mi cuenta", fontWeight = FontWeight.SemiBold) },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            TfCard {
                Text(user.name ?: "Usuario", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Ink)
                Spacer(Modifier.height(4.dp))
                Text(user.email ?: "—", color = InkMuted)
                Spacer(Modifier.height(8.dp))
                StatusPill("Rol: ${user.role}", if (user.isAdmin) PillKind.Info else PillKind.Neutral)
                if (user.isAdmin) {
                    Spacer(Modifier.height(6.dp))
                    Text("Staff: pestaña ERP disponible", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Medium)
                }
            }
            SectionTitle("Editar perfil")
            TfTextField(value = name, onValueChange = { name = it }, label = "Nombre")
            TfTextField(
                value = phone,
                onValueChange = { phone = it },
                label = "Teléfono",
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            )
            if (profileError != null) Text(profileError, color = Danger, fontWeight = FontWeight.Medium)
            TfPrimaryButton(
                text = "Guardar perfil",
                onClick = { onSaveProfile(name, phone) },
                enabled = !profileSaving,
                loading = profileSaving,
            )
            SectionTitle("Accesibilidad")
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
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Fidelidad", fontWeight = FontWeight.SemiBold, color = Color.White.copy(alpha = 0.9f))
                        Text(
                            "${loyalty.points} puntos",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                        Text(
                            "Valor aprox. ${formatClp(loyalty.pointsValue.toDouble())}",
                            color = Color.White.copy(alpha = 0.9f),
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Text(
                            "Actualizar puntos",
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier
                                .clickable(onClick = onRefreshLoyalty)
                                .padding(top = 4.dp),
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
            SectionTitle("Acciones")
            TfPrimaryButton(text = "Mis pedidos", onClick = onOrders)
            TfSecondaryButton(text = "Rastrear pedido", onClick = onTrack)
            OutlinedButton(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Danger),
            ) { Text("Cerrar sesión", fontWeight = FontWeight.SemiBold) }
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Rastrear pedido", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            TfCard {
                Text(
                    "Pega el token de seguimiento del email o SMS.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = InkMuted,
                )
            }
            TfTextField(
                value = token,
                onValueChange = onTokenChange,
                label = "Token de tracking",
            )
            if (error != null) Text(error, color = Danger, fontWeight = FontWeight.Medium)
            TfPrimaryButton(
                text = "Buscar",
                onClick = onTrack,
                enabled = !loading && token.isNotBlank(),
                loading = loading,
            )
            result?.let { r ->
                val st = orderStatusStyle(r.status)
                TfCard {
                    Surface(shape = RoundedCornerShape(8.dp), color = st.color.copy(alpha = 0.12f)) {
                        Text(
                            orderStatusLabel(r.status),
                            Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            fontWeight = FontWeight.Bold,
                            color = st.color,
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Text("Total: ${formatClp(r.total)}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = Ink)
                    r.pickupCode?.let {
                        Spacer(Modifier.height(6.dp))
                        Text("Código retiro: $it", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.titleMedium)
                    }
                    r.customerName?.let { Text("Cliente: $it", color = InkMuted) }
                    r.createdAt?.let { Text("Creado: $it", style = MaterialTheme.typography.bodySmall, color = InkMuted) }
                    Spacer(Modifier.height(8.dp))
                    SectionTitle("Ítems")
                    r.items.forEach { item ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${item.productName} ×${item.quantity}", Modifier.weight(1f), maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Text(formatClp(item.priceAtPurchase), fontWeight = FontWeight.SemiBold)
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
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("ERP · Órdenes", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                if (onBack != null) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            },
            actions = {
                TextButton(onClick = onRefresh) { Text("Actualizar") }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Usuario: ${user?.email ?: "—"} · ${user?.role ?: "—"}", style = MaterialTheme.typography.bodySmall, color = InkMuted)
            OutlinedTextField(
                value = state.adminSearch,
                onValueChange = onSearchChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Buscar nombre, teléfono, id…") },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                ),
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
