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
fun ErpArqueoScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onSetFondo: (Double) -> Unit = {},
    onCerrarTurno: (efectivoContado: Double, notas: String?) -> Unit = { _, _ -> },
    onSetPharmacist: (name: String, rut: String) -> Unit = { _, _ -> },
    onClosePharmacist: () -> Unit = {},
) {
    var showFondo by remember { mutableStateOf(false) }
    var showCerrar by remember { mutableStateOf(false) }
    var showPharmacist by remember { mutableStateOf(false) }
    var fondoInput by remember { mutableStateOf("") }
    var contadoInput by remember { mutableStateOf("") }
    var notasInput by remember { mutableStateOf("") }
    var pharmName by remember { mutableStateOf("") }
    var pharmRut by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Arqueo de caja") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                }
            },
            actions = {
                Text("Actualizar", Modifier.clickable(onClick = onRefresh).padding(16.dp), color = MaterialTheme.colorScheme.primary)
            },
        )
        if (state.loading && state.arqueo == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            return
        }
        val a = state.arqueo
        if (a == null) {
            Text("Sin datos", Modifier.padding(16.dp))
            return
        }
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (a.pharmacistName.isNullOrBlank()) {
                Text("Sin farmacéutico de turno", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            } else {
                Text("Farmacéutico: ${a.pharmacistName}", fontWeight = FontWeight.Medium)
            }
            Text("Turno desde: ${a.turnoInicio ?: "—"}", style = MaterialTheme.typography.bodySmall)
            KpiCard("Fondo inicial", formatClp(a.fondoInicial), "")
            KpiCard("Ventas total turno", formatClp(a.ventas.total), "${a.ventas.numTransacciones} transacciones")
            KpiCard("Efectivo", formatClp(a.ventas.efectivo), "Débito ${formatClp(a.ventas.debito)} · Crédito ${formatClp(a.ventas.credito)}")
            KpiCard("Efectivo esperado", formatClp(a.efectivoEsperado), "fondo + ventas efectivo")

            Text("Acciones de caja", fontWeight = FontWeight.Bold)
            Button(
                onClick = {
                    fondoInput = if (a.fondoInicial > 0) a.fondoInicial.toInt().toString() else ""
                    showFondo = true
                },
                enabled = !state.arqueoBusy,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Definir fondo inicial") }
            Button(
                onClick = {
                    contadoInput = a.efectivoEsperado.roundToIntSafe()
                    notasInput = ""
                    showCerrar = true
                },
                enabled = !state.arqueoBusy,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Cerrar turno") }
            if (a.pharmacistName.isNullOrBlank()) {
                OutlinedButton(
                    onClick = {
                        pharmName = ""
                        pharmRut = ""
                        showPharmacist = true
                    },
                    enabled = !state.arqueoBusy,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Iniciar turno farmacéutico") }
            } else {
                OutlinedButton(
                    onClick = onClosePharmacist,
                    enabled = !state.arqueoBusy,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Cerrar turno farmacéutico") }
            }
            if (state.arqueoBusy) {
                CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally))
            }

            Text("Últimas ventas POS", fontWeight = FontWeight.Bold)
            a.recentOrders.forEach { o ->
                Card(Modifier.fillMaxWidth()) {
                    Row(
                        Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(o.customer ?: "Cliente", fontWeight = FontWeight.Medium)
                            Text(o.paymentProvider ?: "", style = MaterialTheme.typography.labelSmall)
                        }
                        Text(formatClp(o.total), fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }

    if (showFondo) {
        AlertDialog(
            onDismissRequest = { showFondo = false },
            title = { Text("Fondo inicial") },
            text = {
                OutlinedTextField(
                    value = fondoInput,
                    onValueChange = { fondoInput = it.filter { ch -> ch.isDigit() || ch == '.' } },
                    label = { Text("Monto \$") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val v = fondoInput.toDoubleOrNull()
                        if (v == null || v < 0) return@Button
                        showFondo = false
                        onSetFondo(v)
                    },
                ) { Text("Guardar") }
            },
            dismissButton = { TextButton(onClick = { showFondo = false }) { Text("Cancelar") } },
        )
    }
    if (showCerrar) {
        val esperado = state.arqueo?.efectivoEsperado ?: 0.0
        AlertDialog(
            onDismissRequest = { showCerrar = false },
            title = { Text("Cerrar turno") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Efectivo esperado: ${formatClp(esperado)}")
                    OutlinedTextField(
                        value = contadoInput,
                        onValueChange = { contadoInput = it.filter { ch -> ch.isDigit() || ch == '.' } },
                        label = { Text("Efectivo contado \$") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = notasInput,
                        onValueChange = { notasInput = it },
                        label = { Text("Notas (opc.)") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val v = contadoInput.toDoubleOrNull()
                        if (v == null || v < 0) return@Button
                        showCerrar = false
                        onCerrarTurno(v, notasInput.trim().ifBlank { null })
                    },
                ) { Text("Cerrar") }
            },
            dismissButton = { TextButton(onClick = { showCerrar = false }) { Text("Cancelar") } },
        )
    }
    if (showPharmacist) {
        AlertDialog(
            onDismissRequest = { showPharmacist = false },
            title = { Text("Farmacéutico de turno") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = pharmName,
                        onValueChange = { pharmName = it },
                        label = { Text("Nombre") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = pharmRut,
                        onValueChange = { pharmRut = it },
                        label = { Text("RUT") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (pharmName.isBlank() || pharmRut.isBlank()) return@Button
                        showPharmacist = false
                        onSetPharmacist(pharmName.trim(), pharmRut.trim())
                    },
                ) { Text("Iniciar") }
            },
            dismissButton = { TextButton(onClick = { showPharmacist = false }) { Text("Cancelar") } },
        )
    }
}

private fun Double.roundToIntSafe(): String =
    if (this == toLong().toDouble()) toLong().toString() else toString()
