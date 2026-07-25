package cl.tufarmacia.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Product(
    val id: String,
    val name: String,
    val slug: String,
    val description: String? = null,
    val price: String,
    val stock: Int = 0,
    @SerialName("category_id") val categoryId: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    val active: Boolean = true,
    val laboratory: String? = null,
    @SerialName("active_ingredient") val activeIngredient: String? = null,
    @SerialName("therapeutic_action") val therapeuticAction: String? = null,
    @SerialName("prescription_type") val prescriptionType: String? = null,
    val presentation: String? = null,
    @SerialName("discount_percent") val discountPercent: Int? = null,
    @SerialName("category_name") val categoryName: String? = null,
    @SerialName("category_slug") val categorySlug: String? = null,
) {
    fun unitPrice(): Double {
        val raw = price.toDoubleOrNull() ?: 0.0
        val disc = discountPercent
        return if (disc != null && disc > 0) kotlin.math.ceil(raw * (1 - disc / 100.0)) else raw
    }
}

@Serializable
data class PaginatedProducts(
    val products: List<Product> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
    @SerialName("total_pages") val totalPages: Int = 0,
)

@Serializable
data class Category(
    val id: String,
    val name: String,
    val slug: String,
    val description: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    val active: Boolean = true,
)

@Serializable
data class AuthUser(
    val uid: String,
    val email: String? = null,
    val name: String? = null,
    val role: String = "user",
    @SerialName("is_admin") val isAdmin: Boolean = false,
)

@Serializable
data class MeResponse(
    val user: AuthUser,
)

@Serializable
data class ApiError(
    val error: String? = null,
    val code: String? = null,
    val detail: String? = null,
)

@Serializable
data class FirebaseSignInResponse(
    val idToken: String? = null,
    val refreshToken: String? = null,
    val expiresIn: String? = null,
    val localId: String? = null,
    val email: String? = null,
    val displayName: String? = null,
    val error: FirebaseErrorBody? = null,
)

@Serializable
data class FirebaseErrorBody(
    val message: String? = null,
    val code: Int? = null,
)

@Serializable
data class FirebaseRefreshResponse(
    @SerialName("id_token") val idToken: String? = null,
    @SerialName("refresh_token") val refreshToken: String? = null,
    @SerialName("expires_in") val expiresIn: String? = null,
    @SerialName("user_id") val userId: String? = null,
    val error: FirebaseErrorBody? = null,
)

data class SessionTokens(
    val idToken: String,
    val refreshToken: String,
    val userId: String,
    val email: String?,
)

@Serializable
data class CartLine(
    val productId: String,
    val productName: String,
    val productSlug: String,
    val imageUrl: String? = null,
    val unitPrice: Double,
    val quantity: Int,
) {
    val lineTotal: Double get() = unitPrice * quantity
}

@Serializable
data class OrderItemDto(
    val id: String? = null,
    @SerialName("order_id") val orderId: String? = null,
    @SerialName("product_id") val productId: String? = null,
    @SerialName("product_name") val productName: String,
    val quantity: Int,
    @SerialName("price_at_purchase") val priceAtPurchase: String,
)

@Serializable
data class OrderDto(
    val id: String,
    @SerialName("user_id") val userId: String? = null,
    val status: String,
    val total: String,
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("payment_provider") val paymentProvider: String? = null,
    @SerialName("pickup_code") val pickupCode: String? = null,
    @SerialName("reservation_expires_at") val reservationExpiresAt: String? = null,
    @SerialName("customer_phone") val customerPhone: String? = null,
    @SerialName("guest_name") val guestName: String? = null,
    @SerialName("guest_surname") val guestSurname: String? = null,
    @SerialName("guest_email") val guestEmail: String? = null,
    /** Customer orders API uses `items`. */
    val items: List<OrderItemDto> = emptyList(),
    /** Admin orders API uses `order_items`. */
    @SerialName("order_items") val orderItems: List<OrderItemDto> = emptyList(),
) {
    val lineItems: List<OrderItemDto> get() = if (items.isNotEmpty()) items else orderItems
}

@Serializable
data class PaginatedOrders(
    val orders: List<OrderDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 10,
    @SerialName("total_pages") val totalPages: Int = 0,
)

@Serializable
data class StorePickupRequest(
    val items: List<StorePickupItem>,
    val name: String,
    val surname: String,
    val email: String? = null,
    val phone: String,
    val notes: String? = null,
    @SerialName("session_id") val sessionId: String,
    @SerialName("use_points") val usePoints: Boolean = false,
)

@Serializable
data class StorePickupItem(
    @SerialName("product_id") val productId: String,
    val quantity: Int,
)

@Serializable
data class StorePickupResponse(
    @SerialName("order_id") val orderId: String,
    @SerialName("pickup_code") val pickupCode: String,
    @SerialName("tracking_token") val trackingToken: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
    val total: String,
    @SerialName("points_redeemed") val pointsRedeemed: Int? = null,
)

@Serializable
data class SuggestResponse(
    val q: String? = null,
    val products: List<Product> = emptyList(),
)

@Serializable
data class TopSeller(
    val id: String,
    val name: String,
    val slug: String,
    val price: String,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("discount_percent") val discountPercent: Int? = null,
    val stock: Int = 0,
    @SerialName("units_sold") val unitsSold: Int = 0,
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val surname: String? = null,
    val phone: String? = null,
)

@Serializable
data class RegisterResponse(
    val success: Boolean = false,
    @SerialName("user_id") val userId: String? = null,
    val error: String? = null,
)

@Serializable
data class LoyaltyResponse(
    val points: Int = 0,
    @SerialName("points_value") val pointsValue: Int = 0,
    val transactions: List<LoyaltyTx> = emptyList(),
)

@Serializable
data class LoyaltyTx(
    val id: String,
    val points: Int,
    val reason: String? = null,
    @SerialName("order_id") val orderId: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class WebpayCreateResponse(
    val url: String,
    val token: String,
    @SerialName("order_id") val orderId: String? = null,
)

@Serializable
data class TrackingResponse(
    val id: String,
    val status: String,
    val total: String,
    @SerialName("payment_provider") val paymentProvider: String? = null,
    @SerialName("pickup_code") val pickupCode: String? = null,
    @SerialName("reservation_expires_at") val reservationExpiresAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("customer_name") val customerName: String? = null,
    val items: List<OrderItemDto> = emptyList(),
)
