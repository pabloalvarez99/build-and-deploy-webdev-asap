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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpFinanceScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onPayAp: (id: String, amount: Double) -> Unit,
    onCreateGasto: (categoryId: String, description: String, amount: Double) -> Unit,
    onRefresh: () -> Unit,
) {
    var gastoDesc by remember { mutableStateOf("") }
    var gastoAmount by remember { mutableStateOf("") }
    var gastoCat by remember { mutableStateOf(state.gastoCategories.firstOrNull()?.id.orEmpty()) }
    LaunchedEffect(state.gastoCategories) {
        if (gastoCat.isBlank()) gastoCat = state.gastoCategories.firstOrNull()?.id.orEmpty()
    }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Finanzas") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            val f = state.finanzas
            if (f == null) {
                item { Text("Cargando o sin permiso owner…") }
            } else {
                item { KpiCard("Cuentas por pagar", formatClp(f.pendingApAmount), "${f.pendingApCount} pendientes") }
                item { KpiCard("AP vencidas", "${f.overdueApCount}", "facturas overdue") }
                item { KpiCard("Ingresos mes", formatClp(f.ingresosMes), "órdenes paid/completed") }
                item { KpiCard("Gastos mes", formatClp(f.gastosMes), "") }
            }
            item { Text("Por pagar (AP)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium) }
            items(state.apOrders, key = { it.id }) { po ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(po.suppliers?.name ?: "Proveedor", fontWeight = FontWeight.Medium)
                        Text("Factura ${po.invoiceNumber ?: "—"} · ${formatClp(po.totalCost ?: 0.0)}")
                        po.dueDate?.let { Text("Vence ${it.take(10)}", style = MaterialTheme.typography.labelSmall) }
                        val amt = po.totalCost ?: 0.0
                        if (amt > 0 && !po.paid) {
                            Button(
                                onClick = { onPayAp(po.id, amt) },
                                modifier = Modifier.fillMaxWidth(),
                            ) { Text("Marcar pagada (${formatClp(amt)})") }
                        }
                    }
                }
            }
            if (state.apOrders.isEmpty()) item { Text("Sin AP pendientes", style = MaterialTheme.typography.bodySmall) }
            item { Text("Nuevo gasto", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium) }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (state.gastoCategories.isNotEmpty()) {
                        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            state.gastoCategories.forEach { cat ->
                                FilterChip(
                                    selected = gastoCat == cat.id,
                                    onClick = { gastoCat = cat.id },
                                    label = { Text(cat.name ?: cat.id.take(6)) },
                                )
                            }
                        }
                    }
                    OutlinedTextField(
                        value = gastoDesc,
                        onValueChange = { gastoDesc = it },
                        label = { Text("Descripción") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = gastoAmount,
                        onValueChange = { gastoAmount = it.filter { ch -> ch.isDigit() || ch == '.' } },
                        label = { Text("Monto") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    )
                    Button(
                        onClick = {
                            val amt = gastoAmount.toDoubleOrNull()
                            if (gastoCat.isBlank() || gastoDesc.isBlank() || amt == null || amt <= 0) return@Button
                            onCreateGasto(gastoCat, gastoDesc.trim(), amt)
                            gastoDesc = ""
                            gastoAmount = ""
                        },
                        enabled = gastoCat.isNotBlank(),
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Registrar gasto") }
                }
            }
            item { Text("Gastos recientes", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium) }
            items(state.gastos, key = { it.id }) { g ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(g.description ?: "Gasto", fontWeight = FontWeight.Medium)
                        Text(
                            "${formatClp(g.amount ?: 0.0)} · ${g.expenseDate ?: ""} · ${g.category?.name ?: ""}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }
}
