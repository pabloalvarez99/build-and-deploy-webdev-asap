package cl.tufarmacia.app.ui.erp

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
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
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import cl.tufarmacia.app.data.model.AuthUser
import cl.tufarmacia.app.util.formatClp

data class ErpModule(
    val route: String,
    val title: String,
    val subtitle: String,
    val ownerOnly: Boolean = false,
)

val ERP_MODULES = listOf(
    ErpModule("erp_dashboard", "Dashboard", "KPIs del día · operaciones"),
    ErpModule("erp_orders", "Órdenes", "Online · reservas · staff actions"),
    ErpModule("erp_pos", "POS", "Venta · barcode · retiro · descuento"),
    ErpModule("erp_inventory", "Inventario", "Stock · ajustes · barcode"),
    ErpModule("erp_batches", "Lotes / Vencimientos", "soon30 · vencidos"),
    ErpModule("erp_reorder", "Reposición", "Sugerencias por proveedor"),
    ErpModule("erp_arqueo", "Arqueo", "Turno actual · efectivo esperado"),
    ErpModule("erp_faltas", "Faltas", "Pedidos sin stock · notificar"),
    ErpModule("erp_clients", "Clientes", "Registrados y guests"),
    ErpModule("erp_purchases", "Compras", "OC · recepción stock", ownerOnly = true),
    ErpModule("erp_suppliers", "Proveedores", "Catálogo proveedores", ownerOnly = true),
    ErpModule("erp_finance", "Finanzas", "AP · gastos · ingresos", ownerOnly = true),
    ErpModule("erp_tasks", "Tareas", "Tareas internas abiertas"),
    ErpModule("erp_shifts", "Turnos / Caja", "Cierres de turno"),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpHubScreen(
    user: AuthUser?,
    onOpen: (String) -> Unit,
    onBackToStore: () -> Unit,
) {
    val isOwner = user?.role in setOf("owner", "admin")
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("ERP Farmacia") },
            actions = {
                Text(
                    "Tienda",
                    modifier = Modifier
                        .clickable(onClick = onBackToStore)
                        .padding(16.dp),
                    color = MaterialTheme.colorScheme.primary,
                )
            },
        )
        Text(
            "${user?.email ?: ""} · ${user?.role ?: ""}",
            modifier = Modifier.padding(horizontal = 16.dp),
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray,
        )
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(ERP_MODULES.filter { isOwner || !it.ownerOnly }) { mod ->
                Card(
                    Modifier
                        .fillMaxWidth()
                        .clickable { onOpen(mod.route) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text(mod.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(mod.subtitle, style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                        if (mod.ownerOnly) {
                            Text("Solo dueño", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpDashboardScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Dashboard") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        if (state.loading && state.operaciones == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            val k = state.operaciones?.kpis
            if (k != null) {
                KpiCard("Ventas hoy", formatClp(k.ventasHoy), "${k.ordenesHoy} órdenes")
                KpiCard("Ventas ayer", formatClp(k.ventasAyer), "${k.ordenesAyer} órdenes")
                KpiCard("Webpay pendientes", "${k.pedidosPendientesWebpay}", "por confirmar")
            }
            state.operaciones?.pl?.let { pl ->
                KpiCard("Margen bruto hoy", formatClp(pl.margenBrutoHoy), "${pl.margenPctHoy}% · costo ${formatClp(pl.costoHoy)}")
            }
            state.operaciones?.let { op ->
                KpiCard("Stock crítico", "${op.stockCriticoCount}", "sin stock: ${op.stockCeroCount}")
                KpiCard("Faltas pendientes", "${op.faltasPendingTotal}", "")
            }
            state.dashboardExtras?.let { ex ->
                ex.ocsToPay?.let { KpiCard("OCs por pagar", formatClp(it.total), "${it.count} facturas") }
                ex.ocsOverdue?.let { KpiCard("OCs vencidas", formatClp(it.total), "${it.count}") }
                ex.expiring?.let { KpiCard("Lotes por vencer", "${it.count}", "${it.products} productos") }
            }
            state.operaciones?.reservasUrgentes?.takeIf { it.isNotEmpty() }?.let { list ->
                Text("Reservas urgentes (<6h)", fontWeight = FontWeight.Bold)
                list.forEach { r ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp)) {
                            Text(r.nombre ?: "Cliente", fontWeight = FontWeight.Medium)
                            Text("Código ${r.pickupCode} · ${formatClp(r.total)}")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun KpiCard(title: String, value: String, subtitle: String) {
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium)
            Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            if (subtitle.isNotBlank()) Text(subtitle, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpInventoryScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onFilter: (String?) -> Unit,
    onSearchChange: (String) -> Unit,
    onSearch: () -> Unit,
    onReason: (String) -> Unit,
    onBarcodeChange: (String) -> Unit,
    onCustomDeltaChange: (String) -> Unit,
    onAdjustBarcode: () -> Unit,
    onAdjust: (productId: String, delta: Int) -> Unit,
    onCreateFalta: (productId: String?, productName: String) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Inventario") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        OutlinedTextField(
            value = state.inventorySearch,
            onValueChange = onSearchChange,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Buscar producto…") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSearch() }),
        )
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            listOf(null to "Todos", "low" to "Bajo", "out" to "Agotado", "slow" to "Lentos").forEach { (v, l) ->
                FilterChip(selected = state.inventoryFilter == v, onClick = { onFilter(v) }, label = { Text(l) })
            }
        }
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            listOf(
                "adjustment" to "Ajuste",
                "merma" to "Merma",
                "damage" to "Daño",
                "count_correction" to "Conteo",
                "transfer" to "Traslado",
            ).forEach { (v, l) ->
                FilterChip(selected = state.inventoryReason == v, onClick = { onReason(v) }, label = { Text(l) })
            }
        }
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = state.inventoryBarcode,
                onValueChange = onBarcodeChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Barcode") },
                singleLine = true,
            )
            OutlinedTextField(
                value = state.inventoryCustomDelta,
                onValueChange = onCustomDeltaChange,
                modifier = Modifier.width(88.dp),
                placeholder = { Text("Δ") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            )
            Button(onClick = onAdjustBarcode) { Text("OK") }
        }
        if (state.loading && state.inventory.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.inventory, key = { it.id }) { item ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(item.name, fontWeight = FontWeight.Medium)
                            Text(
                                "Stock ${item.stock} · ${formatClp(item.price)} · ${item.category ?: ""}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                            if (item.lowStock) Text("STOCK BAJO", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(onClick = { onAdjust(item.id, -1) }) { Text("-1") }
                                OutlinedButton(onClick = { onAdjust(item.id, 1) }) { Text("+1") }
                                OutlinedButton(onClick = { onAdjust(item.id, 5) }) { Text("+5") }
                                if (item.stock <= 0) {
                                    OutlinedButton(onClick = { onCreateFalta(item.id, item.name) }) {
                                        Text("Falta")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpPosScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onSearchChange: (String) -> Unit,
    onSearch: () -> Unit,
    onBarcodeChange: (String) -> Unit,
    onScanBarcode: () -> Unit,
    onAdd: (cl.tufarmacia.app.data.model.Product) -> Unit,
    onQty: (String, Int) -> Unit,
    onPayment: (String) -> Unit,
    onCustomer: (String, String) -> Unit,
    onDiscountChange: (String) -> Unit,
    onMixedAmounts: (String, String) -> Unit,
    onLookupCustomer: () -> Unit,
    onPickupCodeChange: (String) -> Unit,
    onLookupPickup: () -> Unit,
    onClearPickup: () -> Unit,
    onApprovePickup: (String) -> Unit,
    onMarkPaidPickup: (String) -> Unit,
    onSubmit: () -> Unit,
    onClear: () -> Unit,
) {
    var name by remember(state.posCustomer) { mutableStateOf(state.posCustomer) }
    var phone by remember(state.posPhone) { mutableStateOf(state.posPhone) }
    val subtotal = state.posCart.sumOf { it.lineTotal }
    val discount = state.posDiscount.toDoubleOrNull() ?: 0.0
    val total = (subtotal - discount).coerceAtLeast(0.0)

    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("POS") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                if (state.posCart.isNotEmpty()) {
                    Text("Vaciar", Modifier.clickable(onClick = onClear).padding(16.dp), color = MaterialTheme.colorScheme.error)
                }
            },
        )
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item {
                Text("Código de barras", fontWeight = FontWeight.SemiBold)
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedTextField(
                        value = state.posBarcode,
                        onValueChange = onBarcodeChange,
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Escanear o digitar…") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done,
                        ),
                        keyboardActions = KeyboardActions(onDone = { onScanBarcode() }),
                    )
                    Button(onClick = onScanBarcode, enabled = !state.posBusy) { Text("OK") }
                }
            }
            item {
                OutlinedTextField(
                    value = state.posSearch,
                    onValueChange = onSearchChange,
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Buscar por nombre…") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    keyboardActions = KeyboardActions(onSearch = { onSearch() }),
                )
            }
            item {
                Text("Retiro online (6 dígitos)", fontWeight = FontWeight.SemiBold)
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedTextField(
                        value = state.posPickupCode,
                        onValueChange = onPickupCodeChange,
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("123456") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.NumberPassword,
                            imeAction = ImeAction.Search,
                        ),
                        keyboardActions = KeyboardActions(onSearch = { onLookupPickup() }),
                    )
                    Button(onClick = onLookupPickup, enabled = !state.posPickupLoading) {
                        if (state.posPickupLoading) {
                            CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp, color = Color.White)
                        } else {
                            Text("Buscar")
                        }
                    }
                }
            }
            state.posPickup?.let { pickup ->
                item {
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    ) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                listOfNotNull(pickup.guestName, pickup.guestSurname).joinToString(" ")
                                    .ifBlank { "Cliente" },
                                fontWeight = FontWeight.Bold,
                            )
                            Text("Estado: ${pickup.status} · ${formatClp(pickup.total)}")
                            pickup.customerPhone?.let { Text("Tel: $it") }
                            pickup.items.forEach { line ->
                                Text("· ${line.productName} x${line.quantity}", style = MaterialTheme.typography.bodySmall)
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                if (pickup.status.equals("reserved", ignoreCase = true)) {
                                    Button(onClick = { onApprovePickup(pickup.id) }) { Text("Aprobar") }
                                    Button(onClick = { onMarkPaidPickup(pickup.id) }) { Text("Marcar pagada") }
                                }
                                OutlinedButton(onClick = onClearPickup) { Text("Cerrar") }
                            }
                        }
                    }
                }
            }
            items(state.posResults, key = { it.id }) { p ->
                Card(Modifier.fillMaxWidth().clickable { onAdd(p) }) {
                    Row(Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) {
                            Text(p.name, maxLines = 2, fontWeight = FontWeight.Medium)
                            Text("Stock ${p.stock} · ${formatClp(p.unitPrice())}", style = MaterialTheme.typography.bodySmall)
                        }
                        Icon(Icons.Default.Add, contentDescription = "Agregar")
                    }
                }
            }
            if (state.posCart.isNotEmpty()) {
                item { Text("Ticket", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium) }
                items(state.posCart, key = { "c-${it.productId}" }) { line ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(line.name, maxLines = 2)
                                Text(formatClp(line.lineTotal), fontWeight = FontWeight.SemiBold)
                            }
                            IconButton(onClick = { onQty(line.productId, line.quantity - 1) }) {
                                Icon(Icons.Default.Remove, null)
                            }
                            Text("${line.quantity}", fontWeight = FontWeight.Bold)
                            IconButton(onClick = { onQty(line.productId, line.quantity + 1) }) {
                                Icon(Icons.Default.Add, null)
                            }
                        }
                    }
                }
            }
            state.posCustomerHistory?.takeIf { it.found }?.let { hist ->
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("Historial", fontWeight = FontWeight.Bold)
                            Text("${hist.name ?: "—"} · ${hist.visitCount} visitas · ${hist.loyaltyPoints ?: 0} pts")
                            if (hist.topProducts.isNotEmpty()) {
                                Text(
                                    "Top: ${hist.topProducts.take(3).joinToString()}",
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                        }
                    }
                }
            }
        }
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    "pos_cash" to "Efectivo",
                    "pos_debit" to "Débito",
                    "pos_credit" to "Crédito",
                    "pos_mixed" to "Mixta",
                ).forEach { (v, l) ->
                    FilterChip(selected = state.posPayment == v, onClick = { onPayment(v) }, label = { Text(l) })
                }
            }
            if (state.posPayment == "pos_mixed") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = state.posCashAmount,
                        onValueChange = { onMixedAmounts(it, state.posCardAmount) },
                        label = { Text("Efectivo") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    )
                    OutlinedTextField(
                        value = state.posCardAmount,
                        onValueChange = { onMixedAmounts(state.posCashAmount, it) },
                        label = { Text("Tarjeta") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    )
                }
            }
            OutlinedTextField(
                value = state.posDiscount,
                onValueChange = onDiscountChange,
                label = { Text("Descuento \$") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            )
            OutlinedTextField(
                value = name,
                onValueChange = { name = it; onCustomer(it, phone) },
                label = { Text("Cliente (opc.)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it; onCustomer(name, it) },
                    label = { Text("Teléfono") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                )
                OutlinedButton(onClick = onLookupCustomer) { Text("Historial") }
            }
            if (discount > 0) {
                Text("Subtotal ${formatClp(subtotal)} − desc. ${formatClp(discount)}", style = MaterialTheme.typography.bodySmall)
            }
            Text("Total: ${formatClp(total)}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Button(
                onClick = onSubmit,
                enabled = !state.posBusy && state.posCart.isNotEmpty(),
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                if (state.posBusy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Cobrar")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpClientsScreen(state: ErpUiState, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Clientes") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        if (state.loading && state.clients.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.clients, key = { it.id ?: it.email ?: it.hashCode().toString() }) { c ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp)) {
                            Text(
                                listOfNotNull(c.name, c.surname).joinToString(" ").ifBlank { c.email ?: "Cliente" },
                                fontWeight = FontWeight.Medium,
                            )
                            Text(c.email ?: "—", style = MaterialTheme.typography.bodySmall)
                            Text(
                                "${c.type} · ${c.orderCount} pedidos · ${formatClp(c.totalSpend)}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpPurchasesScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onOpen: (String) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Compras") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.purchaseOrders, key = { it.id }) { po ->
                Card(Modifier.fillMaxWidth().clickable { onOpen(po.id) }) {
                    Column(Modifier.padding(12.dp)) {
                        Text(po.suppliers?.name ?: "Proveedor", fontWeight = FontWeight.Bold)
                        Text("Factura ${po.invoiceNumber ?: "—"} · ${po.status}")
                        Text(
                            "${formatClp(po.totalCost ?: "0")} · ${if (po.paid) "Pagada" else "Por pagar"}",
                            color = if (po.paid) Color.Gray else MaterialTheme.colorScheme.error,
                        )
                        po.dueDate?.let { Text("Vence $it", style = MaterialTheme.typography.labelSmall) }
                        Text("Toca para detalle / recibir", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
            if (state.purchaseOrders.isEmpty()) item { Text("Sin OC o sin permiso owner") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpPurchaseDetailScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onReceive: (String) -> Unit,
) {
    val po = state.purchaseOrderDetail
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("OC detalle") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        if (state.loading && po == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        if (po == null) {
            Text("Sin datos", Modifier.padding(24.dp))
            return
        }
        val mapped = po.items.count { it.productId != null || it.products?.id != null }
        val unmapped = po.items.size - mapped
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(po.suppliers?.name ?: "Proveedor", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
            Text("Factura ${po.invoiceNumber ?: "—"} · ${po.status}")
            Text("Total ${formatClp(po.totalCost ?: "0")}")
            Text("Mapeados $mapped · sin mapear $unmapped", style = MaterialTheme.typography.bodySmall)
            if (unmapped > 0) {
                Text(
                    "Solo se reciben líneas con producto mapeado.",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            po.items.forEach { item ->
                val name = item.products?.name ?: item.productName ?: item.description ?: "Ítem"
                val mappedOk = item.productId != null || item.products?.id != null
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(name, fontWeight = FontWeight.Medium)
                        Text(
                            "x${item.quantity} · ${formatClp(item.unitCost ?: "0")} · ${if (mappedOk) "OK" else "SIN MAPEAR"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (mappedOk) Color.Gray else MaterialTheme.colorScheme.error,
                        )
                    }
                }
            }
            if (po.status.equals("draft", ignoreCase = true) && mapped > 0) {
                Button(
                    onClick = { onReceive(po.id) },
                    enabled = !state.purchaseOrderBusy,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                ) {
                    if (state.purchaseOrderBusy) {
                        CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                    } else {
                        Text("Confirmar recepción")
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpBatchesScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onFilter: (String?) -> Unit,
    onRefresh: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Lotes / Vencimientos") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        Text(
            "Vencidos ${state.batchesExpired} · ≤30d ${state.batchesSoon30}",
            Modifier.padding(horizontal = 16.dp),
            style = MaterialTheme.typography.bodySmall,
        )
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            listOf("expired" to "Vencidos", "soon30" to "≤30 días", "soon90" to "≤90 días", null to "Todos").forEach { (v, l) ->
                FilterChip(selected = state.batchesFilter == v, onClick = { onFilter(v) }, label = { Text(l) })
            }
        }
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.batches, key = { it.id }) { b ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(b.products?.name ?: "Producto", fontWeight = FontWeight.Medium)
                        Text(
                            "Lote ${b.batchCode ?: "—"} · cant ${b.quantity} · vence ${b.expiryDate?.take(10) ?: "—"}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
            if (state.batches.isEmpty()) item { Text("Sin lotes en este filtro") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpReorderScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Reposición") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        Text(
            "Umbral stock ≤ ${state.reorderThreshold}",
            Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            style = MaterialTheme.typography.bodySmall,
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            state.reorderGroups.forEach { group ->
                item {
                    Text(
                        group.supplier?.name ?: "Proveedor",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                    )
                    group.supplier?.contactPhone?.let {
                        Text("Tel $it", style = MaterialTheme.typography.bodySmall)
                    }
                }
                items(group.items, key = { it.productId }) { item ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp)) {
                            Text(item.name, fontWeight = FontWeight.Medium)
                            Text(
                                "Stock ${item.stock} · ${formatClp(item.price)} · cod ${item.supplierCode ?: "—"}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }
            if (state.reorderGroups.isEmpty()) {
                item { Text("Sin sugerencias de reposición") }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpSuppliersScreen(state: ErpUiState, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Proveedores") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.suppliers, key = { it.id }) { s ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(s.name, fontWeight = FontWeight.Bold)
                        s.email?.let { Text(it) }
                        s.phone?.let { Text(it) }
                    }
                }
            }
            if (state.suppliers.isEmpty()) item { Text("Sin datos o solo owner") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpFinanceScreen(state: ErpUiState, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Finanzas") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            val f = state.finanzas
            if (f == null) {
                Text("Cargando o sin permiso owner…")
            } else {
                KpiCard("Cuentas por pagar", formatClp(f.pendingApAmount), "${f.pendingApCount} pendientes")
                KpiCard("AP vencidas", "${f.overdueApCount}", "facturas overdue")
                KpiCard("Ingresos mes", formatClp(f.ingresosMes), "órdenes paid/completed")
                KpiCard("Gastos mes", formatClp(f.gastosMes), "")
                KpiCard(
                    "Resultado estimado",
                    formatClp(f.ingresosMes - f.gastosMes),
                    "ingresos − gastos (simplificado)",
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpTasksScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onComplete: (String) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Tareas") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.tasks, key = { it.id }) { t ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(t.title ?: "Tarea", fontWeight = FontWeight.Bold)
                        t.description?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                        Text("Prioridad ${t.priority} · ${t.status}", style = MaterialTheme.typography.labelSmall)
                        if (t.status == "open") {
                            Button(onClick = { onComplete(t.id) }, modifier = Modifier.fillMaxWidth()) {
                                Text("Completar")
                            }
                        }
                    }
                }
            }
            if (state.tasks.isEmpty()) item { Text("Sin tareas abiertas") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpShiftsScreen(state: ErpUiState, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Turnos / Caja") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.turnos, key = { it.id ?: it.hashCode().toString() }) { t ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(t.cerradoPor ?: "Cierre", fontWeight = FontWeight.Bold)
                        Text("Fin: ${t.turnoFin}")
                        Text(
                            "Ventas ${formatClp(t.ventasTotal)} · ${t.numTransacciones} tx · diff ${formatClp(t.diferencia)}",
                        )
                    }
                }
            }
            if (state.turnos.isEmpty()) item { Text("Sin cierres") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpFaltasScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onNotify: (String) -> Unit,
    onRefresh: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Faltas (${state.faltasPending})") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        if (state.loading && state.faltas.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.faltas, key = { it.id }) { f ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(f.productName ?: "Producto", fontWeight = FontWeight.Bold)
                        Text("x${f.quantity} · ${f.status}", style = MaterialTheme.typography.bodySmall)
                        f.customerName?.let { Text("Cliente: $it") }
                        f.customerPhone?.let { Text("Tel: $it") }
                        f.notes?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Color.Gray) }
                        if (f.status == "pending") {
                            Button(onClick = { onNotify(f.id) }, modifier = Modifier.fillMaxWidth()) {
                                Text("Marcar notificada")
                            }
                        }
                    }
                }
            }
            if (state.faltas.isEmpty()) item { Text("Sin faltas pendientes") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpArqueoScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Arqueo de caja") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        if (state.loading && state.arqueo == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        val a = state.arqueo
        if (a == null) {
            Text("Sin datos", Modifier.padding(16.dp))
            return
        }
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            a.pharmacistName?.let { Text("Farmacéutico: $it", fontWeight = FontWeight.Medium) }
            Text("Turno desde: ${a.turnoInicio ?: "—"}", style = MaterialTheme.typography.bodySmall)
            KpiCard("Fondo inicial", formatClp(a.fondoInicial), "")
            KpiCard("Ventas total turno", formatClp(a.ventas.total), "${a.ventas.numTransacciones} transacciones")
            KpiCard("Efectivo", formatClp(a.ventas.efectivo), "Débito ${formatClp(a.ventas.debito)} · Crédito ${formatClp(a.ventas.credito)}")
            KpiCard("Efectivo esperado", formatClp(a.efectivoEsperado), "fondo + ventas efectivo")
            Text("Últimas ventas POS", fontWeight = FontWeight.Bold)
            a.recentOrders.forEach { o ->
                Card(Modifier.fillMaxWidth()) {
                    Row(
                        Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(o.customer ?: "Cliente", fontWeight = FontWeight.Medium)
                            Text(o.paymentProvider ?: "", style = MaterialTheme.typography.labelSmall)
                        }
                        Text(formatClp(o.total), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
