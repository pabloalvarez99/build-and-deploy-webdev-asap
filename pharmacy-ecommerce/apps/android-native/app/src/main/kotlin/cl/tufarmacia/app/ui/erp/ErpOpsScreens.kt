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
fun ErpDevolucionesScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onCreate: (name: String, qty: Int, price: Double, motivo: String) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var qty by remember { mutableStateOf("1") }
    var price by remember { mutableStateOf("") }
    var motivo by remember { mutableStateOf("cliente") }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Devoluciones") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            item {
                Text("Registrar devolución", fontWeight = FontWeight.Bold)
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Producto") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                OutlinedTextField(
                    value = qty,
                    onValueChange = { qty = it.filter { ch -> ch.isDigit() } },
                    label = { Text("Cantidad") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it.filter { ch -> ch.isDigit() || ch == '.' } },
                    label = { Text("Precio unitario") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                )
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("cliente", "vencido", "daño", "error_venta").forEach { m ->
                        FilterChip(selected = motivo == m, onClick = { motivo = m }, label = { Text(m) })
                    }
                }
                Button(
                    onClick = {
                        val q = qty.toIntOrNull() ?: return@Button
                        val p = price.toDoubleOrNull() ?: return@Button
                        if (name.isBlank() || q <= 0) return@Button
                        onCreate(name.trim(), q, p, motivo)
                        name = ""
                        qty = "1"
                        price = ""
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                ) { Text("Guardar devolución") }
            }
            item { Text("Historial", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium) }
            items(state.devoluciones, key = { it.id }) { d ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text(d.motivo ?: "—", fontWeight = FontWeight.Medium)
                        Text(
                            "${formatClp(d.totalDevuelto)} · ${d.createdAt?.take(16)?.replace('T', ' ') ?: ""}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                        d.items.forEach { i ->
                            Text("· ${i.productName} x${i.quantity}", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
            if (state.devoluciones.isEmpty()) item { Text("Sin devoluciones recientes") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpUnknownBarcodesScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onDismiss: (String) -> Unit,
    onStartResolve: (String) -> Unit,
    onCancelResolve: () -> Unit,
    onResolveSearch: (String) -> Unit,
    onResolvePick: (String) -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Barcodes desconocidos") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            state.resolveBarcode?.let { barcode ->
                item {
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                    ) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Asignar $barcode a producto", fontWeight = FontWeight.Bold)
                            OutlinedTextField(
                                value = state.resolveSearch,
                                onValueChange = onResolveSearch,
                                modifier = Modifier.fillMaxWidth(),
                                placeholder = { Text("Buscar producto…") },
                                singleLine = true,
                            )
                            state.resolveResults.forEach { p ->
                                Card(
                                    Modifier
                                        .fillMaxWidth()
                                        .clickable { onResolvePick(p.id) },
                                ) {
                                    Column(Modifier.padding(10.dp)) {
                                        Text(p.name, fontWeight = FontWeight.Medium, maxLines = 2)
                                        Text("Stock ${p.stock} · ${formatClp(p.unitPrice())}", style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }
                            OutlinedButton(onClick = onCancelResolve, modifier = Modifier.fillMaxWidth()) {
                                Text("Cancelar")
                            }
                        }
                    }
                }
            }
            items(state.unknownBarcodes, key = { it.barcode }) { b ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(b.barcode, fontWeight = FontWeight.Bold)
                        Text(
                            "Scans: ${b.scanCount} · última ${b.lastScannedAt?.take(16)?.replace('T', ' ') ?: "—"}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                        Button(onClick = { onStartResolve(b.barcode) }, modifier = Modifier.fillMaxWidth()) {
                            Text("Asignar a producto")
                        }
                        OutlinedButton(onClick = { onDismiss(b.barcode) }, modifier = Modifier.fillMaxWidth()) {
                            Text("Descartar / falso positivo")
                        }
                    }
                }
            }
            if (state.unknownBarcodes.isEmpty()) item { Text("Sin barcodes pendientes") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpProductEditScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onSave: (price: Double?, stock: Int?, discount: Int?) -> Unit,
) {
    val p = state.editProduct
    var price by remember(p?.id) { mutableStateOf(p?.price.orEmpty()) }
    var stock by remember(p?.id) { mutableStateOf(p?.stock?.toString().orEmpty()) }
    var discount by remember(p?.id) { mutableStateOf(p?.discountPercent?.toString().orEmpty()) }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Editar producto") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        if (state.editProductBusy && p == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        if (p == null) {
            Text("Sin producto", Modifier.padding(24.dp))
            return
        }
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(p.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
            if (p.barcodes.isNotEmpty()) {
                Text("Barcodes: ${p.barcodes.joinToString()}", style = MaterialTheme.typography.bodySmall)
            }
            OutlinedTextField(
                value = price,
                onValueChange = { price = it.filter { ch -> ch.isDigit() || ch == '.' } },
                label = { Text("Precio") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            )
            OutlinedTextField(
                value = stock,
                onValueChange = { stock = it.filter { ch -> ch.isDigit() } },
                label = { Text("Stock") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            )
            OutlinedTextField(
                value = discount,
                onValueChange = { discount = it.filter { ch -> ch.isDigit() } },
                label = { Text("% Descuento") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            )
            Button(
                onClick = {
                    onSave(
                        price.toDoubleOrNull(),
                        stock.toIntOrNull(),
                        discount.toIntOrNull(),
                    )
                },
                enabled = !state.editProductBusy,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                if (state.editProductBusy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Guardar")
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
    onCreate: (title: String, description: String?, priority: String) -> Unit = { _, _, _ -> },
) {
    var newTitle by remember { mutableStateOf("") }
    var newDesc by remember { mutableStateOf("") }
    var newPriority by remember { mutableStateOf("normal") }
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
            item {
                Text("Nueva tarea", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = newTitle,
                    onValueChange = { newTitle = it },
                    label = { Text("Título") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = newDesc,
                    onValueChange = { newDesc = it },
                    label = { Text("Descripción (opc.)") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("low" to "Baja", "normal" to "Normal", "high" to "Alta", "urgent" to "Urgente").forEach { (v, l) ->
                        FilterChip(selected = newPriority == v, onClick = { newPriority = v }, label = { Text(l) })
                    }
                }
                Button(
                    onClick = {
                        if (newTitle.isBlank()) return@Button
                        onCreate(newTitle.trim(), newDesc.trim().ifBlank { null }, newPriority)
                        newTitle = ""
                        newDesc = ""
                        newPriority = "normal"
                    },
                    enabled = newTitle.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                ) { Text("Crear tarea") }
                Spacer(Modifier.height(8.dp))
                Text("Abiertas", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            }
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
