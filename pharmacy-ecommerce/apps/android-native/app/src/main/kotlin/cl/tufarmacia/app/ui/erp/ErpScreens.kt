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
    ErpModule("erp_pos", "POS", "Venta en mostrador"),
    ErpModule("erp_inventory", "Inventario", "Stock · ajustes"),
    ErpModule("erp_clients", "Clientes", "Registrados y guests"),
    ErpModule("erp_purchases", "Compras", "Órdenes de compra", ownerOnly = true),
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
    onAdjust: (productId: String, delta: Int) -> Unit,
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
    onAdd: (cl.tufarmacia.app.data.model.Product) -> Unit,
    onQty: (String, Int) -> Unit,
    onPayment: (String) -> Unit,
    onCustomer: (String, String) -> Unit,
    onSubmit: () -> Unit,
    onClear: () -> Unit,
) {
    var name by remember { mutableStateOf(state.posCustomer) }
    var phone by remember { mutableStateOf(state.posPhone) }
    val total = state.posCart.sumOf { it.lineTotal }

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
        OutlinedTextField(
            value = state.posSearch,
            onValueChange = onSearchChange,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            placeholder = { Text("Buscar para vender…") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSearch() }),
        )
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
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
        }
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("pos_cash" to "Efectivo", "pos_debit" to "Débito", "pos_credit" to "Crédito").forEach { (v, l) ->
                    FilterChip(selected = state.posPayment == v, onClick = { onPayment(v) }, label = { Text(l) })
                }
            }
            OutlinedTextField(
                value = name,
                onValueChange = { name = it; onCustomer(it, phone) },
                label = { Text("Cliente (opc.)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it; onCustomer(name, it) },
                label = { Text("Teléfono") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            )
            Text("Total: ${formatClp(total)}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Button(
                onClick = onSubmit,
                enabled = !state.posBusy && state.posCart.isNotEmpty(),
                modifier = Modifier.fillMaxWidth(),
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
fun ErpPurchasesScreen(state: ErpUiState, onBack: () -> Unit) {
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
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(po.suppliers?.name ?: "Proveedor", fontWeight = FontWeight.Bold)
                        Text("Factura ${po.invoiceNumber ?: "—"} · ${po.status}")
                        Text(
                            "${formatClp(po.totalCost ?: "0")} · ${if (po.paid) "Pagada" else "Por pagar"}",
                            color = if (po.paid) Color.Gray else MaterialTheme.colorScheme.error,
                        )
                        po.dueDate?.let { Text("Vence $it", style = MaterialTheme.typography.labelSmall) }
                    }
                }
            }
            if (state.purchaseOrders.isEmpty()) item { Text("Sin OC o sin permiso owner") }
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
