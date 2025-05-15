import { Response } from "express";
import { ProductService } from "../services/productService.ts";
import { AuthenticatedRequest } from "../middleware/auth.ts";

export class ProductController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const { name, description, price, quantity, image_url } = req.body;

      if (!name || !description || price === undefined || quantity === undefined) {
        return res.status(400).json({ error: "Name, description, price, and quantity are required." });
      }

      const numPrice = Number(price);
      const numQuantity = Number(quantity);

      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: "Price must be a valid positive number." });
      }

      if (isNaN(numQuantity) || numQuantity < 0) {
        return res.status(400).json({ error: "Quantity must be a valid positive integer." });
      }

      const newProduct = await ProductService.createProduct({
        name,
        description,
        price: numPrice,
        quantity: Math.floor(numQuantity),
        imageUrl: image_url,
        createdBy: req.user.id,
      });

      return res.status(201).json(newProduct);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to create product." });
    }
  }

  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const sortBy = req.query.sortBy ? String(req.query.sortBy) : undefined;
      const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

      const result = await ProductService.getProducts({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to retrieve products." });
    }
  }

  static async getSingle(req: AuthenticatedRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
      }

      const product = await ProductService.getProductById(id);
      return res.status(200).json(product);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Product not found." });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
      }

      const { name, description, price, quantity, image_url } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (image_url !== undefined) updateData.imageUrl = image_url;

      if (price !== undefined) {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) {
          return res.status(400).json({ error: "Price must be a valid positive number." });
        }
        updateData.price = numPrice;
      }

      if (quantity !== undefined) {
        const numQuantity = Number(quantity);
        if (isNaN(numQuantity) || numQuantity < 0) {
          return res.status(400).json({ error: "Quantity must be a valid positive integer." });
        }
        updateData.quantity = Math.floor(numQuantity);
      }

      const updated = await ProductService.updateProduct(id, req.user.id, updateData);
      return res.status(200).json(updated);
    } catch (error: any) {
      const statusCode = error.message.includes("Unauthorized") ? 403 : 400;
      return res.status(statusCode).json({ error: error.message || "Failed to update product." });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID." });
      }

      const result = await ProductService.deleteProduct(id, req.user.id);
      return res.status(200).json(result);
    } catch (error: any) {
      const statusCode = error.message.includes("Unauthorized") ? 403 : 400;
      return res.status(statusCode).json({ error: error.message || "Failed to delete product." });
    }
  }

  static async sync(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const { changes } = req.body;
      if (!changes || !Array.isArray(changes)) {
        return res.status(400).json({ error: "Changes array is required." });
      }

      const result = await ProductService.syncProducts(req.user.id, changes);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Sync failed." });
    }
  }

  static async syncGet(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const lastSyncTime = req.query.lastSyncTime;
      let dateLimit = new Date(0); // 1970-01-01
      if (lastSyncTime) {
        const parsedNum = Number(lastSyncTime);
        if (!isNaN(parsedNum)) {
          dateLimit = new Date(parsedNum);
        } else {
          const parsedDate = new Date(String(lastSyncTime));
          if (!isNaN(parsedDate.getTime())) {
            dateLimit = parsedDate;
          }
        }
      }

      const result = await ProductService.getChangedProducts(dateLimit);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to retrieve sync data." });
    }
  }
}
