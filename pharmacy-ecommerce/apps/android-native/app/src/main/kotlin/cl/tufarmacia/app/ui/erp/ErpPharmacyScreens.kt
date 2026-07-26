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
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import cl.tufarmacia.app.data.model.PrescriptionRecordDto

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpPrescriptionsScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onFilter: (Boolean?) -> Unit,
    onCreate: (
        productName: String,
        quantity: Int,
        patientName: String,
        patientRut: String?,
        prescriptionNumber: String?,
        doctorName: String?,
        medicalCenter: String?,
        isControlled: Boolean,
        dispensedBy: String?,
    ) -> Unit,
) {
    var showForm by remember { mutableStateOf(false) }
    var productName by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("1") }
    var patientName by remember { mutableStateOf("") }
    var patientRut by remember { mutableStateOf("") }
    var prescriptionNumber by remember { mutableStateOf("") }
    var doctorName by remember { mutableStateOf("") }
    var medicalCenter by remember { mutableStateOf("") }
    var dispensedBy by remember { mutableStateOf("") }
    var isControlled by remember { mutableStateOf(false) }

    fun resetForm() {
        productName = ""
        quantity = "1"
        patientName = ""
        patientRut = ""
        prescriptionNumber = ""
        doctorName = ""
        medicalCenter = ""
        dispensedBy = ""
        isControlled = false
        showForm = false
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Libro de recetas", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                TextButton(onClick = { showForm = !showForm }) {
                    Text(if (showForm) "Lista" else "Nueva")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
        )

        Row(
            Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            FilterChip(
                selected = state.prescriptionsControlled == null,
                onClick = { onFilter(null) },
                label = { Text("Todas") },
            )
            FilterChip(
                selected = state.prescriptionsControlled == true,
                onClick = { onFilter(true) },
                label = { Text("Controladas") },
            )
            FilterChip(
                selected = state.prescriptionsControlled == false,
                onClick = { onFilter(false) },
                label = { Text("No controladas") },
            )
            OutlinedButton(onClick = onRefresh) { Text("↻") }
        }

        if (state.prescriptionsLoading && state.prescriptions.isEmpty() && !showForm) {
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
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    KpiMini(
                        title = "Hoy",
                        value = "${state.prescriptionsKpis.hoy}",
                        modifier = Modifier.weight(1f),
                    )
                    KpiMini(
                        title = "Mes",
                        value = "${state.prescriptionsKpis.mes}",
                        modifier = Modifier.weight(1f),
                    )
                    KpiMini(
                        title = "Listado",
                        value = "${state.prescriptionsTotal}",
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            if (showForm) {
                item {
                    Card(
                        Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp),
                    ) {
                        Column(
                            Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text("Registrar receta manual", fontWeight = FontWeight.Bold)
                            Text(
                                "Para dispensaciones sin POS o fuera de venta online",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF64748B),
                            )
                            OutlinedTextField(
                                value = patientName,
                                onValueChange = { patientName = it },
                                label = { Text("Paciente *") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = patientRut,
                                onValueChange = { patientRut = it },
                                label = { Text("RUT paciente") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = productName,
                                onValueChange = { productName = it },
                                label = { Text("Producto / medicamento *") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = quantity,
                                onValueChange = { quantity = it.filter { ch -> ch.isDigit() } },
                                label = { Text("Cantidad *") },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = prescriptionNumber,
                                onValueChange = { prescriptionNumber = it },
                                label = { Text("Nº receta") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = doctorName,
                                onValueChange = { doctorName = it },
                                label = { Text("Médico") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = medicalCenter,
                                onValueChange = { medicalCenter = it },
                                label = { Text("Centro médico") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            OutlinedTextField(
                                value = dispensedBy,
                                onValueChange = { dispensedBy = it },
                                label = { Text("Dispensado por") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                FilterChip(
                                    selected = !isControlled,
                                    onClick = { isControlled = false },
                                    label = { Text("Simple") },
                                )
                                FilterChip(
                                    selected = isControlled,
                                    onClick = { isControlled = true },
                                    label = { Text("Controlada") },
                                )
                            }
                            Button(
                                onClick = {
                                    val qty = quantity.toIntOrNull() ?: 0
                                    onCreate(
                                        productName,
                                        qty,
                                        patientName,
                                        patientRut.ifBlank { null },
                                        prescriptionNumber.ifBlank { null },
                                        doctorName.ifBlank { null },
                                        medicalCenter.ifBlank { null },
                                        isControlled,
                                        dispensedBy.ifBlank { null },
                                    )
                                    resetForm()
                                },
                                enabled = !state.prescriptionsBusy &&
                                    productName.isNotBlank() &&
                                    patientName.isNotBlank() &&
                                    (quantity.toIntOrNull() ?: 0) >= 1,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text(if (state.prescriptionsBusy) "Guardando…" else "Registrar en libro")
                            }
                            OutlinedButton(
                                onClick = { resetForm() },
                                modifier = Modifier.fillMaxWidth(),
                            ) { Text("Cancelar") }
                        }
                    }
                }
            }

            if (state.prescriptions.isEmpty() && !state.prescriptionsLoading) {
                item {
                    Text(
                        "Sin recetas en este filtro",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF64748B),
                    )
                }
            }

            items(state.prescriptions, key = { it.id }) { rec ->
                PrescriptionCard(rec)
            }

            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun KpiMini(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(12.dp)) {
            Text(title, style = MaterialTheme.typography.labelSmall, color = Color(0xFF64748B))
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun PrescriptionCard(rec: PrescriptionRecordDto) {
    val bg = if (rec.isControlled) {
        MaterialTheme.colorScheme.errorContainer
    } else {
        MaterialTheme.colorScheme.surface
    }
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = bg),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    rec.patientName ?: "Paciente",
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.titleSmall,
                )
                if (rec.isControlled) {
                    Text(
                        "CONTROLADA",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            }
            Text(
                "${rec.productName ?: "Producto"} × ${rec.quantity}",
                style = MaterialTheme.typography.bodyMedium,
            )
            rec.patientRut?.takeIf { it.isNotBlank() }?.let {
                Text("RUT $it", style = MaterialTheme.typography.bodySmall, color = Color(0xFF64748B))
            }
            val meta = buildList {
                rec.prescriptionNumber?.takeIf { it.isNotBlank() }?.let { add("Nº $it") }
                rec.doctorName?.takeIf { it.isNotBlank() }?.let { add("Dr. $it") }
                rec.medicalCenter?.takeIf { it.isNotBlank() }?.let { add(it) }
            }
            if (meta.isNotEmpty()) {
                Text(meta.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = Color(0xFF64748B))
            }
            val whenWho = buildList {
                rec.dispensedAt?.take(16)?.replace('T', ' ')?.let { add(it) }
                rec.dispensedBy?.takeIf { it.isNotBlank() }?.let { add(it) }
                if (rec.orderId != null) add("POS/web") else add("manual")
            }
            Text(
                whenWho.joinToString(" · "),
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFF94A3B8),
            )
        }
    }
}
