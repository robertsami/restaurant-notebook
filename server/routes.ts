import type { Response, NextFunction } from "express";
import type { Request } from "express"; // This will use our extended Request interface
import express, { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertListSchema, insertRestaurantInListSchema, insertRestaurantSchema, insertVisitSchema, insertNoteSchema, insertPhotoSchema } from "@shared/schema";
import { summarizeNotes, suggestRestaurants } from "./openai";
import { getPlaceDetailsFromUrl, searchPlacesAutocomplete, fetchPlaceDetails } from "./places";
import multer from "multer";

// Extend Request from express to include file property
// No need to redefine the file property as it's already defined in @types/multer
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs";

// Setup file upload directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      cb(null, uploadsDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const extension = path.extname(file.originalname);
      cb(null, `${nanoid()}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Use isAuthenticated middleware imported from auth.ts
// This is now implemented in auth.ts and will check for Firebase token authentication

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Lists API
  app.get("/api/lists", isAuthenticated, async (req, res, next) => {
    try {
      const lists = await storage.getListsByUser(req.user!.id);
      res.json(lists);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/lists/shared", isAuthenticated, async (req, res, next) => {
    try {
      const lists = await storage.getSharedLists(req.user!.id);
      res.json(lists);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/lists/:id", isAuthenticated, async (req, res, next) => {
    try {
      const list = await storage.getListDetails(parseInt(req.params.id), req.user!.id);
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      res.json(list);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/lists", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertListSchema.parse(req.body);
      const list = await storage.createList(validatedData, req.user!.id);
      res.status(201).json(list);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/lists/:id", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertListSchema.parse(req.body);
      const updatedList = await storage.updateList(parseInt(req.params.id), validatedData, req.user!.id);
      if (!updatedList) {
        return res.status(404).json({ message: "List not found or unauthorized" });
      }
      res.json(updatedList);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/lists/:id", isAuthenticated, async (req, res, next) => {
    try {
      const success = await storage.deleteList(parseInt(req.params.id), req.user!.id);
      if (!success) {
        return res.status(404).json({ message: "List not found or unauthorized" });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/lists/:id/share", isAuthenticated, async (req, res, next) => {
    try {
      const { username, isOwner } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const success = await storage.shareList(parseInt(req.params.id), user.id, !!isOwner, req.user!.id);
      if (!success) {
        return res.status(404).json({ message: "List not found or unauthorized" });
      }
      
      // Create activity for sharing
      await storage.createActivity({
        userId: req.user!.id,
        type: "list_shared",
        data: { listId: parseInt(req.params.id), sharedWithId: user.id }
      });
      
      res.status(200).json({ message: "List shared successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Restaurants API
  app.get("/api/restaurants", isAuthenticated, async (req, res, next) => {
    try {
      const restaurants = await storage.getRestaurantsByUser(req.user!.id);
      res.json(restaurants);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/lists/:listId/restaurants", isAuthenticated, async (req, res, next) => {
    try {
      const listId = parseInt(req.params.listId);
      const restaurants = await storage.getRestaurantsByList(listId, req.user!.id);
      res.json(restaurants);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/restaurants/:id", isAuthenticated, async (req, res, next) => {
    try {
      const restaurant = await storage.getRestaurantDetails(parseInt(req.params.id), req.user!.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/restaurants", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      const restaurant = await storage.createOrGetRestaurant(validatedData);
      
      // Get the user's default list (assuming "My Restaurants" is the first list created for the user)
      const userLists = await storage.getListsByUser(req.user!.id);
      const defaultList = userLists.find(list => list.title === "My Restaurants") || userLists[0];
      
      if (defaultList) {
        // Add restaurant to the user's default list if it exists
        await storage.addRestaurantToList({
          listId: defaultList.id,
          restaurantId: restaurant.id,
          order: 999 // Will be adjusted by storage method
        }, req.user!.id);
        
        // Create activity for adding restaurant
        await storage.createActivity({
          userId: req.user!.id,
          type: "restaurant_added",
          data: { restaurantId: restaurant.id }
        });
      }
      
      res.status(201).json(restaurant);
    } catch (error) {
      next(error);
    }
  });

  // Add restaurant to list
  app.post("/api/lists/:listId/restaurants", isAuthenticated, async (req, res, next) => {
    try {
      const listId = parseInt(req.params.listId);
      const { restaurantId } = req.body;
      
      if (!restaurantId) {
        return res.status(400).json({ message: "RestaurantId is required" });
      }
      
      const validatedData = insertRestaurantInListSchema.parse({
        listId,
        restaurantId,
        order: 999 // Will be adjusted by storage method
      });
      
      const result = await storage.addRestaurantToList(validatedData, req.user!.id);
      if (!result) {
        return res.status(404).json({ message: "List not found, restaurant not found, or unauthorized" });
      }
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/lists/:listId/restaurants/:restaurantId", isAuthenticated, async (req, res, next) => {
    try {
      const success = await storage.removeRestaurantFromList(
        parseInt(req.params.listId),
        parseInt(req.params.restaurantId),
        req.user!.id
      );
      
      if (!success) {
        return res.status(404).json({ message: "List or restaurant not found or unauthorized" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Reorder restaurants in list
  app.put("/api/lists/:listId/restaurants/reorder", isAuthenticated, async (req, res, next) => {
    try {
      const { restaurantIds } = req.body;
      if (!Array.isArray(restaurantIds)) {
        return res.status(400).json({ message: "restaurantIds array is required" });
      }
      
      const success = await storage.reorderRestaurantsInList(
        parseInt(req.params.listId),
        restaurantIds,
        req.user!.id
      );
      
      if (!success) {
        return res.status(404).json({ message: "List not found or unauthorized" });
      }
      
      res.json({ message: "Restaurants reordered successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Visits API
  app.get("/api/restaurants/:restaurantId/visits", isAuthenticated, async (req, res, next) => {
    try {
      const visits = await storage.getVisitsByRestaurant(
        parseInt(req.params.restaurantId),
        req.user!.id
      );
      res.json(visits);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/visits/:visitId", isAuthenticated, async (req, res, next) => {
    try {
      const visitId = parseInt(req.params.visitId);
      const visit = await storage.getVisitDetails(visitId, req.user!.id);
      if (!visit) {
        return res.status(404).json({ message: "Visit not found or unauthorized" });
      }
      res.json(visit);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/restaurants/:restaurantId/visits", isAuthenticated, async (req, res, next) => {
    try {
      // Parse the ISO date string to a Date object for the server
      let requestData = req.body;
      if (requestData.date && typeof requestData.date === 'string') {
        requestData = {
          ...requestData,
          date: new Date(requestData.date)
        };
      }
      
      // Extract collaborator IDs from the request
      const collaboratorIds = Array.isArray(requestData.collaboratorIds) ? 
        requestData.collaboratorIds.map((id: string) => parseInt(id)) : [];
      
      // Remove collaboratorIds from data for validation
      const { collaboratorIds: _, ...visitData } = requestData;
      
      const validatedData = insertVisitSchema.parse({
        ...visitData,
        restaurantId: parseInt(req.params.restaurantId)
      });
      
      const visit = await storage.createVisit(validatedData, req.user!.id, collaboratorIds);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "visit_added",
        data: { visitId: visit.id, restaurantId: visit.restaurantId }
      });
      
      res.status(201).json(visit);
    } catch (error) {
      next(error);
    }
  });

  // Notes API
  app.post("/api/visits/:visitId/notes", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertNoteSchema.parse({
        ...req.body,
        visitId: parseInt(req.params.visitId),
        userId: req.user!.id
      });
      
      const note = await storage.createNote(validatedData, req.user!.id);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "note_added",
        data: { noteId: note.id, visitId: note.visitId }
      });
      
      res.status(201).json(note);
    } catch (error) {
      next(error);
    }
  });

  // Photos API
  app.post("/api/visits/:visitId/photos", isAuthenticated, upload.single('photo'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }
      
      const validatedData = insertPhotoSchema.parse({
        visitId: parseInt(req.params.visitId),
        userId: req.user!.id,
        url: `/uploads/${req.file.filename}`
      });
      
      const photo = await storage.createPhoto(validatedData, req.user!.id);
      res.status(201).json(photo);
    } catch (error) {
      next(error);
    }
  });

  // Serve uploaded photos
  app.use('/uploads', express.static(uploadsDir));

  // AI API
  app.post("/api/visits/:visitId/summarize", isAuthenticated, async (req, res, next) => {
    try {
      const visitId = parseInt(req.params.visitId);
      const visit = await storage.getVisitDetails(visitId, req.user!.id);
      
      if (!visit) {
        return res.status(404).json({ message: "Visit not found or unauthorized" });
      }
      
      if (!visit.notes || visit.notes.length === 0) {
        return res.status(400).json({ message: "No notes to summarize" });
      }
      
      const notesText = visit.notes.map(note => `${note.user.name}: ${note.content}`).join("\n\n");
      const summary = await summarizeNotes(notesText);
      
      const updatedVisit = await storage.updateVisitSummary(visitId, summary, req.user!.id);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "ai_summary",
        data: { visitId }
      });
      
      res.json({ summary, visit: updatedVisit });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ai/suggest-restaurants", isAuthenticated, async (req, res, next) => {
    try {
      const { restaurantIds } = req.body;
      
      if (!restaurantIds || !Array.isArray(restaurantIds) || restaurantIds.length === 0) {
        return res.status(400).json({ message: "At least one restaurantId is required" });
      }
      
      const restaurants = await Promise.all(
        restaurantIds.map(id => storage.getRestaurantDetails(id, req.user!.id))
      );
      
      const validRestaurants = restaurants.filter(r => r !== null);
      
      if (validRestaurants.length === 0) {
        return res.status(404).json({ message: "No valid restaurants found" });
      }
      
      const suggestions = await suggestRestaurants(validRestaurants);
      
      // Create activity
      await storage.createActivity({
        userId: req.user!.id,
        type: "ai_suggestion",
        data: { basedOnRestaurantIds: restaurantIds }
      });
      
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  });

  // Activity feed
  app.get("/api/activity", isAuthenticated, async (req, res, next) => {
    try {
      const activities = await storage.getActivityFeed(req.user!.id);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Stats for dashboard
  app.get("/api/stats", isAuthenticated, async (req, res, next) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Friends API
  app.get("/api/friends", isAuthenticated, async (req, res, next) => {
    try {
      const friends = await storage.getFriends(req.user!.id);
      res.json(friends);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/friends/requests", isAuthenticated, async (req, res, next) => {
    try {
      const requests = await storage.getFriendRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/friends/request", isAuthenticated, async (req, res, next) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const success = await storage.sendFriendRequest(req.user!.id, parseInt(userId));
      
      if (!success) {
        return res.status(400).json({ message: "Unable to send friend request" });
      }
      
      res.status(201).json({ message: "Friend request sent successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/friends/accept", isAuthenticated, async (req, res, next) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const success = await storage.acceptFriendRequest(req.user!.id, parseInt(userId));
      
      if (!success) {
        return res.status(400).json({ message: "Unable to accept friend request" });
      }
      
      res.status(200).json({ message: "Friend request accepted successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/friends/reject", isAuthenticated, async (req, res, next) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const success = await storage.rejectFriendRequest(req.user!.id, parseInt(userId));
      
      if (!success) {
        return res.status(400).json({ message: "Unable to reject friend request" });
      }
      
      res.status(200).json({ message: "Friend request rejected successfully" });
    } catch (error) {
      next(error);
    }
  });

  // User search 
  app.get("/api/users/search", isAuthenticated, async (req, res, next) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const users = await storage.searchUsers(query, req.user!.id);
      
      // Return limited user info for security
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar
      }));
      
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });

  // Google Places API
  app.get("/api/places/search", isAuthenticated, async (req, res, next) => {
    try {
      const query = req.query.query as string;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const results = await searchPlacesAutocomplete(query);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/places/:placeId", isAuthenticated, async (req, res, next) => {
    try {
      const placeId = req.params.placeId;
      const details = await fetchPlaceDetails(placeId);
      
      if (!details) {
        return res.status(404).json({ message: "Place details not found" });
      }
      
      res.json(details);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/places/url", isAuthenticated, async (req, res, next) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      const details = await getPlaceDetailsFromUrl(url);
      
      if (!details) {
        return res.status(404).json({ message: "Could not extract place details from URL" });
      }
      
      res.json(details);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
