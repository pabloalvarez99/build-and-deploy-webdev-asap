package cl.tufarmacia.app.ui.erp

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import cl.tufarmacia.app.data.model.DiscountProductDto
import cl.tufarmacia.app.util.formatClp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpDescuentosScreen(
    state: ErpUiState,
    isOwner: Boolean,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onTab: (String) -> Unit,
    onApply: (scope: String, categoryId: String?, percent: Int, notify: Boolean) -> Unit,
    onRemove: (scope: String, categoryId: String?) -> Unit,
    onSaveLoyalty: (pointsPerClp: Int, clpPerPoint: Int, enabled: Boolean) -> Unit,
) {
    val data = state.descuentos
    val tab = state.descuentosTab

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Descuentos", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                TextButton(onClick = onRefresh, enabled = !state.descuentosLoading) {
                    Text("Actualizar")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )

        Row(
            Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            listOf(
                "list" to "Activos",
                "apply" to "Aplicar",
                "remove" to "Quitar",
                "loyalty" to "Puntos",
            ).forEach { (id, label) ->
                FilterChip(
                    selected = tab == id,
                    onClick = { onTab(id) },
                    label = { Text(label) },
                )
            }
        }

        if (state.descuentosLoading && data == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return
        }

        when (tab) {
            "apply" -> ApplyDiscountPanel(
                state = state,
                onApply = onApply,
            )
            "remove" -> RemoveDiscountPanel(
                state = state,
                onRemove = onRemove,
            )
            "loyalty" -> LoyaltyPanel(
                state = state,
                isOwner = isOwner,
                onSave = onSaveLoyalty,
            )
            else -> ActiveDiscountsPanel(state = state)
        }
    }
}

@Composable
private fun ActiveDiscountsPanel(state: ErpUiState) {
    val data = state.descuentos
    val products = data?.products.orEmpty()
    val summary = data?.summary

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                KpiMini(
                    title = "Con descuento",
                    value = "${summary?.totalDiscounted ?: 0}",
                    modifier = Modifier.weight(1f),
                )
                KpiMini(
                    title = "Categorías",
                    value = "${summary?.byCategory?.size ?: 0}",
                    modifier = Modifier.weight(1f),
                )
            }
        }

        summary?.byCategory?.takeIf { it.isNotEmpty() }?.let { cats ->
            item {
                Text("Por categoría", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
            }
            items(cats, key = { "cat-${it.name}" }) { cat ->
                Card(
                    Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                ) {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(cat.name ?: "Sin categoría", fontWeight = FontWeight.Medium)
                            Text(
                                "${cat.count} productos",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF64748B),
                            )
                        }
                        Text(
                            "avg ${cat.avgDiscount}%",
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(4.dp))
            Text(
                "Productos (${products.size})",
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleSmall,
            )
        }

        if (products.isEmpty()) {
            item {
                Text(
                    "No hay descuentos activos",
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(vertical = 24.dp),
                )
            }
        } else {
            items(products, key = { it.id }) { p ->
                DiscountProductCard(p)
            }
        }
    }
}

@Composable
private fun DiscountProductCard(p: DiscountProductDto) {
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    p.name ?: "Producto",
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    "−${p.discountPercent}%",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error,
                )
            }
            val price = p.priceValue
            val final = if (p.discountPercent > 0) {
                price * (100 - p.discountPercent) / 100.0
            } else {
                price
            }
            Text(
                "${formatClp(price)} → ${formatClp(final)}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(
                "${p.categoryName ?: "Sin categoría"} · stock ${p.stock}",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFF64748B),
            )
        }
    }
}

@Composable
private fun ApplyDiscountPanel(
    state: ErpUiState,
    onApply: (scope: String, categoryId: String?, percent: Int, notify: Boolean) -> Unit,
) {
    val categories = state.descuentos?.categories.orEmpty()
    var scope by remember { mutableStateOf("category") }
    var categoryId by remember { mutableStateOf(categories.firstOrNull()?.id.orEmpty()) }
    var percent by remember { mutableStateOf("10") }
    var notify by remember { mutableStateOf(true) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Aplicar descuento masivo", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Text(
            "Define % y alcance. Opcionalmente notifica a clientes con push.",
            style = MaterialTheme.typography.bodySmall,
            color = Color(0xFF64748B),
        )

        Text("Alcance", style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            FilterChip(
                selected = scope == "category",
                onClick = { scope = "category" },
                label = { Text("Categoría") },
            )
            FilterChip(
                selected = scope == "all",
                onClick = { scope = "all" },
                label = { Text("Todo el catálogo") },
            )
        }

        if (scope == "category") {
            Text("Categoría", style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
            Row(
                Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                categories.forEach { cat ->
                    FilterChip(
                        selected = categoryId == cat.id,
                        onClick = { categoryId = cat.id },
                        label = { Text(cat.name ?: cat.id.take(6)) },
                    )
                }
            }
            if (categories.isEmpty()) {
                Text("Sin categorías cargadas", color = MaterialTheme.colorScheme.error)
            }
        }

        OutlinedTextField(
            value = percent,
            onValueChange = { percent = it.filter { ch -> ch.isDigit() }.take(2) },
            label = { Text("% Descuento (0–99)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )

        FilterChip(
            selected = notify,
            onClick = { notify = !notify },
            label = { Text(if (notify) "Notificar push ✓" else "Sin notificación") },
        )

        Button(
            onClick = {
                onApply(
                    scope,
                    if (scope == "category") categoryId.ifBlank { null } else null,
                    percent.toIntOrNull() ?: -1,
                    notify,
                )
            },
            enabled = !state.descuentosBusy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.descuentosBusy) "Aplicando…" else "Aplicar descuento")
        }
    }
}

@Composable
private fun RemoveDiscountPanel(
    state: ErpUiState,
    onRemove: (scope: String, categoryId: String?) -> Unit,
) {
    val categories = state.descuentos?.categories.orEmpty()
    var scope by remember { mutableStateOf("category") }
    var categoryId by remember { mutableStateOf(categories.firstOrNull()?.id.orEmpty()) }
    var confirm by remember { mutableStateOf(false) }

    if (confirm) {
        AlertDialog(
            onDismissRequest = { confirm = false },
            title = { Text("Confirmar") },
            text = {
                Text(
                    if (scope == "all") {
                        "¿Quitar TODOS los descuentos activos del catálogo?"
                    } else {
                        val name = categories.find { it.id == categoryId }?.name ?: "esta categoría"
                        "¿Quitar descuentos de $name?"
                    },
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirm = false
                        onRemove(
                            scope,
                            if (scope == "category") categoryId.ifBlank { null } else null,
                        )
                    },
                ) { Text("Quitar") }
            },
            dismissButton = {
                TextButton(onClick = { confirm = false }) { Text("Cancelar") }
            },
        )
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Quitar descuentos", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Text(
            "Pone discount_percent = 0 en el alcance elegido.",
            style = MaterialTheme.typography.bodySmall,
            color = Color(0xFF64748B),
        )

        Text("Alcance", style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            FilterChip(
                selected = scope == "category",
                onClick = { scope = "category" },
                label = { Text("Categoría") },
            )
            FilterChip(
                selected = scope == "all",
                onClick = { scope = "all" },
                label = { Text("Todos") },
            )
        }

        if (scope == "category") {
            Row(
                Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                categories.forEach { cat ->
                    FilterChip(
                        selected = categoryId == cat.id,
                        onClick = { categoryId = cat.id },
                        label = { Text(cat.name ?: cat.id.take(6)) },
                    )
                }
            }
        }

        OutlinedButton(
            onClick = { confirm = true },
            enabled = !state.descuentosBusy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (state.descuentosBusy) "Procesando…" else "Quitar descuentos")
        }
    }
}

@Composable
private fun LoyaltyPanel(
    state: ErpUiState,
    isOwner: Boolean,
    onSave: (pointsPerClp: Int, clpPerPoint: Int, enabled: Boolean) -> Unit,
) {
    val loyalty = state.descuentos?.loyalty
    var pointsPerClp by remember(loyalty?.pointsPerClp) {
        mutableStateOf((loyalty?.pointsPerClp ?: 1000).toString())
    }
    var clpPerPoint by remember(loyalty?.clpPerPoint) {
        mutableStateOf((loyalty?.clpPerPoint ?: 100).toString())
    }
    var enabled by remember(loyalty?.enabled) {
        mutableStateOf(loyalty?.enabled ?: true)
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Programa de puntos", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)

        if (loyalty != null) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                KpiMini(
                    title = "Usuarios c/ puntos",
                    value = "${loyalty.totalUsersWithPoints}",
                    modifier = Modifier.weight(1f),
                )
                KpiMini(
                    title = "Equivalente CLP",
                    value = formatClp(loyalty.totalClpEquivalent),
                    modifier = Modifier.weight(1f),
                )
            }
            Text(
                "En circulación: ${loyalty.totalPointsInCirculation} pts",
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF64748B),
            )
        }

        FilterChip(
            selected = enabled,
            onClick = { if (isOwner) enabled = !enabled },
            enabled = isOwner,
            label = { Text(if (enabled) "Programa activo" else "Programa apagado") },
        )

        OutlinedTextField(
            value = pointsPerClp,
            onValueChange = { if (isOwner) pointsPerClp = it.filter { ch -> ch.isDigit() } },
            label = { Text("CLP por 1 punto ganado") },
            singleLine = true,
            enabled = isOwner,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            supportingText = { Text("Ej. 1000 = 1 pt cada \$1.000") },
        )
        OutlinedTextField(
            value = clpPerPoint,
            onValueChange = { if (isOwner) clpPerPoint = it.filter { ch -> ch.isDigit() } },
            label = { Text("CLP de descuento por punto") },
            singleLine = true,
            enabled = isOwner,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            supportingText = { Text("Ej. 100 = 1 pt vale \$100") },
        )

        if (isOwner) {
            Button(
                onClick = {
                    onSave(
                        pointsPerClp.toIntOrNull() ?: 0,
                        clpPerPoint.toIntOrNull() ?: 0,
                        enabled,
                    )
                },
                enabled = !state.descuentosBusy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (state.descuentosBusy) "Guardando…" else "Guardar configuración")
            }
        } else {
            Text(
                "Solo dueño puede editar puntos",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
            )
        }

        loyalty?.recentTransactions?.takeIf { it.isNotEmpty() }?.let { txs ->
            Spacer(Modifier.height(8.dp))
            Text("Movimientos recientes", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
            txs.forEach { t ->
                Card(
                    Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(t.reason ?: "Movimiento", fontWeight = FontWeight.Medium)
                            Text(
                                t.createdAt?.take(16)?.replace('T', ' ') ?: "",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.Gray,
                            )
                        }
                        Text(
                            if (t.points >= 0) "+${t.points}" else "${t.points}",
                            fontWeight = FontWeight.Bold,
                            color = if (t.points >= 0) {
                                Color(0xFF059669)
                            } else {
                                MaterialTheme.colorScheme.error
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun KpiMini(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = MaterialTheme.typography.labelSmall, color = Color(0xFF64748B))
            Text(
                value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}
