package com.marketplace.inventory.ui.products

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.marketplace.inventory.viewmodel.InventoryViewModel
import com.marketplace.inventory.viewmodel.ProductActionState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddProductScreen(
    viewModel: InventoryViewModel,
    onNavigateBack: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priceStr by remember { mutableStateOf("") }
    var quantityStr by remember { mutableStateOf("") }
    var imageUrl by remember { mutableStateOf("") }

    var nameError by remember { mutableStateOf<String?>(null) }
    var descriptionError by remember { mutableStateOf<String?>(null) }
    var priceError by remember { mutableStateOf<String?>(null) }
    var quantityError by remember { mutableStateOf<String?>(null) }

    val actionState by viewModel.productActionState.collectAsState()

    LaunchedEffect(actionState) {
        if (actionState is ProductActionState.Success) {
            viewModel.clearProductActionState()
            onNavigateBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Product") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            contentAlignment = Alignment.TopCenter
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Name Field
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        nameError = if (it.isBlank()) "Product name required" else null
                    },
                    label = { Text("Product Name") },
                    isError = nameError != null,
                    supportingText = { nameError?.let { Text(it) } },
                    modifier = Modifier.fillMaxWidth()
                )

                // Description Field
                OutlinedTextField(
                    value = description,
                    onValueChange = {
                        description = it
                        descriptionError = if (it.isBlank()) "Description required" else null
                    },
                    label = { Text("Description") },
                    isError = descriptionError != null,
                    supportingText = { descriptionError?.let { Text(it) } },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Price Field
                    OutlinedTextField(
                        value = priceStr,
                        onValueChange = {
                            priceStr = it
                            val price = it.toDoubleOrNull()
                            priceError = if (price == null || price < 0) "Invalid price" else null
                        },
                        label = { Text("Price ($)") },
                        isError = priceError != null,
                        supportingText = { priceError?.let { Text(it) } },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )

                    // Quantity Field
                    OutlinedTextField(
                        value = quantityStr,
                        onValueChange = {
                            quantityStr = it
                            val qty = it.toIntOrNull()
                            quantityError = if (qty == null || qty < 0) "Invalid quantity" else null
                        },
                        label = { Text("Quantity") },
                        isError = quantityError != null,
                        supportingText = { quantityError?.let { Text(it) } },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Image URL
                OutlinedTextField(
                    value = imageUrl,
                    onValueChange = { imageUrl = it },
                    label = { Text("Image URL (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )

                if (actionState is ProductActionState.Error) {
                    Text(
                        text = (actionState as ProductActionState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        val isNameValid = name.isNotBlank()
                        val isDescValid = description.isNotBlank()
                        val price = priceStr.toDoubleOrNull()
                        val qty = quantityStr.toIntOrNull()

                        if (!isNameValid) nameError = "Product name required"
                        if (!isDescValid) descriptionError = "Description required"
                        if (price == null || price < 0) priceError = "Invalid price"
                        if (qty == null || qty < 0) quantityError = "Invalid quantity"

                        if (isNameValid && isDescValid && price != null && price >= 0 && qty != null && qty >= 0) {
                            viewModel.createProduct(name, description, price, qty, imageUrl.ifEmpty { null })
                        }
                    },
                    enabled = actionState !is ProductActionState.Loading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (actionState is ProductActionState.Loading) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                    } else {
                        Text("Add Product", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}
