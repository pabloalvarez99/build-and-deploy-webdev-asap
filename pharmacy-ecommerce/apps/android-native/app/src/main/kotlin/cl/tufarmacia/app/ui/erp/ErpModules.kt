package cl.tufarmacia.app.ui.erp

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
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
import androidx.compose.runtime.LaunchedEffect
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
import cl.tufarmacia.app.data.model.AvisoDto
import cl.tufarmacia.app.data.model.ClienteDto
import cl.tufarmacia.app.util.formatClp

data class ErpModule(
    val route: String,
    val title: String,
    val subtitle: String,
    val ownerOnly: Boolean = false,
)

val ERP_MODULES = listOf(
    ErpModule("erp_dashboard", "Dashboard", "KPIs del día · operaciones"),
    ErpModule("erp_cierre", "Cierre de día", "Ventas · caja · top · email"),
    ErpModule("erp_orders", "Órdenes", "Online · reservas · staff actions"),
    ErpModule("erp_pos", "POS", "Venta · barcode · retiro · descuento"),
    ErpModule("erp_prescriptions", "Libro de recetas", "Listar · controladas · registro manual"),
    ErpModule("erp_farmacia", "Panel farmacia", "Recetas · sin registro · liquidación"),
    ErpModule("erp_descuentos", "Descuentos", "Activos · bulk apply/quitar · puntos"),
    ErpModule("erp_reportes", "Reportes", "Ventas · flujo caja · PyL", ownerOnly = true),
    ErpModule("erp_inventory", "Inventario", "Stock · ajustes · editar"),
    ErpModule("erp_movements", "Mov. stock", "Historial de ajustes"),
    ErpModule("erp_batches", "Lotes / Vencimientos", "soon30 · vencidos"),
    ErpModule("erp_reorder", "Reposición", "Sugerencias · OC · email"),
    ErpModule("erp_devoluciones", "Devoluciones", "Registrar · listar"),
    ErpModule("erp_barcodes", "Barcodes desconocidos", "Triage de scans"),
    ErpModule("erp_arqueo", "Arqueo", "Fondo · cerrar turno · farmacéutico"),
    ErpModule("erp_faltas", "Faltas", "Pedidos sin stock · notificar"),
    ErpModule("erp_clients", "Clientes", "Detalle · KPIs · historial"),
    ErpModule("erp_purchases", "Compras", "OC · recepción stock", ownerOnly = true),
    ErpModule("erp_suppliers", "Proveedores", "Catálogo proveedores", ownerOnly = true),
    ErpModule("erp_finance", "Finanzas", "AP · pagar · gastos", ownerOnly = true),
    ErpModule("erp_tasks", "Tareas", "Crear · completar"),
    ErpModule("erp_shifts", "Turnos / Caja", "Cierres de turno"),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpHubScreen(
    user: AuthUser?,
    avisos: List<AvisoDto> = emptyList(),
    onOpen: (String) -> Unit,
    onBackToStore: () -> Unit,
    onCreateAviso: ((title: String, body: String, severity: String, pinned: Boolean) -> Unit)? = null,
) {
    val isOwner = user?.role in setOf("owner", "admin")
    val modules = ERP_MODULES.filter { isOwner || !it.ownerOnly }
    var showCreateAviso by remember { mutableStateOf(false) }
    var avisoTitle by remember { mutableStateOf("") }
    var avisoBody by remember { mutableStateOf("") }
    var avisoSeverity by remember { mutableStateOf("info") }
    var avisoPinned by remember { mutableStateOf(false) }

    if (showCreateAviso && onCreateAviso != null) {
        AlertDialog(
            onDismissRequest = { showCreateAviso = false },
            title = { Text("Nuevo aviso") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = avisoTitle,
                        onValueChange = { avisoTitle = it },
                        label = { Text("Título") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = avisoBody,
                        onValueChange = { avisoBody = it },
                        label = { Text("Mensaje") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("info", "warning", "critical").forEach { sev ->
                            FilterChip(
                                selected = avisoSeverity == sev,
                                onClick = { avisoSeverity = sev },
                                label = { Text(sev) },
                            )
                        }
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { avisoPinned = !avisoPinned },
                    ) {
                        FilterChip(
                            selected = avisoPinned,
                            onClick = { avisoPinned = !avisoPinned },
                            label = { Text(if (avisoPinned) "Fijado 📌" else "Fijar") },
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (avisoTitle.isNotBlank() && avisoBody.isNotBlank()) {
                            onCreateAviso(avisoTitle, avisoBody, avisoSeverity, avisoPinned)
                            showCreateAviso = false
                            avisoTitle = ""
                            avisoBody = ""
                            avisoSeverity = "info"
                            avisoPinned = false
                        }
                    },
                ) { Text("Publicar") }
            },
            dismissButton = {
                TextButton(onClick = { showCreateAviso = false }) { Text("Cancelar") }
            },
        )
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("ERP Farmacia", fontWeight = FontWeight.SemiBold) },
            actions = {
                if (isOwner && onCreateAviso != null) {
                    TextButton(onClick = { showCreateAviso = true }) {
                        Text("Aviso+")
                    }
                }
                TextButton(onClick = onBackToStore) {
                    Text("Tienda")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        Text(
            "${user?.email ?: ""} · ${user?.role ?: ""}",
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            style = MaterialTheme.typography.bodySmall,
            color = Color(0xFF64748B),
        )
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (avisos.isNotEmpty() || (isOwner && onCreateAviso != null)) {
                item {
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("Avisos internos", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        if (isOwner && onCreateAviso != null && avisos.isEmpty()) {
                            TextButton(onClick = { showCreateAviso = true }) { Text("Crear") }
                        }
                    }
                }
                items(avisos, key = { it.id }) { a ->
                    val bg = when (a.severity) {
                        "critical" -> MaterialTheme.colorScheme.errorContainer
                        "warning" -> MaterialTheme.colorScheme.tertiaryContainer
                        else -> if (a.pinned) {
                            MaterialTheme.colorScheme.tertiaryContainer
                        } else {
                            MaterialTheme.colorScheme.secondaryContainer
                        }
                    }
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = bg),
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(
                                    a.title?.ifBlank { "Aviso" } ?: "Aviso",
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.titleSmall,
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    a.severity?.takeIf { it != "info" }?.let {
                                        Text(it, style = MaterialTheme.typography.labelSmall)
                                    }
                                    if (a.pinned) {
                                        Text("📌", style = MaterialTheme.typography.labelSmall)
                                    }
                                }
                            }
                            a.body?.takeIf { it.isNotBlank() }?.let {
                                Text(it, style = MaterialTheme.typography.bodyMedium)
                            }
                            a.expiresAt?.let {
                                Text("Vence ${it.take(10)}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            }
                        }
                    }
                }
                item { Spacer(Modifier.height(4.dp)) }
            }
            items(modules) { mod ->
                Card(
                    Modifier
                        .fillMaxWidth()
                        .clickable { onOpen(mod.route) },
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp),
                ) {
                    Column(Modifier.padding(horizontal = 16.dp, vertical = 14.dp)) {
                        Text(mod.title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                        Text(mod.subtitle, style = MaterialTheme.typography.bodyMedium, color = Color(0xFF64748B))
                        if (mod.ownerOnly) {
                            Text(
                                "Solo dueño",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Medium,
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
fun ErpDashboardScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onOpenModule: (String) -> Unit = {},
    onOpenPosPickup: (String) -> Unit = {},
) {
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Dashboard", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                TextButton(onClick = onRefresh) { Text("Actualizar") }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
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
                KpiCard(
                    "Webpay pendientes",
                    "${k.pedidosPendientesWebpay}",
                    "por confirmar · tocar",
                    onClick = { onOpenModule("erp_orders") },
                )
            }
            state.operaciones?.pl?.let { pl ->
                KpiCard("Margen bruto hoy", formatClp(pl.margenBrutoHoy), "${pl.margenPctHoy}% · costo ${formatClp(pl.costoHoy)}")
            }
            state.operaciones?.let { op ->
                KpiCard(
                    "Stock crítico",
                    "${op.stockCriticoCount}",
                    "sin stock: ${op.stockCeroCount} · tocar",
                    onClick = { onOpenModule("erp_inventory") },
                )
                KpiCard(
                    "Faltas pendientes",
                    "${op.faltasPendingTotal}",
                    "tocar",
                    onClick = { onOpenModule("erp_faltas") },
                )
            }
            state.dashboardExtras?.let { ex ->
                ex.ocsToPay?.let {
                    KpiCard(
                        "OCs por pagar",
                        formatClp(it.total),
                        "${it.count} facturas · tocar",
                        onClick = { onOpenModule("erp_finance") },
                    )
                }
                ex.ocsOverdue?.let {
                    KpiCard(
                        "OCs vencidas",
                        formatClp(it.total),
                        "${it.count} · tocar",
                        onClick = { onOpenModule("erp_purchases") },
                    )
                }
                ex.expiring?.let {
                    KpiCard(
                        "Lotes por vencer",
                        "${it.count}",
                        "${it.products} productos · tocar",
                        onClick = { onOpenModule("erp_batches") },
                    )
                }
            }
            state.operaciones?.reservasUrgentes?.takeIf { it.isNotEmpty() }?.let { list ->
                Text(
                    "Reservas urgentes (<6h)",
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onOpenModule("erp_pos") },
                )
                list.forEach { r ->
                    Card(
                        Modifier
                            .fillMaxWidth()
                            .clickable {
                                val code = r.pickupCode.orEmpty()
                                if (code.isNotBlank()) onOpenPosPickup(code) else onOpenModule("erp_pos")
                            },
                    ) {
                        Column(Modifier.padding(12.dp)) {
                            Text(r.nombre ?: "Cliente", fontWeight = FontWeight.Medium)
                            Text("Código ${r.pickupCode} · ${formatClp(r.total)}")
                            Text("Abrir POS con código", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun KpiCard(
    title: String,
    value: String,
    subtitle: String,
    onClick: (() -> Unit)? = null,
) {
    Card(
        Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
            Text(
                value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
            if (subtitle.isNotBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = Color(0xFF64748B))
            }
        }
    }
}
