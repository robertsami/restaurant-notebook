import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Not required for Firebase auth
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  firebaseUid: text("firebase_uid").unique(), // Firebase user ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Friends relationship
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Restaurant list schema
export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// List owners/collaborators
export const listCollaborators = pgTable("list_collaborators", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  userId: integer("user_id").notNull(),
  isOwner: boolean("is_owner").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListCollaboratorSchema = createInsertSchema(listCollaborators).omit({
  id: true,
  createdAt: true,
});

// Restaurant schema
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  placeId: text("place_id").notNull().unique(),
  address: text("address"),
  cuisine: text("cuisine"),
  priceLevel: text("price_level"),
  rating: text("rating"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

// Restaurant in List schema
export const restaurantsInLists = pgTable("restaurants_in_lists", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  restaurantId: integer("restaurant_id").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRestaurantInListSchema = createInsertSchema(restaurantsInLists).omit({
  id: true,
  createdAt: true,
});

// Visit schema
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  summary: text("summary"),
  occasion: text("occasion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
});

// Visit collaborators
export const visitCollaborators = pgTable("visit_collaborators", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  userId: integer("user_id").notNull(),
  isOwner: boolean("is_owner").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVisitCollaboratorSchema = createInsertSchema(visitCollaborators).omit({
  id: true,
  createdAt: true,
});

// Note schema
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Photo schema
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  userId: integer("user_id").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

// Activity schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // e.g., "visit_added", "list_shared", "note_added", "ai_suggestion"
  data: jsonb("data").notNull(), // Contains relevant IDs and info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// AI Suggestion schema
export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  restaurantName: text("restaurant_name").notNull(),
  cuisine: text("cuisine"),
  rating: text("rating"),
  reason: text("reason").notNull(),
  basedOnRestaurantId: integer("based_on_restaurant_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  createdAt: true,
});

// Types for all schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type List = typeof lists.$inferSelect;
export type InsertList = z.infer<typeof insertListSchema>;

export type ListCollaborator = typeof listCollaborators.$inferSelect;
export type InsertListCollaborator = z.infer<typeof insertListCollaboratorSchema>;

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type RestaurantInList = typeof restaurantsInLists.$inferSelect;
export type InsertRestaurantInList = z.infer<typeof insertRestaurantInListSchema>;

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type VisitCollaborator = typeof visitCollaborators.$inferSelect;
export type InsertVisitCollaborator = z.infer<typeof insertVisitCollaboratorSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;

// Extended types for frontend
export type RestaurantWithLists = Restaurant & {
  lists: { listId: number; listTitle: string }[];
};

export type ListWithDetails = List & {
  collaborators: { userId: number; name: string; avatar?: string }[];
  restaurantCount: number;
};

export type VisitWithDetails = Visit & {
  notes: (Note & { user: { name: string; avatar?: string } })[];
  photos: Photo[];
  collaborators: { userId: number; name: string; avatar?: string }[];
};

export type ActivityWithDetails = Activity & {
  user: { name: string; avatar?: string };
};

export type FriendWithDetails = {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  status: string; // friendship status: pending, accepted, rejected
};
