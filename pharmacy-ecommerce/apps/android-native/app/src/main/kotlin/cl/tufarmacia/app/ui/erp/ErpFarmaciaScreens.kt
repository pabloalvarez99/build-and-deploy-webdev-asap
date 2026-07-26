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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cl.tufarmacia.app.data.model.FarmaciaLoteVencer
import cl.tufarmacia.app.data.model.LiquidacionItemDto
import cl.tufarmacia.app.data.model.PrescriptionRecordDto
import cl.tufarmacia.app.util.formatClp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpFarmaciaScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onTab: (String) -> Unit,
    onToggleItem: (productId: String, suggested: Int) -> Unit,
    onSetDiscount: (productId: String, percent: Int) -> Unit,
    onSelectAllSuggested: () -> Unit,
    onClearSelection: () -> Unit,
    onApply: () -> Unit,
) {
    val tab = state.farmaciaTab
    val loading = when (tab) {
        "liquidacion" -> state.liquidacionLoading
        else -> state.farmaciaLoading
    }
    val hasData = when (tab) {
        "liquidacion" -> state.liquidacion != null
        else -> state.farmaciaPanel != null
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Panel farmacia", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                TextButton(
                    onClick = onRefresh,
                    enabled = !loading && !state.liquidacionBusy,
                ) { Text("Actualizar") }
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
                "panel" to "Panel",
                "liquidacion" to "Liquidación",
            ).forEach { (id, label) ->
                FilterChip(
                    selected = tab == id,
                    onClick = { onTab(id) },
                    label = { Text(label) },
                )
            }
        }

        if (loading && !hasData) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
            return
        }

        when (tab) {
            "liquidacion" -> LiquidacionPanel(
                state = state,
                onToggleItem = onToggleItem,
                onSetDiscount = onSetDiscount,
                onSelectAllSuggested = onSelectAllSuggested,
                onClearSelection = onClearSelection,
                onApply = onApply,
            )
            else -> FarmaciaPanelBody(state = state)
        }
    }
}

@Composable
private fun FarmaciaPanelBody(state: ErpUiState) {
    val panel = state.farmaciaPanel
    val kpis = panel?.kpis

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (panel == null) {
            item {
                Text(
                    "Sin datos del panel farmacia",
                    color = MaterialTheme.colorScheme.error,
                )
            }
            return@LazyColumn
        }

        item {
            val turno = panel.turnoActivo
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (turno != null) Color(0xFFECFDF5) else Color(0xFFFEF3C7),
                ),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(12.dp)) {
                    Text(
                        if (turno != null) "Turno farmacéutico activo" else "Sin turno farmacéutico abierto",
                        fontWeight = FontWeight.SemiBold,
                        color = if (turno != null) Color(0xFF065F46) else Color(0xFF92400E),
                    )
                    if (turno != null) {
                        Text(
                            "${turno.pharmacistName ?: "—"} · desde ${shortDate(turno.shiftStart)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF047857),
                        )
                    } else {
                        Text(
                            "Abre turno en Arqueo / Turnos farmacéutico",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFB45309),
                        )
                    }
                }
            }
        }

        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                FarmaciaKpi(
                    title = "Recetas hoy",
                    value = "${kpis?.recetasHoy ?: 0}",
                    modifier = Modifier.weight(1f),
                )
                FarmaciaKpi(
                    title = "Recetas mes",
                    value = "${kpis?.recetasMes ?: 0}",
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                FarmaciaKpi(
                    title = "Controladas hoy",
                    value = "${kpis?.controladasHoy ?: 0}",
                    accent = Color(0xFF7C3AED),
                    modifier = Modifier.weight(1f),
                )
                FarmaciaKpi(
                    title = "Sin registro",
                    value = "${kpis?.sinRegistroReceta ?: 0}",
                    accent = if ((kpis?.sinRegistroReceta ?: 0) > 0) Color(0xFFDC2626) else Color(0xFF059669),
                    subtitle = "POS Rx sin libro",
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            FarmaciaKpi(
                title = "Controlados sin stock",
                value = "${kpis?.controladosSinStock ?: 0}",
                accent = if ((kpis?.controladosSinStock ?: 0) > 0) Color(0xFFD97706) else null,
                subtitle = "Rx required/controlled en 0",
                modifier = Modifier.fillMaxWidth(),
            )
        }

        if ((kpis?.sinRegistroReceta ?: 0) > 0) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2)),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(12.dp)) {
                        Text(
                            "⚠ ${kpis?.sinRegistroReceta} venta(s) POS de receta sin registro en libro",
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF991B1B),
                        )
                        Text(
                            "Registra en Libro de recetas para cumplir normativa.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFB91C1C),
                        )
                    }
                }
            }
        }

        item {
            Text(
                "Lotes por vencer (30d)",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
        }
        if (panel.lotesPorVencer.isEmpty()) {
            item {
                Text(
                    "Sin lotes próximos a vencer",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B),
                )
            }
        } else {
            items(panel.lotesPorVencer, key = { it.id ?: "${it.producto}-${it.batchCode}" }) { lote ->
                LoteVencerCard(lote)
            }
        }

        item {
            Spacer(Modifier.height(4.dp))
            Text(
                "Últimas recetas",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
        }
        if (panel.ultimasRecetas.isEmpty()) {
            item {
                Text(
                    "Sin recetas recientes",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF64748B),
                )
            }
        } else {
            items(panel.ultimasRecetas, key = { it.id }) { rec ->
                UltimaRecetaCard(rec)
            }
        }

        panel.generadoEn?.let { gen ->
            item {
                Text(
                    "Actualizado ${shortDate(gen)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF94A3B8),
                )
            }
        }
    }
}

@Composable
private fun LiquidacionPanel(
    state: ErpUiState,
    onToggleItem: (productId: String, suggested: Int) -> Unit,
    onSetDiscount: (productId: String, percent: Int) -> Unit,
    onSelectAllSuggested: () -> Unit,
    onClearSelection: () -> Unit,
    onApply: () -> Unit,
) {
    val data = state.liquidacion
    val summary = data?.summary
    val selected = state.liquidacionSelected

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (data == null) {
            item {
                Text("Sin datos de liquidación", color = MaterialTheme.colorScheme.error)
            }
            return@LazyColumn
        }

        item {
            Text(
                "Productos con lotes ≤60 días",
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF64748B),
            )
        }

        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FarmaciaKpi(
                    title = "Productos",
                    value = "${summary?.totalProducts ?: 0}",
                    modifier = Modifier.weight(1f),
                )
                FarmaciaKpi(
                    title = "Unidades",
                    value = "${summary?.totalUnits ?: 0}",
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            FarmaciaKpi(
                title = "Pérdida potencial",
                value = formatClp(summary?.potentialLoss ?: 0.0),
                accent = Color(0xFFDC2626),
                subtitle = "precio × unidades en riesgo",
                modifier = Modifier.fillMaxWidth(),
            )
        }
        item {
            Row(
                Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                TierChip("Vencidos", summary?.expired ?: 0, Color(0xFF7F1D1D))
                TierChip("Crítico ≤15d", summary?.critical ?: 0, Color(0xFFDC2626))
                TierChip("Urgente ≤30d", summary?.urgent ?: 0, Color(0xFFD97706))
                TierChip("Aviso ≤60d", summary?.warning ?: 0, Color(0xFFCA8A04))
            }
        }

        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedButton(onClick = onSelectAllSuggested, modifier = Modifier.weight(1f)) {
                    Text("Sugeridos")
                }
                OutlinedButton(onClick = onClearSelection, modifier = Modifier.weight(1f)) {
                    Text("Limpiar")
                }
            }
        }

        item {
            Button(
                onClick = onApply,
                enabled = selected.isNotEmpty() && !state.liquidacionBusy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state.liquidacionBusy) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .height(18.dp)
                            .width(18.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                    Spacer(Modifier.width(8.dp))
                }
                Text("Aplicar descuentos (${selected.size})")
            }
        }

        if (data.items.isEmpty()) {
            item {
                Text(
                    "No hay lotes en riesgo de vencimiento",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B),
                )
            }
        } else {
            items(data.items, key = { it.productId }) { item ->
                LiquidacionItemCard(
                    item = item,
                    selectedPct = selected[item.productId],
                    onToggle = { onToggleItem(item.productId, item.suggestedDiscount) },
                    onPct = { pct -> onSetDiscount(item.productId, pct) },
                )
            }
        }
    }
}

@Composable
private fun LiquidacionItemCard(
    item: LiquidacionItemDto,
    selectedPct: Int?,
    onToggle: () -> Unit,
    onPct: (Int) -> Unit,
) {
    val selected = selectedPct != null
    val tierColor = tierColor(item.tier)
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (selected) Color(0xFFECFDF5) else MaterialTheme.colorScheme.surface,
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = selected, onCheckedChange = { onToggle() })
                Column(Modifier.weight(1f)) {
                    Text(
                        item.productName ?: item.productId,
                        fontWeight = FontWeight.SemiBold,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Text(
                        "${formatClp(item.price)} · stock ${item.stock} · en riesgo ${item.totalAtRisk} u.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B),
                    )
                }
                Text(
                    item.tier?.uppercase() ?: "—",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = tierColor,
                )
            }
            Text(
                "Vence en ${item.daysToExpiry}d · actual ${item.currentDiscount}% · sugerido ${item.suggestedDiscount}%",
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF475569),
            )
            if (selected) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    listOf(10, 25, 40, 50).forEach { pct ->
                        FilterChip(
                            selected = selectedPct == pct,
                            onClick = { onPct(pct) },
                            label = { Text("$pct%") },
                        )
                    }
                    if (item.suggestedDiscount !in listOf(10, 25, 40, 50) && item.suggestedDiscount > 0) {
                        FilterChip(
                            selected = selectedPct == item.suggestedDiscount,
                            onClick = { onPct(item.suggestedDiscount) },
                            label = { Text("${item.suggestedDiscount}% sug.") },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LoteVencerCard(lote: FarmaciaLoteVencer) {
    val urgent = lote.diasRestantes <= 7
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (urgent) Color(0xFFFEE2E2) else MaterialTheme.colorScheme.surface,
        ),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(
                lote.producto ?: "Producto",
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyMedium,
            )
            Text(
                "Lote ${lote.batchCode ?: "—"} · ${lote.quantity} u. · ${lote.diasRestantes}d",
                style = MaterialTheme.typography.bodySmall,
                color = if (urgent) Color(0xFFB91C1C) else Color(0xFF64748B),
            )
            lote.expiryDate?.let {
                Text(
                    "Vence ${shortDate(it)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF94A3B8),
                )
            }
        }
    }
}

@Composable
private fun UltimaRecetaCard(rec: PrescriptionRecordDto) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(
                    rec.productName ?: "Producto",
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f),
                )
                if (rec.isControlled) {
                    Text(
                        "CTRL",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF7C3AED),
                    )
                }
            }
            Text(
                "${rec.patientName ?: "—"} · x${rec.quantity}",
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF64748B),
            )
            val meta = listOfNotNull(
                rec.doctorName?.let { "Dr. $it" },
                rec.dispensedBy,
                shortDate(rec.dispensedAt),
            ).joinToString(" · ")
            if (meta.isNotBlank()) {
                Text(
                    meta,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF94A3B8),
                )
            }
        }
    }
}

@Composable
private fun FarmaciaKpi(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    accent: Color? = null,
    subtitle: String? = null,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = modifier,
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(
                title,
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF64748B),
            )
            Text(
                value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = accent ?: MaterialTheme.colorScheme.onSurface,
            )
            if (subtitle != null) {
                Text(
                    subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF94A3B8),
                )
            }
        }
    }
}

@Composable
private fun TierChip(label: String, count: Int, color: Color) {
    Card(colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.12f))) {
        Text(
            "$label: $count",
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = color,
        )
    }
}

private fun tierColor(tier: String?): Color = when (tier) {
    "expired" -> Color(0xFF7F1D1D)
    "critical" -> Color(0xFFDC2626)
    "urgent" -> Color(0xFFD97706)
    "warning" -> Color(0xFFCA8A04)
    else -> Color(0xFF64748B)
}

private fun shortDate(raw: String?): String {
    if (raw.isNullOrBlank()) return "—"
    return raw
        .replace('T', ' ')
        .take(16)
}
