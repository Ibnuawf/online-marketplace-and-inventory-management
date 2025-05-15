package com.marketplace.inventory

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.marketplace.inventory.BuildConfig
import com.marketplace.inventory.data.remote.ApiService
import com.marketplace.inventory.data.repository.Repository
import com.marketplace.inventory.ui.auth.LoginScreen
import com.marketplace.inventory.ui.auth.RegisterScreen
import com.marketplace.inventory.ui.products.AddProductScreen
import com.marketplace.inventory.ui.products.EditProductScreen
import com.marketplace.inventory.ui.products.ProductDetailScreen
import com.marketplace.inventory.ui.products.ProductListScreen
import com.marketplace.inventory.viewmodel.InventoryViewModel
import kotlinx.coroutines.delay
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class MainActivity : ComponentActivity() {

    private lateinit var apiService: ApiService
    private lateinit var repository: Repository
    private lateinit var viewModel: InventoryViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Retrofit and repository manually for the demo companion application
        val retrofit = Retrofit.Builder()
            .baseUrl(BuildConfig.API_URL) // Dynamic Base URL using BuildConfig
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit.create(ApiService::class.java)
        repository = Repository(apiService, this)
        viewModel = InventoryViewModel(repository)

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(viewModel)
                }
            }
        }
    }
}

@Composable
fun AppNavigation(viewModel: InventoryViewModel) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "splash") {
        
        // Splash Screen
        composable("splash") {
            SplashScreen {
                val token = viewModel.authToken.value
                if (token != null) {
                    navController.navigate("dashboard") {
                        popUpTo("splash") { inclusive = true }
                    }
                } else {
                    navController.navigate("login") {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            }
        }

        // Login Screen
        composable("login") {
            LoginScreen(
                viewModel = viewModel,
                onNavigateToRegister = { navController.navigate("register") },
                onLoginSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        // Register Screen
        composable("register") {
            RegisterScreen(
                viewModel = viewModel,
                onNavigateToLogin = { navController.navigate("login") },
                onRegisterSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("register") { inclusive = true }
                    }
                }
            )
        }

        // Product List Dashboard
        composable("dashboard") {
            ProductListScreen(
                viewModel = viewModel,
                onNavigateToAddProduct = { navController.navigate("add_product") },
                onNavigateToProductDetail = { id -> navController.navigate("product_detail/$id") },
                onNavigateToEditProduct = { id -> navController.navigate("edit_product/$id") },
                onLogout = {
                    viewModel.logout()
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }

        // Product Detail Screen
        composable(
            route = "product_detail/{productId}",
            arguments = listOf(navArgument("productId") { type = NavType.IntType })
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getInt("productId") ?: 0
            ProductDetailScreen(
                productId = id,
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Add Product Screen
        composable("add_product") {
            AddProductScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // Edit Product Screen
        composable(
            route = "edit_product/{productId}",
            arguments = listOf(navArgument("productId") { type = NavType.IntType })
        ) { backStackEntry ->
            val id = backStackEntry.arguments?.getInt("productId") ?: 0
            EditProductScreen(
                productId = id,
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}

@Composable
fun SplashScreen(onTimeout: () -> Unit) {
    LaunchedEffect(Unit) {
        delay(2000) // 2 seconds delay
        onTimeout()
    }
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
