package cl.tufarmacia.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import cl.tufarmacia.app.data.AppContainer
import cl.tufarmacia.shared.api.ApiException
import cl.tufarmacia.shared.model.AuthUser
import cl.tufarmacia.shared.model.Product
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AppUiState(
    val bootstrapped: Boolean = false,
    val user: AuthUser? = null,
    val loginLoading: Boolean = false,
    val loginError: String? = null,
    val products: List<Product> = emptyList(),
    val productsLoading: Boolean = false,
    val productsError: String? = null,
    val productsTotal: Int = 0,
    val searchQuery: String = "",
)

class AppViewModel(private val container: AppContainer) : ViewModel() {
    private val _state = MutableStateFlow(AppUiState())
    val state: StateFlow<AppUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val user = runCatching { container.sessionRepository.restore() }.getOrNull()
            _state.update { it.copy(bootstrapped = true, user = user) }
            loadProducts()
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _state.update { it.copy(loginLoading = true, loginError = null) }
            try {
                val user = container.sessionRepository.login(email, password)
                _state.update { it.copy(loginLoading = false, user = user, loginError = null) }
            } catch (e: Exception) {
                val msg = (e as? ApiException)?.message ?: e.message ?: "Error al iniciar sesión"
                _state.update { it.copy(loginLoading = false, loginError = msg) }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            container.sessionRepository.logout()
            _state.update { it.copy(user = null) }
        }
    }

    fun onSearchChange(q: String) {
        _state.update { it.copy(searchQuery = q) }
    }

    fun loadProducts(search: String? = _state.value.searchQuery.ifBlank { null }) {
        viewModelScope.launch {
            _state.update { it.copy(productsLoading = true, productsError = null) }
            try {
                val page = container.api.listProducts(page = 1, limit = 30, search = search)
                _state.update {
                    it.copy(
                        productsLoading = false,
                        products = page.products,
                        productsTotal = page.total,
                    )
                }
            } catch (e: Exception) {
                _state.update {
                    it.copy(
                        productsLoading = false,
                        productsError = e.message ?: "No se pudo cargar el catálogo",
                    )
                }
            }
        }
    }

    companion object {
        fun factory(container: AppContainer): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return AppViewModel(container) as T
                }
            }
    }
}
