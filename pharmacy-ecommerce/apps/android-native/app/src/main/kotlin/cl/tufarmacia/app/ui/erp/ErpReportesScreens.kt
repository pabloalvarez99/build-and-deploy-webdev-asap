package cl.tufarmacia.app.ui.erp

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import cl.tufarmacia.app.data.model.CashFlowDay
import cl.tufarmacia.app.data.model.PylMonth
import cl.tufarmacia.app.data.model.ReportesSalesByDay
import cl.tufarmacia.app.data.model.ReportesTopProduct
import cl.tufarmacia.app.util.formatClp
import kotlin.math.roundToInt

private val MONTH_LABELS = listOf(
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ErpReportesScreen(
    state: ErpUiState,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
    onTab: (String) -> Unit,
    onRangeDays: (Int) -> Unit,
    onPylYear: (Int) -> Unit,
) {
    val tab = state.reportesTab
    val loading = when (tab) {
        "flujo" -> state.cashFlowLoading
        "pyl" -> state.pylLoading
        else -> state.reportesLoading
    }
    val hasData = when (tab) {
        "flujo" -> state.cashFlow != null
        "pyl" -> state.pyl != null
        else -> state.reportes != null
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        TopAppBar(
            title = { Text("Reportes", fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            },
            actions = {
                TextButton(onClick = onRefresh, enabled = !loading) {
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
            listOf(
                "ventas" to "Ventas",
                "flujo" to "Flujo caja",
                "pyl" to "PyL",
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
            "flujo" -> CashFlowPanel(state = state)
            "pyl" -> PylPanel(state = state, onPylYear = onPylYear)
            else -> VentasPanel(state = state, onRangeDays = onRangeDays)
        }
    }
}

@Composable
private fun VentasPanel(
    state: ErpUiState,
    onRangeDays: (Int) -> Unit,
) {
    val data = state.reportes
    val kpis = data?.kpis
    val prev = data?.prevKpis
    val channel = data?.channelBreakdown

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Row(
                Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                listOf(7, 30, 90).forEach { days ->
                    FilterChip(
                        selected = state.reportesRangeDays == days,
                        onClick = { onRangeDays(days) },
                        label = { Text("${days}d") },
                    )
                }
            }
        }

        item {
            val from = state.reportesFrom.orEmpty()
            val to = state.reportesTo.orEmpty()
            Text(
                if (from.isNotBlank() && to.isNotBlank()) "Periodo $from → $to" else "Últimos ${state.reportesRangeDays} días",
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF64748B),
            )
        }

        if (data == null) {
            item { Text("Sin datos de reportes (solo dueño)", color = MaterialTheme.colorScheme.error) }
            return@LazyColumn
        }

        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ReportKpiMini(
                    title = "Ingresos",
                    value = formatClp(kpis?.totalRevenue ?: 0.0),
                    subtitle = deltaLabel(kpis?.totalRevenue ?: 0.0, prev?.totalRevenue ?: 0.0),
                    modifier = Modifier.weight(1f),
                )
                ReportKpiMini(
                    title = "Órdenes",
                    value = "${kpis?.totalOrders ?: 0}",
                    subtitle = deltaLabel(
                        (kpis?.totalOrders ?: 0).toDouble(),
                        (prev?.totalOrders ?: 0).toDouble(),
                    ),
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ReportKpiMini(
                    title = "Ticket prom.",
                    value = formatClp(kpis?.avgTicket ?: 0.0),
                    subtitle = deltaLabel(kpis?.avgTicket ?: 0.0, prev?.avgTicket ?: 0.0),
                    modifier = Modifier.weight(1f),
                )
                ReportKpiMini(
                    title = "Margen bruto",
                    value = formatClp(kpis?.grossMargin ?: 0.0),
                    subtitle = "${(kpis?.marginPct ?: 0.0).roundToInt()}% · costo ${formatClp(kpis?.totalCost ?: 0.0)}",
                    modifier = Modifier.weight(1f),
                )
            }
        }

        item {
            Text("Canales", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ChannelCard(
                    title = "Online",
                    revenue = channel?.online?.revenue ?: 0.0,
                    orders = channel?.online?.orders ?: 0,
                    extra = null,
                    modifier = Modifier.weight(1f),
                )
                ChannelCard(
                    title = "POS",
                    revenue = channel?.pos?.revenue ?: 0.0,
                    orders = channel?.pos?.orders ?: 0,
                    extra = "E ${channel?.pos?.cash ?: 0} · D ${channel?.pos?.debit ?: 0} · C ${channel?.pos?.credit ?: 0}",
                    modifier = Modifier.weight(1f),
                )
            }
        }

        val cust = data.customerMetrics
        item {
            Text("Clientes", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
        }
        item {
            Card(
                Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            ) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("${cust.totalUniqueCustomers} únicos · reg ${cust.uniqueRegistered} · invitado ${cust.uniqueGuests}")
                    Text(
                        "Ticket/cliente ${formatClp(cust.avgRevenuePerCustomer)} · ${cust.avgOrdersPerCustomer} ord/cli",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B),
                    )
                }
            }
        }

        cust.topCustomers.takeIf { it.isNotEmpty() }?.let { tops ->
            item {
                Text("Top clientes", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
            }
            items(tops, key = { "c-${it.name}-${it.spend}" }) { c ->
                ListRow(
                    title = c.name ?: "Cliente",
                    right = formatClp(c.spend),
                    subtitle = "${c.orders} órdenes",
                )
            }
        }

        data.byCategory.takeIf { it.isNotEmpty() }?.let { cats ->
            item {
                Text("Por categoría", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
            }
            items(cats.take(12), key = { "cat-${it.name}" }) { cat ->
                ListRow(
                    title = cat.name ?: "Sin categoría",
                    right = formatClp(cat.revenue),
                    subtitle = "${cat.units} u · margen ${formatClp(cat.margin)}",
                )
            }
        }

        data.topProducts.takeIf { it.isNotEmpty() }?.let { products ->
            item {
                Spacer(Modifier.height(4.dp))
                Text("Top productos (unidades)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
            }
            items(products.take(15), key = { "tp-${it.name}-${it.units}" }) { p ->
                ProductRow(p)
            }
        }

        data.salesByDay.takeLast(14).asReversed().takeIf { it.isNotEmpty() }?.let { days ->
            item {
                Spacer(Modifier.height(4.dp))
                Text("Ventas por día (últ. 14)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
            }
            items(days, key = { "d-${it.date}" }) { day ->
                DayRow(day)
            }
        }

        data.salesByHour
            .filter { it.ordenes > 0 }
            .sortedByDescending { it.ventas }
            .take(8)
            .takeIf { it.isNotEmpty() }
            ?.let { hours ->
                item {
                    Spacer(Modifier.height(4.dp))
                    Text("Horas pico", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                }
                items(hours, key = { "h-${it.hour}" }) { h ->
                    ListRow(
                        title = "%02d:00".format(h.hour),
                        right = formatClp(h.ventas),
                        subtitle = "${h.ordenes} órdenes",
                    )
                }
            }
    }
}

@Composable
private fun CashFlowPanel(state: ErpUiState) {
    val days = state.cashFlow?.days.orEmpty()
    val past = days.filter { it.isPast }
    val future = days.filter { !it.isPast }
    val totalIn = past.sumOf { it.inflow }
    val totalOut = past.sumOf { it.outflow }
    val projected = future.sumOf { it.projectedOutflow }
    val lastBalance = days.lastOrNull()?.balance ?: 0.0
    val recent = days.takeLast(21).asReversed()

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (days.isEmpty()) {
            item { Text("Sin datos de flujo (solo dueño)", color = MaterialTheme.colorScheme.error) }
            return@LazyColumn
        }

        item {
            Text(
                "30d reales + 30d proyección",
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF64748B),
            )
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ReportKpiMini(
                    title = "Ingresos 30d",
                    value = formatClp(totalIn),
                    subtitle = "real",
                    modifier = Modifier.weight(1f),
                )
                ReportKpiMini(
                    title = "Egresos 30d",
                    value = formatClp(totalOut),
                    subtitle = "pagos + gastos",
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ReportKpiMini(
                    title = "Proyección 30d",
                    value = formatClp(projected),
                    subtitle = "OC + recurrentes",
                    modifier = Modifier.weight(1f),
                )
                ReportKpiMini(
                    title = "Balance acum.",
                    value = formatClp(lastBalance),
                    subtitle = if (lastBalance >= 0) "positivo" else "negativo",
                    modifier = Modifier.weight(1f),
                )
            }
        }

        item {
            Text("Días recientes", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
        }
        items(recent, key = { "cf-${it.date}" }) { day ->
            CashFlowRow(day)
        }
    }
}

@Composable
private fun PylPanel(
    state: ErpUiState,
    onPylYear: (Int) -> Unit,
) {
    val pyl = state.pyl
    val year = state.pylYear
    val nowYear = java.time.LocalDate.now().year

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Row(
                Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                listOf(nowYear - 1, nowYear).forEach { y ->
                    FilterChip(
                        selected = year == y,
                        onClick = { onPylYear(y) },
                        label = { Text("$y") },
                    )
                }
            }
        }

        if (pyl == null) {
            item { Text("Sin datos PyL (solo dueño)", color = MaterialTheme.colorScheme.error) }
            return@LazyColumn
        }

        item {
            Text("YTD ${pyl.year}", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ReportKpiMini(
                    title = "Ingresos YTD",
                    value = formatClp(pyl.ytd.ingresos),
                    subtitle = "",
                    modifier = Modifier.weight(1f),
                )
                ReportKpiMini(
                    title = "Gastos YTD",
                    value = formatClp(pyl.ytd.gastos),
                    subtitle = "",
                    modifier = Modifier.weight(1f),
                )
            }
        }
        item {
            ReportKpiMini(
                title = "Margen YTD",
                value = formatClp(pyl.ytd.margen),
                subtitle = if (pyl.ytd.ingresos > 0) {
                    "${((pyl.ytd.margen / pyl.ytd.ingresos) * 100).roundToInt()}% sobre ingresos"
                } else {
                    ""
                },
                modifier = Modifier.fillMaxWidth(),
            )
        }

        item {
            Text("Mensual", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
        }
        items(pyl.months.filter { it.ingresos > 0 || it.gastos > 0 || it.month <= java.time.LocalDate.now().monthValue || pyl.year < nowYear }, key = { "m-${it.month}" }) { m ->
            PylMonthRow(m)
        }
    }
}

@Composable
private fun ChannelCard(
    title: String,
    revenue: Double,
    orders: Int,
    extra: String?,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
            Text(formatClp(revenue), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text("$orders órdenes", style = MaterialTheme.typography.bodySmall, color = Color(0xFF64748B))
            extra?.let {
                Text(it, style = MaterialTheme.typography.labelSmall, color = Color(0xFF64748B))
            }
        }
    }
}

@Composable
private fun ProductRow(p: ReportesTopProduct) {
    val marginNote = when {
        p.marginPct != null -> " · margen ${p.marginPct.roundToInt()}%"
        else -> ""
    }
    ListRow(
        title = p.name ?: "Producto",
        right = formatClp(p.revenue),
        subtitle = "${p.units} u · ${p.category ?: "—"}$marginNote",
    )
}

@Composable
private fun DayRow(day: ReportesSalesByDay) {
    val online = day.ventas
    val pos = day.ventasPos
    val total = online + pos
    ListRow(
        title = day.date ?: "—",
        right = formatClp(total),
        subtitle = "web ${formatClp(online)} (${day.ordenes}) · POS ${formatClp(pos)} (${day.ordenesPos})",
    )
}

@Composable
private fun CashFlowRow(day: CashFlowDay) {
    val subtitle = if (day.isPast) {
        "in ${formatClp(day.inflow)} · out ${formatClp(day.outflow)}"
    } else {
        "proy. egreso ${formatClp(day.projectedOutflow)}"
    }
    ListRow(
        title = "${day.date ?: "—"} ${if (day.isPast) "" else "· proy"}".trim(),
        right = formatClp(day.balance),
        subtitle = subtitle,
    )
}

@Composable
private fun PylMonthRow(m: PylMonth) {
    val label = MONTH_LABELS.getOrNull(m.month - 1) ?: "M${m.month}"
    val deltaIng = if (m.ingresosPrev > 0) {
        val pct = ((m.ingresos - m.ingresosPrev) / m.ingresosPrev) * 100
        " · YoY ${if (pct >= 0) "+" else ""}${pct.roundToInt()}%"
    } else {
        ""
    }
    ListRow(
        title = label,
        right = formatClp(m.margen),
        subtitle = "ing ${formatClp(m.ingresos)} · gas ${formatClp(m.gastos)}$deltaIng",
    )
}

@Composable
private fun ListRow(
    title: String,
    right: String,
    subtitle: String,
) {
    Card(
        Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Medium)
                if (subtitle.isNotBlank()) {
                    Text(subtitle, style = MaterialTheme.typography.bodySmall, color = Color(0xFF64748B))
                }
            }
            Text(right, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun ReportKpiMini(
    title: String,
    value: String,
    subtitle: String,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp),
    ) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(title, style = MaterialTheme.typography.labelMedium, color = Color(0xFF64748B))
            Text(
                value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
            if (subtitle.isNotBlank()) {
                Text(subtitle, style = MaterialTheme.typography.labelSmall, color = Color(0xFF64748B))
            }
        }
    }
}

private fun deltaLabel(current: Double, previous: Double): String {
    if (previous == 0.0) return if (current > 0) "vs prev · n/a" else "vs prev"
    val pct = ((current - previous) / previous) * 100
    val sign = if (pct >= 0) "+" else ""
    return "vs prev $sign${pct.roundToInt()}%"
}
