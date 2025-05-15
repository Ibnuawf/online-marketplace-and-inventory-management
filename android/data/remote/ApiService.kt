package com.marketplace.inventory.data.remote

import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/auth/register")
    suspend fun register(
        @Body request: RegisterRequest
    ): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<AuthResponse>

    @GET("api/auth/profile")
    suspend fun getProfile(
        @Header("Authorization") token: String
    ): Response<UserDto>

    @PUT("api/auth/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: ProfileUpdateRequest
    ): Response<UserDto>

    @POST("api/products")
    suspend fun createProduct(
        @Header("Authorization") token: String,
        @Body request: ProductCreateRequest
    ): Response<ProductDto>

    @GET("api/products")
    suspend fun getProducts(
        @Header("Authorization") token: String,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null,
        @Query("search") search: String? = null,
        @Query("sortBy") sortBy: String? = null,
        @Query("sortOrder") sortOrder: String? = null
    ): Response<ProductListResponse>

    @GET("api/products/{id}")
    suspend fun getProductById(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<ProductDto>

    @PUT("api/products/{id}")
    suspend fun updateProduct(
        @Header("Authorization") token: String,
        @Path("id") id: Int,
        @Body request: ProductUpdateRequest
    ): Response<ProductDto>

    @DELETE("api/products/{id}")
    suspend fun deleteProduct(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<DeleteResponse>
}
