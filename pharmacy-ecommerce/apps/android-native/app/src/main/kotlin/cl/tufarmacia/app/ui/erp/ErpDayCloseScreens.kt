package cl.tufarmacia.app.ui.erp

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cl.tufarmacia.app.util.formatClp
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpCierreDiaScreen(
    state: ErpUiState,
    isOwner: Boolean,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onPrevDay: () -> Unit,
    onNextDay: () -> Unit,
    onToday: () -> Unit,
    onEmail: () -> Unit,
) {
    val c = state.cierreDia
    val v = c?.ventas
    val f = c?.finanzas
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Cierre de día", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        // Top actions row (refresh is a button for reliability)
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedButton(onClick = onPrevDay, modifier = Modifier.weight(1f)) { Text("← Ayer") }
            OutlinedButton(onClick = onToday, modifier = Modifier.weight(1f)) { Text("Hoy") }
            OutlinedButton(onClick = onNextDay, modifier = Modifier.weight(1f)) { Text("→") }
            OutlinedButton(onClick = onRefresh) { Text("↻") }
        }
        if (state.loading && c == null) {
            Column(
                Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                CircularProgressIndicator()
            }
            return
        }
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                Text(
                    c?.dateLabel ?: state.cierreDiaDate ?: "Hoy",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "Resumen operativo del día",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B),
                )
            }
            if (v != null) {
                item {
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("Ventas", fontWeight = FontWeight.Bold)
                            Text(formatClp(v.total), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Text("${v.count} tickets · ticket medio ${formatClp(v.avgTicket)}")
                            v.deltaPct?.let { d ->
                                val sign = if (d >= 0) "+" else ""
                                Text(
                                    "vs ayer $sign${"%.1f".format(d)}% (${formatClp(v.prevTotal)})",
                                    style = MaterialTheme.typography.labelMedium,
                                )
                            }
                        }
                    }
                }
                item {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Card(Modifier.weight(1f)) {
                            Column(Modifier.padding(12.dp)) {
                                Text("POS", fontWeight = FontWeight.SemiBold)
                                Text(formatClp(v.pos.revenue), fontWeight = FontWeight.Bold)
                                Text("${v.pos.count} ventas", style = MaterialTheme.typography.labelSmall)
                                Spacer(Modifier.height(4.dp))
                                Text("Efectivo ${formatClp(v.pos.efectivo)}", style = MaterialTheme.typography.labelSmall)
                                Text("Débito ${formatClp(v.pos.debito)}", style = MaterialTheme.typography.labelSmall)
                                Text("Crédito ${formatClp(v.pos.credito)}", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                        Card(Modifier.weight(1f)) {
                            Column(Modifier.padding(12.dp)) {
                                Text("Online", fontWeight = FontWeight.SemiBold)
                                Text(formatClp(v.online.revenue), fontWeight = FontWeight.Bold)
                                Text("${v.online.count} pedidos", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
            }
            if (f != null) {
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("Finanzas", fontWeight = FontWeight.Bold)
                            Text("COGS ${formatClp(f.cogs)}")
                            f.margenBruto?.let { Text("Margen bruto ${formatClp(it)}") }
                            f.margenPct?.let { Text("Margen ${"%.1f".format(it)}%") }
                            Text("Gastos ${formatClp(f.gastos)} (${f.gastosCount})")
                        }
                    }
                }
            }
            c?.caja?.let { caja ->
                item {
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = if (caja.diferencia == 0.0) {
                                MaterialTheme.colorScheme.secondaryContainer
                            } else {
                                MaterialTheme.colorScheme.errorContainer
                            },
                        ),
                    ) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("Caja cerrada", fontWeight = FontWeight.Bold)
                            Text("Fondo ${formatClp(caja.fondoInicial)} · ventas ${formatClp(caja.ventasTotal)}")
                            Text("Esperado ${formatClp(caja.efectivoEsperado)} · contado ${formatClp(caja.efectivoContado)}")
                            Text(
                                "Diferencia ${formatClp(caja.diferencia)}",
                                fontWeight = FontWeight.Bold,
                            )
                            caja.cerradoPor?.let { Text("Por $it", style = MaterialTheme.typography.labelSmall) }
                            caja.notas?.takeIf { it.isNotBlank() }?.let {
                                Text(it, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            } ?: item {
                Card(Modifier.fillMaxWidth()) {
                    Text(
                        "Sin cierre de caja registrado este día",
                        Modifier.padding(14.dp),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF64748B),
                    )
                }
            }
            c?.farmacia?.let { far ->
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("Farmacia", fontWeight = FontWeight.Bold)
                            Text("Recetas ${far.recetasTotal} · controladas ${far.recetasControladas}")
                            far.turno?.let { t ->
                                Text(
                                    "Turno: ${t.pharmacistName ?: "—"}",
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                        }
                    }
                }
            }
            c?.tareas?.let { t ->
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Text("Tareas", fontWeight = FontWeight.Bold)
                            Text("Completadas hoy ${t.completadasHoy} · abiertas ${t.abiertas} · atrasadas ${t.atrasadas}")
                            if (c.avisosActivos > 0) {
                                Text("Avisos críticos activos: ${c.avisosActivos}")
                            }
                        }
                    }
                }
            }
            if (!c?.porVendedor.isNullOrEmpty()) {
                item { Text("Por vendedor", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall) }
                items(c!!.porVendedor, key = { it.uid ?: it.name.orEmpty() }) { s ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column {
                                Text(s.name ?: "Sin nombre", fontWeight = FontWeight.Medium)
                                Text("${s.count} ventas", style = MaterialTheme.typography.labelSmall)
                            }
                            Text(formatClp(s.revenue), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            if (!c?.topProductos.isNullOrEmpty()) {
                item { Text("Top productos", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall) }
                items(c!!.topProductos, key = { it.name.orEmpty() + it.units }) { p ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(p.name ?: "—", fontWeight = FontWeight.Medium, maxLines = 2)
                                Text("${p.units} u.", style = MaterialTheme.typography.labelSmall)
                            }
                            Text(formatClp(p.revenue), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            c?.manana?.let { m ->
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("Mañana / alertas", fontWeight = FontWeight.Bold)
                            Text(
                                "Stock 0: ${m.alertas.stockCero} · Lotes 7d: ${m.alertas.lotes7d} · Faltas c/stock: ${m.alertas.faltasConStock}",
                            )
                            if (m.retiros.isNotEmpty()) {
                                Text("Retiros programados: ${m.retiros.size}", fontWeight = FontWeight.SemiBold)
                                m.retiros.take(8).forEach { r ->
                                    Text(
                                        "#${r.pickupCode ?: "—"} ${r.customer ?: ""} · ${formatClp(r.total)}",
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                }
                            }
                        }
                    }
                }
            }
            if (isOwner) {
                item {
                    Button(
                        onClick = onEmail,
                        enabled = !state.cierreDiaBusy,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (state.cierreDiaBusy) "Enviando…" else "Enviar resumen por email")
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpStockMovementsScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onReason: (String?) -> Unit,
) {
    val reasons = listOf(
        null to "Todos",
        "adjustment" to "Ajuste",
        "sale" to "Venta",
        "return" to "Dev.",
        "receive" to "Recepción",
        "damage" to "Daño",
        "expiry" to "Vencido",
        "theft" to "Pérdida",
        "correction" to "Corrección",
    )
    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Mov. stock", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                OutlinedButton(onClick = onRefresh, modifier = Modifier.padding(end = 8.dp)) {
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
            reasons.forEach { (key, label) ->
                FilterChip(
                    selected = state.stockMovementsReason == key,
                    onClick = { onReason(key) },
                    label = { Text(label) },
                )
            }
        }
        if (state.stockMovementsLoading && state.stockMovements.isEmpty()) {
            Column(
                Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) { CircularProgressIndicator() }
            return
        }
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item {
                Text(
                    "${state.stockMovementsTotal} movimientos",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(0xFF64748B),
                )
            }
            if (state.stockMovements.isEmpty()) {
                item {
                    Text("Sin movimientos", color = Color(0xFF64748B))
                }
            }
            items(state.stockMovements, key = { it.id }) { m ->
                val positive = m.delta >= 0
                Card(Modifier.fillMaxWidth()) {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                m.products?.name ?: m.productId ?: "Producto",
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 2,
                            )
                            Text(
                                listOfNotNull(
                                    m.reason,
                                    m.createdAt?.take(16)?.replace('T', ' '),
                                    m.createdByName ?: m.createdBy,
                                ).joinToString(" · "),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF64748B),
                            )
                            m.notes?.takeIf { it.isNotBlank() }?.let {
                                Text(it, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        Text(
                            if (positive) "+${m.delta}" else "${m.delta}",
                            fontWeight = FontWeight.Bold,
                            color = if (positive) Color(0xFF15803D) else Color(0xFFB91C1C),
                            style = MaterialTheme.typography.titleMedium,
                        )
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

/** Shift date ISO yyyy-MM-dd by [delta] days. */
fun shiftIsoDate(iso: String?, delta: Int): String {
    val base = try {
        if (iso.isNullOrBlank()) LocalDate.now() else LocalDate.parse(iso.take(10))
    } catch (_: Exception) {
        LocalDate.now()
    }
    return base.plusDays(delta.toLong()).format(DateTimeFormatter.ISO_LOCAL_DATE)
}

fun todayIsoDate(): String = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
