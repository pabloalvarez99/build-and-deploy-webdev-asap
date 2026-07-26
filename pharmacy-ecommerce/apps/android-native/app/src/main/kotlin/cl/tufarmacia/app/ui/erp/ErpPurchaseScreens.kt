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
    onExpress: (supplierId: String, supplierName: String) -> Unit = { _, _ -> },
    onCreateOc: (supplierId: String, supplierName: String) -> Unit = { _, _ -> },
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
                val supplierId = group.supplier?.id
                val supplierName = group.supplier?.name ?: "Proveedor"
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            supplierName,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium,
                        )
                        group.supplier?.contactPhone?.let {
                            Text("Tel $it", style = MaterialTheme.typography.bodySmall)
                        }
                        if (supplierId != null && group.items.isNotEmpty()) {
                            Button(
                                onClick = { onCreateOc(supplierId, supplierName) },
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text("Crear OC draft (${group.items.size} ítems)")
                            }
                            OutlinedButton(
                                onClick = { onExpress(supplierId, supplierName) },
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text("Email express")
                            }
                        }
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
