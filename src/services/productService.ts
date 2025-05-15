import { db } from "../db/index.ts";
import { products, users } from "../db/schema.ts";
import { eq, and, ilike, desc, asc, sql, gt } from "drizzle-orm";

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  createdBy: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  imageUrl?: string;
}

export class ProductService {
  static async createProduct(input: CreateProductInput) {
    try {
      const [newProduct] = await db
        .insert(products)
        .values({
          name: input.name,
          description: input.description,
          price: input.price,
          quantity: input.quantity,
          imageUrl: input.imageUrl || null,
          createdBy: input.createdBy,
          version: 1,
        })
        .returning();

      return newProduct;
    } catch (error) {
      console.error("Error creating product:", error);
      throw new Error("Failed to create product. Database error.");
    }
  }

  static async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;
      const search = params.search || "";
      const sortBy = params.sortBy || "createdAt";
      const sortOrder = params.sortOrder || "desc";

      let conditions = [];
      if (search) {
        conditions.push(ilike(products.name, `%${search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Determine sorting
      let orderByClause = desc(products.createdAt);
      if (sortBy === "price") {
        orderByClause = sortOrder === "asc" ? asc(products.price) : desc(products.price);
      } else if (sortBy === "name") {
        orderByClause = sortOrder === "asc" ? asc(products.name) : desc(products.name);
      } else if (sortBy === "quantity") {
        orderByClause = sortOrder === "asc" ? asc(products.quantity) : desc(products.quantity);
      } else if (sortBy === "createdAt") {
        orderByClause = sortOrder === "asc" ? asc(products.createdAt) : desc(products.createdAt);
      }

      // Execute queries
      const items = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          quantity: products.quantity,
          imageUrl: products.imageUrl,
          createdBy: products.createdBy,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          version: products.version,
          creatorName: users.name,
        })
        .from(products)
        .innerJoin(users, eq(products.createdBy, users.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(whereClause);

      const totalItems = countResult?.count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      return {
        products: items,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products.");
    }
  }

  static async getProductById(id: number) {
    try {
      const [product] = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          quantity: products.quantity,
          imageUrl: products.imageUrl,
          createdBy: products.createdBy,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          version: products.version,
          creatorName: users.name,
        })
        .from(products)
        .innerJoin(users, eq(products.createdBy, users.id))
        .where(eq(products.id, id));

      if (!product) {
        throw new Error("Product not found.");
      }

      return product;
    } catch (error: any) {
      console.error("Error fetching single product:", error);
      throw new Error(error.message || "Failed to retrieve product.");
    }
  }

  static async updateProduct(id: number, userId: number, input: UpdateProductInput) {
    try {
      // Find current product to check ownership & version
      const [current] = await db.select().from(products).where(eq(products.id, id));
      if (!current) {
        throw new Error("Product not found.");
      }

      // Check ownership
      if (current.createdBy !== userId) {
        throw new Error("Unauthorized: You can only edit your own products.");
      }

      // Update product & increment version
      const [updatedProduct] = await db
        .update(products)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.description ? { description: input.description } : {}),
          ...(input.price !== undefined ? { price: input.price } : {}),
          ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
          version: current.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      return updatedProduct;
    } catch (error: any) {
      console.error("Error updating product:", error);
      throw new Error(error.message || "Failed to update product.");
    }
  }

  static async deleteProduct(id: number, userId: number) {
    try {
      // Find current product to check ownership
      const [current] = await db.select().from(products).where(eq(products.id, id));
      if (!current) {
        throw new Error("Product not found.");
      }

      // Check ownership
      if (current.createdBy !== userId) {
        throw new Error("Unauthorized: You can only delete your own products.");
      }

      // Delete
      await db.delete(products).where(eq(products.id, id));
      return { success: true, message: "Product deleted successfully." };
    } catch (error: any) {
      console.error("Error deleting product:", error);
      throw new Error(error.message || "Failed to delete product.");
    }
  }

  static async getChangedProducts(dateLimit: Date) {
    try {
      const items = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          quantity: products.quantity,
          imageUrl: products.imageUrl,
          createdBy: products.createdBy,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          version: products.version,
        })
        .from(products)
        .where(gt(products.updatedAt, dateLimit));

      return items;
    } catch (error) {
      console.error("Error fetching changed products for sync:", error);
      throw new Error("Failed to fetch changed products.");
    }
  }

  static async syncProducts(userId: number, changes: any[]) {
    const updated: number[] = [];
    const conflicts: any[] = [];

    for (const change of changes) {
      const productId = Number(change.id);
      if (isNaN(productId)) {
        conflicts.push({
          id: change.id,
          error: "Invalid product ID format."
        });
        continue;
      }

      try {
        const [serverProduct] = await db.select().from(products).where(eq(products.id, productId));

        if (!serverProduct) {
          if (change.operation === "DELETE") {
            updated.push(productId);
            continue;
          }

          // Insert as a new product
          const [newProduct] = await db
            .insert(products)
            .values({
              id: productId,
              name: change.name || "Unnamed Product",
              description: change.description || "No description provided",
              price: change.price !== undefined ? Number(change.price) : 0,
              quantity: change.quantity !== undefined ? Math.floor(Number(change.quantity)) : 0,
              imageUrl: change.imageUrl || null,
              createdBy: userId,
              version: change.version !== undefined ? Math.max(1, change.version) : 1,
              updatedAt: new Date(),
            })
            .returning();

          // Force reset the sequence so we don't duplicate keys on standard UI inserts
          await db.execute(sql`SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1), true)`);

          updated.push(newProduct.id);
          continue;
        }

        // Product exists
        const clientVersion = change.version !== undefined ? Number(change.version) : 0;
        const serverVersion = serverProduct.version;

        if (clientVersion === serverVersion) {
          if (change.operation === "DELETE") {
            await db.delete(products).where(eq(products.id, productId));
            updated.push(productId);
          } else {
            const nextVersion = serverVersion + 1;
            await db
              .update(products)
              .set({
                name: change.name !== undefined ? change.name : serverProduct.name,
                description: change.description !== undefined ? change.description : serverProduct.description,
                price: change.price !== undefined ? Number(change.price) : serverProduct.price,
                quantity: change.quantity !== undefined ? Math.floor(Number(change.quantity)) : serverProduct.quantity,
                imageUrl: change.imageUrl !== undefined ? change.imageUrl : serverProduct.imageUrl,
                version: nextVersion,
                updatedAt: new Date(),
              })
              .where(eq(products.id, productId));

            updated.push(productId);
          }
        } else if (clientVersion < serverVersion) {
          conflicts.push({
            id: productId,
            clientVersion,
            serverVersion,
            serverProduct: {
              id: serverProduct.id,
              name: serverProduct.name,
              description: serverProduct.description,
              price: serverProduct.price,
              quantity: serverProduct.quantity,
              imageUrl: serverProduct.imageUrl,
              version: serverProduct.version,
              updatedAt: serverProduct.updatedAt,
            }
          });
        } else {
          // clientVersion > serverVersion: update and fast forward
          const nextVersion = clientVersion + 1;
          await db
            .update(products)
            .set({
              name: change.name !== undefined ? change.name : serverProduct.name,
              description: change.description !== undefined ? change.description : serverProduct.description,
              price: change.price !== undefined ? Number(change.price) : serverProduct.price,
              quantity: change.quantity !== undefined ? Math.floor(Number(change.quantity)) : serverProduct.quantity,
              imageUrl: change.imageUrl !== undefined ? change.imageUrl : serverProduct.imageUrl,
              version: nextVersion,
              updatedAt: new Date(),
            })
            .where(eq(products.id, productId));

          updated.push(productId);
        }
      } catch (err: any) {
        console.error(`Error syncing product ID ${productId}:`, err);
        conflicts.push({
          id: productId,
          error: err.message || "Database error during product sync."
        });
      }
    }

    return {
      success: conflicts.length === 0,
      updated,
      conflicts,
    };
  }
}
