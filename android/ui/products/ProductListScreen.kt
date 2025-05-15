package com.marketplace.inventory.ui.products

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.marketplace.inventory.data.remote.ProductDto
import com.marketplace.inventory.viewmodel.InventoryViewModel
import com.marketplace.inventory.viewmodel.ProductListState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductListScreen(
    viewModel: InventoryViewModel,
    onNavigateToAddProduct: () -> Unit,
    onNavigateToProductDetail: (id: Int) -> Unit,
    onNavigateToEditProduct: (id: Int) -> Unit,
    onLogout: () -> Unit
) {
    val listState by viewModel.productListState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val sortBy by viewModel.sortBy.collectAsState()
    val sortOrder by viewModel.sortOrder.collectAsState()
    val currentPage by viewModel.currentPage.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    var showSortMenu by remember { mutableStateOf(false) }
    var productToDelete by remember { mutableStateOf<ProductDto?>(null) }

    // Load initial products
    LaunchedEffect(Unit) {
        viewModel.loadProducts()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inventory Dashboard", style = MaterialTheme.typography.titleLarge) },
                actions = {
                    IconButton(onClick = { showSortMenu = true }) {
                        Icon(Icons.Default.List, contentDescription = "Sort Menu")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Log Out")
                    }

                    DropdownMenu(
                        expanded = showSortMenu,
                        onDismissRequest = { showSortMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Sort by Date (Newest)") },
                            onClick = {
                                viewModel.sortBy.value = "createdAt"
                                viewModel.sortOrder.value = "desc"
                                viewModel.loadProducts(resetPage = true)
                                showSortMenu = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Sort by Date (Oldest)") },
                            onClick = {
                                viewModel.sortBy.value = "createdAt"
                                viewModel.sortOrder.value = "asc"
                                viewModel.loadProducts(resetPage = true)
                                showSortMenu = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Price: Low to High") },
                            onClick = {
                                viewModel.sortBy.value = "price"
                                viewModel.sortOrder.value = "asc"
                                viewModel.loadProducts(resetPage = true)
                                showSortMenu = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Price: High to Low") },
                            onClick = {
                                viewModel.sortBy.value = "price"
                                viewModel.sortOrder.value = "desc"
                                viewModel.loadProducts(resetPage = true)
                                showSortMenu = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Quantity: Low to High") },
                            onClick = {
                                viewModel.sortBy.value = "quantity"
                                viewModel.sortOrder.value = "asc"
                                viewModel.loadProducts(resetPage = true)
                                showSortMenu = false
                            }
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToAddProduct) {
                Icon(Icons.Default.Add, contentDescription = "Add Product")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = {
                    viewModel.searchQuery.value = it
                    viewModel.currentPage.value = 1
                },
                placeholder = { Text("Search products...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search Icon") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            // Dynamic States (Loading, Error, Success, Empty)
            when (val state = listState) {
                is ProductListState.Loading -> {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is ProductListState.Error -> {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(state.message, color = MaterialTheme.colorScheme.error)
                            Button(onClick = { viewModel.loadProducts() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                is ProductListState.Success -> {
                    if (state.products.isEmpty()) {
                        Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                            Text("No products found.", style = MaterialTheme.typography.bodyLarge)
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(state.products) { product ->
                                ProductCard(
                                    product = product,
                                    currentUserId = currentUser?.id ?: 0,
                                    onTap = { onNavigateToProductDetail(product.id) },
                                    onEdit = { onNavigateToEditProduct(product.id) },
                                    onDelete = { productToDelete = product }
                                )
                            }
                        }

                        // Pagination controls
                        val pagination = state.pagination
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Page $currentPage of ${pagination.totalPages}", style = MaterialTheme.typography.bodyMedium)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = {
                                        if (currentPage > 1) {
                                            viewModel.currentPage.value = currentPage - 1
                                            viewModel.loadProducts()
                                        }
                                    },
                                    enabled = currentPage > 1
                                ) {
                                    Text("Prev")
                                }
                                Button(
                                    onClick = {
                                        if (currentPage < pagination.totalPages) {
                                            viewModel.currentPage.value = currentPage + 1
                                            viewModel.loadProducts()
                                        }
                                    },
                                    enabled = currentPage < pagination.totalPages
                                ) {
                                    Text("Next")
                                }
                            }
                        }
                    }
                }
                else -> {}
            }
        }
    }

    // Deletion Confirmation Dialog
    productToDelete?.let { product ->
        AlertDialog(
            onDismissRequest = { productToDelete = null },
            title = { Text("Confirm Deletion") },
            text = { Text("Are you sure you want to delete ${product.name}? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteProduct(product.id)
                        productToDelete = null
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { productToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ProductCard(
    product: ProductDto,
    currentUserId: Int,
    onTap: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onTap),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(product.name, style = MaterialTheme.typography.titleMedium)
                Text(product.description, style = MaterialTheme.typography.bodySmall, maxLines = 1)
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("Price: $${product.price}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                    Text("Qty: ${product.quantity}", style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text("Version: ${product.version} | Seller: ${product.creatorName ?: "Owner"}", style = MaterialTheme.typography.labelSmall)
            }

            // Show owner actions if current user is the creator
            if (product.createdBy == currentUserId) {
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onEdit) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Product", tint = MaterialTheme.colorScheme.secondary)
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete Product", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}
