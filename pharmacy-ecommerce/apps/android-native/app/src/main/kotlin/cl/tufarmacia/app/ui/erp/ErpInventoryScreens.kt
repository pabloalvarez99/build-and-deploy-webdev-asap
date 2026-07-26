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
    onOpenCamera: () -> Unit = {},
    onAdjust: (productId: String, delta: Int) -> Unit,
    onCreateFalta: (productId: String?, productName: String) -> Unit,
    onEditProduct: (String) -> Unit = {},
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
            OutlinedButton(onClick = onOpenCamera) { Text("📷") }
        }
        if (state.loading && state.inventory.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.inventory, key = { it.id }) { item ->
                    Card(Modifier.fillMaxWidth().clickable { onEditProduct(item.id) }) {
                        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(item.name, fontWeight = FontWeight.Medium)
                            Text(
                                "Stock ${item.stock} · ${formatClp(item.price)} · ${item.category ?: ""}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                            if (item.lowStock) Text("STOCK BAJO", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                            Text("Toca para editar precio/stock", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
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
