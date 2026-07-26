package cl.tufarmacia.app.data.cart

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import cl.tufarmacia.app.data.model.CartLine
import cl.tufarmacia.app.data.model.Product
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

private val Context.cartDataStore by preferencesDataStore(name = "cart")

class CartRepository(private val context: Context) {
    private val key = stringPreferencesKey("lines_json")
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    val lines: Flow<List<CartLine>> = context.cartDataStore.data.map { prefs ->
        val raw = prefs[key] ?: return@map emptyList()
        runCatching { json.decodeFromString<List<CartLine>>(raw) }.getOrDefault(emptyList())
    }

    suspend fun add(product: Product, qty: Int = 1) {
        mutate { current ->
            val existing = current.find { it.productId == product.id }
            if (existing != null) {
                current.map {
                    if (it.productId == product.id) it.copy(quantity = it.quantity + qty) else it
                }
            } else {
                current + CartLine(
                    productId = product.id,
                    productName = product.name,
                    productSlug = product.slug,
                    imageUrl = product.imageUrl,
                    unitPrice = product.unitPrice(),
                    quantity = qty,
                )
            }
        }
    }

    suspend fun setQuantity(productId: String, quantity: Int) {
        mutate { current ->
            if (quantity <= 0) current.filterNot { it.productId == productId }
            else current.map {
                if (it.productId == productId) it.copy(quantity = quantity) else it
            }
        }
    }

    suspend fun remove(productId: String) {
        mutate { it.filterNot { line -> line.productId == productId } }
    }

    suspend fun clear() {
        context.cartDataStore.edit { it.remove(key) }
    }

    /** Replace lines after live stock/price revalidation. */
    suspend fun replaceAll(lines: List<CartLine>) {
        context.cartDataStore.edit { prefs ->
            if (lines.isEmpty()) prefs.remove(key)
            else prefs[key] = json.encodeToString(lines)
        }
    }

    private suspend fun mutate(transform: (List<CartLine>) -> List<CartLine>) {
        context.cartDataStore.edit { prefs ->
            val current = prefs[key]?.let {
                runCatching { json.decodeFromString<List<CartLine>>(it) }.getOrDefault(emptyList())
            } ?: emptyList()
            prefs[key] = json.encodeToString(transform(current))
        }
    }
}
