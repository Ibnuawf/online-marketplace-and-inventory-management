import { integer, pgTable, serial, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define the 'users' table.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").unique(), // Optional Firebase Auth UID (for dual auth support)
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Nullable for Google Auth users
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define the 'products' table with a foreign key to 'users'.
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  quantity: integer("quantity").notNull(),
  imageUrl: text("image_url"),
  createdBy: integer("created_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
});

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
}));

// Define relationships for the 'products' table.
export const productsRelations = relations(products, ({ one }) => ({
  creator: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
}));
