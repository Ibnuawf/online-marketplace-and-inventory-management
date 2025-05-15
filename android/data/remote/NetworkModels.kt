package com.marketplace.inventory.data.remote

import com.google.gson.annotations.SerializedName

// Authentication Payloads & Responses
data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val user: UserDto,
    val token: String
)

data class UserDto(
    val id: Int,
    val name: String,
    val email: String,
    @SerializedName("profile_image") val profileImage: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

data class ProfileUpdateRequest(
    val name: String,
    @SerializedName("profile_image") val profileImage: String?
)

// Product Payloads & Responses
data class ProductDto(
    val id: Int,
    val name: String,
    val description: String,
    val price: Double,
    val quantity: Int,
    @SerializedName("image_url") val imageUrl: String?,
    @SerializedName("created_by") val createdBy: Int,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String,
    val version: Int,
    @SerializedName("creatorName") val creatorName: String?
)

data class ProductCreateRequest(
    val name: String,
    val description: String,
    val price: Double,
    val quantity: Int,
    @SerializedName("image_url") val imageUrl: String?
)

data class ProductUpdateRequest(
    val name: String,
    val description: String,
    val price: Double,
    val quantity: Int,
    @SerializedName("image_url") val imageUrl: String?
)

data class ProductListResponse(
    val products: List<ProductDto>,
    val pagination: PaginationDto
)

data class PaginationDto(
    val page: Int,
    val limit: Int,
    val totalItems: Int,
    val totalPages: Int
)

data class DeleteResponse(
    val success: Boolean,
    val message: String
)
