package com.marketplace.inventory.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.marketplace.inventory.data.remote.*
import com.marketplace.inventory.data.repository.Repository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class InventoryViewModel(private val repository: Repository) : ViewModel() {

    // Auth States
    val currentUser: StateFlow<UserDto?> = repository.currentUser
    val authToken: StateFlow<String?> = repository.authToken

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    // Product List States
    private val _productListState = MutableStateFlow<ProductListState>(ProductListState.Idle)
    val productListState: StateFlow<ProductListState> = _productListState.asStateFlow()

    // Single Product Detail States
    private val _productDetailState = MutableStateFlow<ProductDetailState>(ProductDetailState.Idle)
    val productDetailState: StateFlow<ProductDetailState> = _productDetailState.asStateFlow()

    // Product Creation/Edition States
    private val _productActionState = MutableStateFlow<ProductActionState>(ProductActionState.Idle)
    val productActionState: StateFlow<ProductActionState> = _productActionState.asStateFlow()

    // Search and Sort options
    val searchQuery = MutableStateFlow("")
    val sortBy = MutableStateFlow("createdAt")
    val sortOrder = MutableStateFlow("desc")
    val currentPage = MutableStateFlow(1)

    init {
        // Automatically fetch products when search or sort options change
        viewModelScope.launch {
            searchQuery.collect { if (authToken.value != null) loadProducts() }
        }
    }

    // AUTH METHODS
    fun register(name: String, email: String, password: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val request = RegisterRequest(name, email, password)
            repository.register(request)
                .onSuccess {
                    _authState.value = AuthState.Success(it.user)
                }
                .onFailure {
                    _authState.value = AuthState.Error(it.message ?: "Registration failed")
                }
        }
    }

    fun login(email: String, password: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            val request = LoginRequest(email, password)
            repository.login(request)
                .onSuccess {
                    _authState.value = AuthState.Success(it.user)
                }
                .onFailure {
                    _authState.value = AuthState.Error(it.message ?: "Login failed")
                }
        }
    }

    fun logout() {
        repository.logout()
        _authState.value = AuthState.Idle
        _productListState.value = ProductListState.Idle
    }

    fun updateProfile(name: String, profileImage: String?) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            repository.updateProfile(name, profileImage)
                .onSuccess {
                    _authState.value = AuthState.Success(it)
                }
                .onFailure {
                    _authState.value = AuthState.Error(it.message ?: "Failed to update profile")
                }
        }
    }

    // PRODUCT METHODS
    fun loadProducts(resetPage: Boolean = false) {
        if (resetPage) {
            currentPage.value = 1
        }
        _productListState.value = ProductListState.Loading
        viewModelScope.launch {
            repository.getProducts(
                page = currentPage.value,
                limit = 10,
                search = searchQuery.value.ifEmpty { null },
                sortBy = sortBy.value,
                sortOrder = sortOrder.value
            ).onSuccess {
                _productListState.value = ProductListState.Success(it.products, it.pagination)
            }.onFailure {
                _productListState.value = ProductListState.Error(it.message ?: "Failed to load products")
            }
        }
    }

    fun loadProductDetail(id: Int) {
        _productDetailState.value = ProductDetailState.Loading
        viewModelScope.launch {
            repository.getProductById(id)
                .onSuccess {
                    _productDetailState.value = ProductDetailState.Success(it)
                }
                .onFailure {
                    _productDetailState.value = ProductDetailState.Error(it.message ?: "Failed to load product details")
                }
        }
    }

    fun createProduct(name: String, description: String, price: Double, quantity: Int, imageUrl: String?) {
        _productActionState.value = ProductActionState.Loading
        viewModelScope.launch {
            val request = ProductCreateRequest(name, description, price, quantity, imageUrl)
            repository.createProduct(request)
                .onSuccess {
                    _productActionState.value = ProductActionState.Success(it)
                    loadProducts(resetPage = true)
                }
                .onFailure {
                    _productActionState.value = ProductActionState.Error(it.message ?: "Failed to create product")
                }
        }
    }

    fun updateProduct(id: Int, name: String, description: String, price: Double, quantity: Int, imageUrl: String?) {
        _productActionState.value = ProductActionState.Loading
        viewModelScope.launch {
            val request = ProductUpdateRequest(name, description, price, quantity, imageUrl)
            repository.updateProduct(id, request)
                .onSuccess {
                    _productActionState.value = ProductActionState.Success(it)
                    loadProducts()
                }
                .onFailure {
                    _productActionState.value = ProductActionState.Error(it.message ?: "Failed to update product")
                }
        }
    }

    fun deleteProduct(id: Int) {
        viewModelScope.launch {
            repository.deleteProduct(id)
                .onSuccess {
                    loadProducts()
                }
                .onFailure {
                    _productListState.value = ProductListState.Error(it.message ?: "Failed to delete product")
                }
        }
    }

    fun clearProductActionState() {
        _productActionState.value = ProductActionState.Idle
    }
}

// State Wrappers
sealed interface AuthState {
    object Idle : AuthState
    object Loading : AuthState
    data class Success(val user: UserDto) : AuthState
    data class Error(val message: String) : AuthState
}

sealed interface ProductListState {
    object Idle : ProductListState
    object Loading : ProductListState
    data class Success(val products: List<ProductDto>, val pagination: PaginationDto) : ProductListState
    data class Error(val message: String) : ProductListState
}

sealed interface ProductDetailState {
    object Idle : ProductDetailState
    object Loading : ProductDetailState
    data class Success(val product: ProductDto) : ProductDetailState
    data class Error(val message: String) : ProductDetailState
}

sealed interface ProductActionState {
    object Idle : ProductActionState
    object Loading : ProductActionState
    data class Success(val product: ProductDto) : ProductActionState
    data class Error(val message: String) : ProductActionState
}
