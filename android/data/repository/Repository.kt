package com.marketplace.inventory.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.marketplace.inventory.data.remote.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import retrofit2.Response

class Repository(private val apiService: ApiService, context: Context? = null) {

    private val sharedPrefs: SharedPreferences? = context?.getSharedPreferences("InvenSyncPrefs", Context.MODE_PRIVATE)

    private val _authToken = MutableStateFlow<String?>(sharedPrefs?.getString("auth_token", null))
    val authToken: StateFlow<String?> = _authToken.asStateFlow()

    private val _currentUser = MutableStateFlow<UserDto?>(null)
    val currentUser: StateFlow<UserDto?> = _currentUser.asStateFlow()

    fun setToken(token: String?) {
        _authToken.value = token
        sharedPrefs?.edit()?.apply {
            if (token != null) {
                putString("auth_token", token)
            } else {
                remove("auth_token")
            }
            apply()
        }
    }

    fun setUser(user: UserDto?) {
        _currentUser.value = user
    }

    private fun getBearerToken(): String {
        val token = _authToken.value ?: ""
        return if (token.startsWith("Bearer ")) token else "Bearer $token"
    }

    suspend fun register(request: RegisterRequest): Result<AuthResponse> {
        return safeApiCall { apiService.register(request) }.onSuccess {
            setToken(it.token)
            setUser(it.user)
        }
    }

    suspend fun login(request: LoginRequest): Result<AuthResponse> {
        return safeApiCall { apiService.login(request) }.onSuccess {
            setToken(it.token)
            setUser(it.user)
        }
    }

    suspend fun getProfile(): Result<UserDto> {
        val token = getBearerToken()
        return safeApiCall { apiService.getProfile(token) }.onSuccess {
            setUser(it)
        }
    }

    suspend fun updateProfile(name: String, profileImage: String?): Result<UserDto> {
        val token = getBearerToken()
        val request = ProfileUpdateRequest(name, profileImage)
        return safeApiCall { apiService.updateProfile(token, request) }.onSuccess {
            setUser(it)
        }
    }

    suspend fun createProduct(request: ProductCreateRequest): Result<ProductDto> {
        val token = getBearerToken()
        return safeApiCall { apiService.createProduct(token, request) }
    }

    suspend fun getProducts(
        page: Int? = null,
        limit: Int? = null,
        search: String? = null,
        sortBy: String? = null,
        sortOrder: String? = null
    ): Result<ProductListResponse> {
        val token = getBearerToken()
        return safeApiCall {
            apiService.getProducts(token, page, limit, search, sortBy, sortOrder)
        }
    }

    suspend fun getProductById(id: Int): Result<ProductDto> {
        val token = getBearerToken()
        return safeApiCall { apiService.getProductById(token, id) }
    }

    suspend fun updateProduct(id: Int, request: ProductUpdateRequest): Result<ProductDto> {
        val token = getBearerToken()
        return safeApiCall { apiService.updateProduct(token, id, request) }
    }

    suspend fun deleteProduct(id: Int): Result<DeleteResponse> {
        val token = getBearerToken()
        return safeApiCall { apiService.deleteProduct(token, id) }
    }

    fun logout() {
        setToken(null)
        setUser(null)
    }

    private suspend fun <T> safeApiCall(call: suspend () -> Response<T>): Result<T> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    Result.success(body)
                } else {
                    Result.failure(Exception("Response body is empty"))
                }
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Unknown error"
                Result.failure(Exception("API Error ${response.code()}: $errorMsg"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
