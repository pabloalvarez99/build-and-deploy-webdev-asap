package cl.tufarmacia.shared.model

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
    @SerialName("discount_percent") val discountPercent: Int? = null,
    @SerialName("category_name") val categoryName: String? = null,
)

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
data class CategoriesResponse(
    val categories: List<Category> = emptyList(),
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
