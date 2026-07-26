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
fun ErpClientsScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onOpen: (ClienteDto) -> Unit = {},
    onQueryChange: (String) -> Unit = {},
) {
    val q = state.clientsQuery.trim().lowercase()
    val filtered = if (q.isEmpty()) {
        state.clients
    } else {
        state.clients.filter { c ->
            listOfNotNull(c.name, c.surname, c.email, c.phone)
                .joinToString(" ")
                .lowercase()
                .contains(q)
        }
    }
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Clientes") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        OutlinedTextField(
            value = state.clientsQuery,
            onValueChange = onQueryChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Buscar nombre, email, tel…") },
            singleLine = true,
        )
        if (state.loading && state.clients.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(filtered, key = { it.id ?: it.email ?: it.hashCode().toString() }) { c ->
                    Card(
                        Modifier
                            .fillMaxWidth()
                            .clickable { onOpen(c) },
                    ) {
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
                            Text("Toca para detalle", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
                if (filtered.isEmpty()) {
                    item {
                        Text(
                            if (q.isEmpty()) "Sin clientes" else "Sin coincidencias para «${state.clientsQuery}»",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.Gray,
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpClienteDetailScreen(
    state: ErpUiState,
    onBack: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Cliente") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
        )
        if (state.clienteDetailLoading && state.clienteDetail == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        val detail = state.clienteDetail
        if (detail == null) {
            Text("Sin datos", Modifier.padding(24.dp))
            return
        }
        val c = detail.customer
        val k = detail.kpis
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                listOfNotNull(c?.name, c?.surname).joinToString(" ").ifBlank { c?.email ?: "Cliente" },
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleLarge,
            )
            c?.email?.let { Text(it) }
            c?.phone?.let { Text("Tel: $it") }
            c?.rut?.let { Text("RUT: $it") }
            Text(
                "${c?.type ?: "—"} · ${c?.loyaltyPoints ?: 0} pts lealtad",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray,
            )
            KpiCard("Gasto lifetime", formatClp(k.lifetimeSpend), "${k.orderCount} pedidos")
            KpiCard("Ticket promedio", formatClp(k.avgTicket), k.frequencyDays?.let { "cada $it días" } ?: "")
            if (k.firstOrder != null || k.lastOrder != null) {
                Text(
                    "Primera ${k.firstOrder?.take(10) ?: "—"} · Última ${k.lastOrder?.take(10) ?: "—"}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            if (k.topRecurrent.isNotEmpty()) {
                Text("Productos frecuentes", fontWeight = FontWeight.Bold)
                k.topRecurrent.take(5).forEach { p ->
                    Text(
                        "· ${p.productName ?: "Producto"} · ${p.orders} pedidos · x${p.totalQty}",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
            Text("Pedidos recientes", fontWeight = FontWeight.Bold)
            if (detail.orders.isEmpty()) {
                Text("Sin pedidos", style = MaterialTheme.typography.bodySmall)
            } else {
                detail.orders.forEach { o ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(o.status ?: "—", fontWeight = FontWeight.Medium)
                                Text(formatClp(o.total ?: "0"), fontWeight = FontWeight.SemiBold)
                            }
                            Text(o.id.take(8) + "…", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            o.createdAt?.let { Text(it.take(16).replace('T', ' '), style = MaterialTheme.typography.bodySmall) }
                            o.pickupCode?.let { Text("Retiro: $it", style = MaterialTheme.typography.bodySmall) }
                        }
                    }
                }
            }
        }
    }
}
