package cl.tufarmacia.app.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import cl.tufarmacia.app.data.model.AuthUser
import cl.tufarmacia.app.data.model.Product
import cl.tufarmacia.app.ui.AppUiState
import java.text.NumberFormat
import java.util.Locale

@Composable
fun SplashScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0891B2)),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "Tu Farmacia",
                style = MaterialTheme.typography.headlineLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold,
            )
            Spacer(Modifier.height(8.dp))
            Text("Coquimbo", color = Color.White.copy(alpha = 0.9f))
            Spacer(Modifier.height(24.dp))
            CircularProgressIndicator(color = Color.White)
        }
    }
}

@Composable
fun HomeScreen(
    user: AuthUser?,
    productCount: Int,
    onOpenCatalog: () -> Unit,
    onOpenLogin: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            "Tu Farmacia",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            if (user != null) "Hola, ${user.name ?: user.email ?: "usuario"}"
            else "Farmacia en Coquimbo · adultos mayores",
            style = MaterialTheme.typography.bodyLarge,
        )
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Android nativo Kotlin (Phase 1)", fontWeight = FontWeight.SemiBold)
                Text(
                    "App 100% Kotlin + Jetpack Compose (sin KMP, sin WebView). " +
                        "Catálogo prod · Auth Firebase · iOS será un proyecto Swift separado.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (productCount > 0) {
                    Text("$productCount productos en catálogo", fontWeight = FontWeight.Medium)
                }
            }
        }
        Button(onClick = onOpenCatalog, modifier = Modifier.fillMaxWidth()) {
            Text("Ver catálogo")
        }
        if (user == null) {
            OutlinedButton(onClick = onOpenLogin, modifier = Modifier.fillMaxWidth()) {
                Text("Iniciar sesión")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogScreen(
    state: AppUiState,
    onSearchChange: (String) -> Unit,
    onSearch: () -> Unit,
    onRetry: () -> Unit,
) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Catálogo") })
        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = onSearchChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            placeholder = { Text("Buscar medicamento…") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSearch() }),
        )
        when {
            state.productsLoading && state.products.isEmpty() -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            state.productsError != null && state.products.isEmpty() -> {
                Column(
                    Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(state.productsError, color = MaterialTheme.colorScheme.error)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = onRetry) { Text("Reintentar") }
                }
            }
            else -> {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(state.products, key = { it.id }) { product ->
                        ProductRow(product)
                    }
                    if (state.products.isEmpty()) {
                        item {
                            Text("Sin resultados", modifier = Modifier.padding(24.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductRow(product: Product) {
    val clp = remember {
        NumberFormat.getCurrencyInstance(Locale("es", "CL"))
    }
    val priceLabel = runCatching {
        clp.format(product.price.toDoubleOrNull() ?: 0.0)
    }.getOrElse { "$${product.price}" }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (product.imageUrl != null) {
                AsyncImage(
                    model = product.imageUrl,
                    contentDescription = product.name,
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop,
                )
            } else {
                Box(
                    Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("Rx", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            }
            Column(Modifier.weight(1f)) {
                Text(
                    product.name,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = FontWeight.Medium,
                )
                product.activeIngredient?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Color.Gray, maxLines = 1)
                }
                Text(priceLabel, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                Text("Stock: ${product.stock}", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    loading: Boolean,
    error: String?,
    onLogin: (String, String) -> Unit,
    embedded: Boolean,
    onBack: (() -> Unit)? = null,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize()) {
        if (!embedded) {
            TopAppBar(
                title = { Text("Iniciar sesión") },
                navigationIcon = {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                        }
                    }
                },
            )
        } else {
            TopAppBar(title = { Text("Cuenta") })
        }
        Column(
            Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                "Usa la misma cuenta de tu-farmacia.cl",
                style = MaterialTheme.typography.bodyMedium,
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Correo") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Contraseña") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(
                    onDone = { if (email.isNotBlank() && password.isNotBlank()) onLogin(email, password) },
                ),
            )
            if (error != null) {
                Text(error, color = MaterialTheme.colorScheme.error)
            }
            Button(
                onClick = { onLogin(email, password) },
                enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (loading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Text("Entrar")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountScreen(user: AuthUser, onLogout: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Mi cuenta") })
        Column(
            Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(user.name ?: "Usuario", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(user.email ?: "—")
            Text("Rol: ${user.role}")
            Text("UID: ${user.uid}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
            if (user.isAdmin) {
                Text("Acceso admin habilitado (ERP en fases siguientes)", color = MaterialTheme.colorScheme.primary)
            }
            Spacer(Modifier.height(12.dp))
            OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
                Text("Cerrar sesión")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminPlaceholderScreen(user: AuthUser?) {
    Column(Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Admin ERP") })
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Próximamente", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(
                "El ERP completo (POS, stock, órdenes, finanzas) se implementará en fases. " +
                    "Esta app es Android puro; iOS se construirá aparte en Swift/SwiftUI.",
            )
            Text("Usuario: ${user?.email ?: "—"} · rol ${user?.role ?: "—"}")
            Text("Módulos planificados: órdenes, inventario, POS, compras, finanzas, clientes.")
        }
    }
}
