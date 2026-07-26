package cl.tufarmacia.app.ui.erp

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.material3.Surface
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
fun ErpPosScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onSearchChange: (String) -> Unit,
    onSearch: () -> Unit,
    onBarcodeChange: (String) -> Unit,
    onScanBarcode: () -> Unit,
    onOpenCamera: () -> Unit = {},
    onAdd: (cl.tufarmacia.app.data.model.Product) -> Unit,
    onQty: (String, Int) -> Unit,
    onPayment: (String) -> Unit,
    onCustomer: (String, String) -> Unit,
    onDiscountChange: (String) -> Unit,
    onNotesChange: (String) -> Unit = {},
    onMixedAmounts: (String, String) -> Unit,
    onLookupCustomer: () -> Unit,
    onPickupCodeChange: (String) -> Unit,
    onLookupPickup: () -> Unit,
    onClearPickup: () -> Unit,
    onApprovePickup: (String) -> Unit,
    onMarkPaidPickup: (String) -> Unit,
    onSubmit: () -> Unit,
    onClear: () -> Unit,
    onDismissLastSale: () -> Unit = {},
    onShareLastSale: () -> Unit = {},
    onAddRecent: (String) -> Unit = {},
) {
    var name by remember(state.posCustomer) { mutableStateOf(state.posCustomer) }
    var phone by remember(state.posPhone) { mutableStateOf(state.posPhone) }
    var showConfirm by remember { mutableStateOf(false) }
    val subtotal = state.posCart.sumOf { it.lineTotal }
    val discount = state.posDiscount.toDoubleOrNull() ?: 0.0
    val total = (subtotal - discount).coerceAtLeast(0.0)
    val paymentLabel = when (state.posPayment) {
        "pos_cash" -> "Efectivo"
        "pos_debit" -> "Débito"
        "pos_credit" -> "Crédito"
        "pos_mixed" -> "Mixta"
        else -> state.posPayment
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("POS", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                if (state.posCart.isNotEmpty()) {
                    TextButton(onClick = onClear) {
                        Text("Vaciar", color = MaterialTheme.colorScheme.error)
                    }
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            state.lastPosSale?.let { sale ->
                item {
                    Card(
                        Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFDCFCE7)),
                        elevation = CardDefaults.cardElevation(0.dp),
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("Última venta OK", fontWeight = FontWeight.Bold, color = Color(0xFF15803D))
                            Text(
                                formatClp(sale.total),
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF0F172A),
                            )
                            Text(
                                "${sale.itemCount} ítems · ${sale.paymentLabel}" +
                                    (sale.customer?.let { " · $it" } ?: ""),
                                style = MaterialTheme.typography.bodySmall,
                            )
                            sale.orderId?.let {
                                Text("ID ${it.take(8)}…", style = MaterialTheme.typography.labelSmall)
                            }
                            sale.lines.take(6).forEach { line ->
                                Text(
                                    "· ${line.name} x${line.quantity}",
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = onShareLastSale) { Text("Compartir") }
                                TextButton(onClick = onDismissLastSale) { Text("Cerrar") }
                            }
                        }
                    }
                }
            }
            if (state.posRecent.isNotEmpty()) {
                item {
                    Text("Recientes del turno", fontWeight = FontWeight.SemiBold)
                    Row(
                        Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        state.posRecent.forEach { r ->
                            FilterChip(
                                selected = false,
                                onClick = { onAddRecent(r.productId) },
                                label = {
                                    Text(
                                        r.name.take(22) + if (r.name.length > 22) "…" else "",
                                        maxLines = 1,
                                    )
                                },
                            )
                        }
                    }
                }
            }
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
                    OutlinedButton(onClick = onOpenCamera) { Text("📷") }
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
        Surface(shadowElevation = 10.dp, color = MaterialTheme.colorScheme.surface) {
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
            OutlinedTextField(
                value = state.posNotes,
                onValueChange = onNotesChange,
                label = { Text("Notas (opc.)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            if (discount > 0) {
                Text("Subtotal ${formatClp(subtotal)} − desc. ${formatClp(discount)}", style = MaterialTheme.typography.bodySmall)
            }
            Text("Total: ${formatClp(total)}", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Button(
                onClick = { showConfirm = true },
                enabled = !state.posBusy && state.posCart.isNotEmpty(),
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(14.dp),
            ) {
                if (state.posBusy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
                else Text("Cobrar", fontWeight = FontWeight.SemiBold)
            }
        }
        }
        if (showConfirm) {
            AlertDialog(
                onDismissRequest = { showConfirm = false },
                title = { Text("Confirmar venta") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("${state.posCart.sumOf { it.quantity }} ítems · $paymentLabel")
                        Text("Total ${formatClp(total)}", fontWeight = FontWeight.Bold)
                        if (name.isNotBlank()) Text("Cliente: $name")
                        if (state.posNotes.isNotBlank()) Text("Notas: ${state.posNotes}")
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showConfirm = false
                            onSubmit()
                        },
                        enabled = !state.posBusy,
                    ) { Text("Confirmar cobro") }
                },
                dismissButton = {
                    TextButton(onClick = { showConfirm = false }) { Text("Cancelar") }
                },
            )
        }
    }
}
