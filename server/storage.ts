import { 
  User, InsertUser, 
  List, InsertList, 
  Restaurant, InsertRestaurant, 
  RestaurantInList, InsertRestaurantInList,
  Visit, InsertVisit,
  Note, InsertNote,
  Photo, InsertPhoto,
  Activity, InsertActivity,
  ListWithDetails,
  RestaurantWithLists,
  VisitWithDetails,
  ActivityWithDetails
} from "@shared/schema";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// User stats interface
interface UserStats {
  totalLists: number;
  totalRestaurants: number;
  totalVisits: number;
  totalCollaborators: number;
}

export interface IStorage {
  // Session store
  sessionStore: SessionStore;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  searchUsers(query: string, userId: number): Promise<User[]>;
  
  // Friendship methods
  getFriends(userId: number): Promise<FriendWithDetails[]>;
  getFriendRequests(userId: number): Promise<FriendWithDetails[]>;
  sendFriendRequest(userId: number, friendId: number): Promise<boolean>;
  acceptFriendRequest(userId: number, friendId: number): Promise<boolean>;
  rejectFriendRequest(userId: number, friendId: number): Promise<boolean>;

  // List methods
  getListsByUser(userId: number): Promise<ListWithDetails[]>;
  getSharedLists(userId: number): Promise<ListWithDetails[]>;
  getListDetails(listId: number, userId: number): Promise<ListWithDetails | null>;
  createList(list: InsertList, userId: number): Promise<List>;
  updateList(listId: number, list: InsertList, userId: number): Promise<List | null>;
  deleteList(listId: number, userId: number): Promise<boolean>;
  shareList(listId: number, shareWithUserId: number, isOwner: boolean, userId: number): Promise<boolean>;

  // Restaurant methods
  getRestaurantsByUser(userId: number): Promise<RestaurantWithLists[]>;
  getRestaurantDetails(restaurantId: number, userId: number): Promise<RestaurantWithLists | null>;
  createOrGetRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  getRestaurantsByList(listId: number, userId: number): Promise<RestaurantWithLists[]>;
  
  // Restaurant-List relationship methods
  addRestaurantToList(data: InsertRestaurantInList, userId: number): Promise<RestaurantInList | null>;
  removeRestaurantFromList(listId: number, restaurantId: number, userId: number): Promise<boolean>;
  reorderRestaurantsInList(listId: number, restaurantIds: number[], userId: number): Promise<boolean>;

  // Visit methods
  getVisitsByRestaurant(restaurantId: number, userId: number): Promise<VisitWithDetails[]>;
  getVisitDetails(visitId: number, userId: number): Promise<VisitWithDetails | null>;
  createVisit(visit: InsertVisit, userId: number): Promise<Visit>;
  updateVisitSummary(visitId: number, summary: string, userId: number): Promise<Visit | null>;

  // Note methods
  createNote(note: InsertNote, userId: number): Promise<Note>;

  // Photo methods
  createPhoto(photo: InsertPhoto, userId: number): Promise<Photo>;

  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivityFeed(userId: number): Promise<ActivityWithDetails[]>;

  // Stats methods
  getUserStats(userId: number): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  sessionStore: SessionStore;
  
  private users: Map<number, User>;
  private friendships: Map<number, Friendship>;
  private lists: Map<number, List>;
  private listCollaborators: Map<number, { listId: number, userId: number, isOwner: boolean }>;
  private restaurants: Map<number, Restaurant>;
  private restaurantsInLists: Map<number, RestaurantInList>;
  private visits: Map<number, Visit>;
  private visitCollaborators: Map<number, { visitId: number, userId: number, isOwner: boolean }>;
  private notes: Map<number, Note>;
  private photos: Map<number, Photo>;
  private activities: Map<number, Activity>;
  
  private currentId: {
    users: number;
    friendships: number;
    lists: number;
    listCollaborators: number;
    restaurants: number;
    restaurantsInLists: number;
    visits: number;
    visitCollaborators: number;
    notes: number;
    photos: number;
    activities: number;
  };

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    this.users = new Map();
    this.friendships = new Map();
    this.lists = new Map();
    this.listCollaborators = new Map();
    this.restaurants = new Map();
    this.restaurantsInLists = new Map();
    this.visits = new Map();
    this.visitCollaborators = new Map();
    this.notes = new Map();
    this.photos = new Map();
    this.activities = new Map();
    
    this.currentId = {
      users: 1,
      friendships: 1,
      lists: 1,
      listCollaborators: 1,
      restaurants: 1,
      restaurantsInLists: 1,
      visits: 1,
      visitCollaborators: 1,
      notes: 1,
      photos: 1,
      activities: 1
    };

    // Create a sample user for development
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      name: "Demo User",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { 
      id,
      username: insertUser.username,
      name: insertUser.name,
      email: insertUser.email,
      password: insertUser.password ?? null,
      avatar: insertUser.avatar ?? null,
      firebaseUid: insertUser.firebaseUid ?? null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    
    // Create a default "My Restaurants" list for the user
    const defaultList = await this.createList({
      title: "My Restaurants",
      description: "Your default collection of restaurants"
    }, id);

    // Create test friends in development environment
    if (process.env.NODE_ENV !== 'production') {
      // Create test friend users if they don't exist yet
      const testFriends = [
        {
          username: "alex_foodie",
          name: "Alex Johnson",
          email: "alex@example.com",
          avatar: "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
          username: "sara_eats",
          name: "Sara Williams",
          email: "sara@example.com",
          avatar: "https://randomuser.me/api/portraits/women/44.jpg"
        },
        {
          username: "mike_chef",
          name: "Mike Chen",
          email: "mike@example.com",
          avatar: "https://randomuser.me/api/portraits/men/68.jpg"
        }
      ];

      for (const friendData of testFriends) {
        // Only create if the user doesn't already exist
        const existingUser = await this.getUserByUsername(friendData.username);
        if (!existingUser) {
          // Create the friend user
          const friendUser = await this.createUser({
            ...friendData,
            password: "password123" // Simple password for test users
          });
          
          // Create a friendship (already accepted) between the new user and this test friend
          const friendship: Friendship = {
            id: this.currentId.friendships++,
            userId: id,
            friendId: friendUser.id,
            status: "accepted",
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          this.friendships.set(friendship.id, friendship);
        } else {
          // User exists, just create the friendship if it doesn't exist
          const existingFriendship = Array.from(this.friendships.values()).find(
            f => (f.userId === id && f.friendId === existingUser.id) || 
                 (f.userId === existingUser.id && f.friendId === id)
          );
          
          if (!existingFriendship) {
            const friendship: Friendship = {
              id: this.currentId.friendships++,
              userId: id,
              friendId: existingUser.id,
              status: "accepted",
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            this.friendships.set(friendship.id, friendship);
          }
        }
      }
    }
    
    return user;
  }

  async searchUsers(query: string, userId: number): Promise<User[]> {
    if (!query || query.trim().length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values())
      .filter(user => 
        user.id !== userId && // Don't include the current user
        (
          user.username.toLowerCase().includes(lowerQuery) ||
          user.name.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery)
        )
      )
      .slice(0, 10); // Limit results
  }
  
  // Friendship methods
  async getFriends(userId: number): Promise<FriendWithDetails[]> {
    // Get all accepted friendship requests where user is either the sender or receiver
    const friendships = Array.from(this.friendships.values())
      .filter(friendship => 
        friendship.status === "accepted" && 
        (friendship.userId === userId || friendship.friendId === userId)
      );
    
    // Transform to FriendWithDetails
    return friendships.map(friendship => {
      // Get the friend's ID (the other user in the friendship)
      const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;
      const friend = this.users.get(friendId);
      
      if (!friend) {
        // This should not happen in a well-maintained database, but handle it gracefully
        return {
          id: friendId,
          username: "Unknown",
          name: "Unknown User",
          email: "unknown@example.com",
          status: "accepted"
        };
      }
      
      return {
        id: friend.id,
        username: friend.username,
        name: friend.name,
        email: friend.email,
        avatar: friend.avatar ?? undefined,
        status: "accepted"
      };
    });
  }
  
  async getFriendRequests(userId: number): Promise<FriendWithDetails[]> {
    // Get all pending friendship requests where user is the receiver
    const friendships = Array.from(this.friendships.values())
      .filter(friendship => 
        friendship.status === "pending" && 
        friendship.friendId === userId
      );
    
    // Transform to FriendWithDetails
    return friendships.map(friendship => {
      const requester = this.users.get(friendship.userId);
      
      if (!requester) {
        // This should not happen in a well-maintained database, but handle it gracefully
        return {
          id: friendship.userId,
          username: "Unknown",
          name: "Unknown User",
          email: "unknown@example.com",
          status: "pending"
        };
      }
      
      return {
        id: requester.id,
        username: requester.username,
        name: requester.name,
        email: requester.email,
        avatar: requester.avatar ?? undefined,
        status: "pending"
      };
    });
  }
  
  async sendFriendRequest(userId: number, friendId: number): Promise<boolean> {
    // Check if both users exist
    const user = this.users.get(userId);
    const friend = this.users.get(friendId);
    
    if (!user || !friend) return false;
    
    // Check if a friendship already exists
    const existingFriendship = Array.from(this.friendships.values())
      .find(friendship => 
        (friendship.userId === userId && friendship.friendId === friendId) ||
        (friendship.userId === friendId && friendship.friendId === userId)
      );
    
    if (existingFriendship) {
      // Friendship already exists, do nothing
      return false;
    }
    
    // Create a new friendship request
    const id = this.currentId.friendships++;
    const now = new Date();
    
    const friendship: Friendship = {
      id,
      userId, // Requester
      friendId, // Recipient
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    
    this.friendships.set(id, friendship);
    
    // Create activity
    await this.createActivity({
      userId,
      type: "friend_request_sent",
      data: { friendId }
    });
    
    return true;
  }
  
  async acceptFriendRequest(userId: number, friendId: number): Promise<boolean> {
    // Find pending friendship where userId is the recipient and friendId is the requester
    let targetFriendship: Friendship | undefined;
    let targetFriendshipId: number | undefined;
    
    for (const [id, friendship] of this.friendships.entries()) {
      if (friendship.userId === friendId && 
          friendship.friendId === userId && 
          friendship.status === "pending") {
        targetFriendship = friendship;
        targetFriendshipId = id;
        break;
      }
    }
    
    if (!targetFriendship || targetFriendshipId === undefined) return false;
    
    // Update friendship status
    const updatedFriendship: Friendship = {
      ...targetFriendship,
      status: "accepted",
      updatedAt: new Date()
    };
    
    this.friendships.set(targetFriendshipId, updatedFriendship);
    
    // Create activity
    await this.createActivity({
      userId,
      type: "friend_request_accepted",
      data: { friendId }
    });
    
    return true;
  }
  
  async rejectFriendRequest(userId: number, friendId: number): Promise<boolean> {
    // Find pending friendship where userId is the recipient and friendId is the requester
    let targetFriendshipId: number | undefined;
    
    for (const [id, friendship] of this.friendships.entries()) {
      if (friendship.userId === friendId && 
          friendship.friendId === userId && 
          friendship.status === "pending") {
        targetFriendshipId = id;
        break;
      }
    }
    
    if (targetFriendshipId === undefined) return false;
    
    // Delete the friendship request
    this.friendships.delete(targetFriendshipId);
    
    return true;
  }

  // List methods
  async getListsByUser(userId: number): Promise<ListWithDetails[]> {
    // Get all list IDs where user is a collaborator
    const userListIds = new Set(
      Array.from(this.listCollaborators.values())
        .filter(collab => collab.userId === userId)
        .map(collab => collab.listId)
    );
    
    // Transform lists with details
    return Array.from(this.lists.values())
      .filter(list => userListIds.has(list.id))
      .map(list => this.transformListWithDetails(list));
  }

  async getSharedLists(userId: number): Promise<ListWithDetails[]> {
    // Get all list IDs where user is a collaborator but not owner
    const sharedListIds = new Set(
      Array.from(this.listCollaborators.values())
        .filter(collab => collab.userId === userId && !collab.isOwner)
        .map(collab => collab.listId)
    );
    
    // Transform lists with details
    return Array.from(this.lists.values())
      .filter(list => sharedListIds.has(list.id))
      .map(list => this.transformListWithDetails(list));
  }

  async getListDetails(listId: number, userId: number): Promise<ListWithDetails | null> {
    // Check if list exists and user has access
    const list = this.lists.get(listId);
    if (!list) return null;
    
    const hasAccess = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === userId);
    
    if (!hasAccess) return null;
    
    return this.transformListWithDetails(list);
  }

  private transformListWithDetails(list: List): ListWithDetails {
    // Get collaborators
    const collaborators = Array.from(this.listCollaborators.values())
      .filter(collab => collab.listId === list.id)
      .map(collab => {
        const user = this.users.get(collab.userId);
        return {
          userId: collab.userId,
          name: user?.name || "Unknown User",
          avatar: user?.avatar
        };
      });
    
    // Count restaurants
    const restaurantCount = Array.from(this.restaurantsInLists.values())
      .filter(rel => rel.listId === list.id)
      .length;
    
    return {
      ...list,
      collaborators,
      restaurantCount
    };
  }

  async createList(insertList: InsertList, userId: number): Promise<List> {
    const id = this.currentId.lists++;
    const now = new Date();
    
    const list: List = {
      id,
      title: insertList.title,
      description: insertList.description ?? null,
      coverImage: insertList.coverImage ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.lists.set(id, list);
    
    // Add user as owner collaborator
    const collabId = this.currentId.listCollaborators++;
    this.listCollaborators.set(collabId, {
      listId: id,
      userId,
      isOwner: true
    });
    
    return list;
  }

  async updateList(listId: number, updates: InsertList, userId: number): Promise<List | null> {
    // Check if list exists
    const list = this.lists.get(listId);
    if (!list) return null;
    
    // Check if user is collaborator and owner
    const isOwner = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === userId && collab.isOwner);
    
    if (!isOwner) return null;
    
    // Update list
    const updatedList: List = {
      ...list,
      ...updates,
      id: list.id,
      createdAt: list.createdAt,
      updatedAt: new Date()
    };
    
    this.lists.set(listId, updatedList);
    return updatedList;
  }

  async deleteList(listId: number, userId: number): Promise<boolean> {
    // Check if list exists
    const list = this.lists.get(listId);
    if (!list) return false;
    
    // Check if user is collaborator and owner
    const isOwner = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === userId && collab.isOwner);
    
    if (!isOwner) return false;
    
    // Delete list and associated data
    this.lists.delete(listId);
    
    // Delete all list collaborators
    for (const [id, collab] of this.listCollaborators.entries()) {
      if (collab.listId === listId) {
        this.listCollaborators.delete(id);
      }
    }
    
    // Delete all restaurants in list
    for (const [id, rel] of this.restaurantsInLists.entries()) {
      if (rel.listId === listId) {
        this.restaurantsInLists.delete(id);
      }
    }
    
    return true;
  }

  async shareList(listId: number, shareWithUserId: number, isOwner: boolean, userId: number): Promise<boolean> {
    // Check if list exists
    const list = this.lists.get(listId);
    if (!list) return false;
    
    // Check if sharing user is owner
    const isCurrentUserOwner = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === userId && collab.isOwner);
    
    if (!isCurrentUserOwner) return false;
    
    // Check if user to share with exists
    const userToShareWith = this.users.get(shareWithUserId);
    if (!userToShareWith) return false;
    
    // Check if already a collaborator
    const isAlreadyCollaborator = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === shareWithUserId);
    
    if (isAlreadyCollaborator) {
      // Update existing collaborator role
      for (const [id, collab] of this.listCollaborators.entries()) {
        if (collab.listId === listId && collab.userId === shareWithUserId) {
          this.listCollaborators.set(id, { ...collab, isOwner });
          break;
        }
      }
    } else {
      // Add new collaborator
      const collabId = this.currentId.listCollaborators++;
      this.listCollaborators.set(collabId, {
        listId,
        userId: shareWithUserId,
        isOwner
      });
    }
    
    return true;
  }

  // Restaurant methods
  async getRestaurantsByUser(userId: number): Promise<RestaurantWithLists[]> {
    // Get all list IDs where user is a collaborator
    const userListIds = new Set(
      Array.from(this.listCollaborators.values())
        .filter(collab => collab.userId === userId)
        .map(collab => collab.listId)
    );
    
    // Get all restaurant IDs from those lists
    const restaurantListMap = new Map<number, { listId: number; listTitle: string }[]>();
    
    for (const rel of this.restaurantsInLists.values()) {
      if (userListIds.has(rel.listId)) {
        const list = this.lists.get(rel.listId);
        if (!list) continue;
        
        if (!restaurantListMap.has(rel.restaurantId)) {
          restaurantListMap.set(rel.restaurantId, []);
        }
        
        restaurantListMap.get(rel.restaurantId)!.push({
          listId: rel.listId,
          listTitle: list.title
        });
      }
    }
    
    // Return restaurants with list information
    return Array.from(this.restaurants.values())
      .filter(restaurant => restaurantListMap.has(restaurant.id))
      .map(restaurant => ({
        ...restaurant,
        lists: restaurantListMap.get(restaurant.id) || []
      }));
  }

  async getRestaurantDetails(restaurantId: number, userId: number): Promise<RestaurantWithLists | null> {
    // Check if restaurant exists
    const restaurant = this.restaurants.get(restaurantId);
    if (!restaurant) return null;
    
    // Get all list IDs where user is a collaborator
    const userListIds = new Set(
      Array.from(this.listCollaborators.values())
        .filter(collab => collab.userId === userId)
        .map(collab => collab.listId)
    );
    
    // Get all lists for this restaurant
    const lists = Array.from(this.restaurantsInLists.values())
      .filter(rel => rel.restaurantId === restaurantId && userListIds.has(rel.listId))
      .map(rel => {
        const list = this.lists.get(rel.listId);
        return {
          listId: rel.listId,
          listTitle: list?.title || "Unknown List"
        };
      });
    
    // Only return if user has access to at least one list with this restaurant
    if (lists.length === 0) return null;
    
    return {
      ...restaurant,
      lists
    };
  }

  async createOrGetRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    // Check if restaurant with same placeId already exists
    const existingRestaurant = Array.from(this.restaurants.values())
      .find(r => r.placeId === insertRestaurant.placeId);
    
    if (existingRestaurant) {
      return existingRestaurant;
    }
    
    // Create new restaurant
    const id = this.currentId.restaurants++;
    const restaurant: Restaurant = {
      id,
      name: insertRestaurant.name,
      placeId: insertRestaurant.placeId,
      address: insertRestaurant.address ?? null,
      cuisine: insertRestaurant.cuisine ?? null,
      priceLevel: insertRestaurant.priceLevel ?? null,
      rating: insertRestaurant.rating ?? null,
      photoUrl: insertRestaurant.photoUrl ?? null,
      createdAt: new Date()
    };
    
    this.restaurants.set(id, restaurant);
    return restaurant;
  }
  
  async getRestaurantsByList(listId: number, userId: number): Promise<RestaurantWithLists[]> {
    // Check if list exists and user has access
    const list = this.lists.get(listId);
    if (!list) return [];
    
    const hasAccess = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === userId);
    
    if (!hasAccess) return [];
    
    // Get all restaurant IDs in this list
    const restaurantIds = Array.from(this.restaurantsInLists.values())
      .filter(rel => rel.listId === listId)
      .map(rel => rel.restaurantId);
    
    if (restaurantIds.length === 0) return [];
    
    // Get details for each restaurant
    const restaurants = Array.from(this.restaurants.values())
      .filter(restaurant => restaurantIds.includes(restaurant.id));
    
    // Add list info to each restaurant
    return restaurants.map(restaurant => {
      const lists = [{
        listId,
        listTitle: list.title
      }];
      
      return {
        ...restaurant,
        lists
      };
    });
  }

  // Restaurant-List relationship methods
  async addRestaurantToList(data: InsertRestaurantInList, userId: number): Promise<RestaurantInList | null> {
    // Check if list exists and user has access
    const list = this.lists.get(data.listId);
    if (!list) return null;
    
    const hasAccess = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === data.listId && collab.userId === userId);
    
    if (!hasAccess) return null;
    
    // Check if restaurant exists
    const restaurant = this.restaurants.get(data.restaurantId);
    if (!restaurant) return null;
    
    // Check if restaurant is already in list
    const alreadyInList = Array.from(this.restaurantsInLists.values())
      .some(rel => rel.listId === data.listId && rel.restaurantId === data.restaurantId);
    
    if (alreadyInList) {
      // Return existing relationship
      const existing = Array.from(this.restaurantsInLists.entries())
        .find(([_, rel]) => rel.listId === data.listId && rel.restaurantId === data.restaurantId);
      
      if (existing) return existing[1];
      return null;
    }
    
    // Get max order for list
    const maxOrder = Math.max(
      0,
      ...Array.from(this.restaurantsInLists.values())
        .filter(rel => rel.listId === data.listId)
        .map(rel => rel.order)
    );
    
    // Create new relationship
    const id = this.currentId.restaurantsInLists++;
    const rel: RestaurantInList = {
      ...data,
      id,
      order: maxOrder + 1,
      createdAt: new Date()
    };
    
    this.restaurantsInLists.set(id, rel);
    return rel;
  }

  async removeRestaurantFromList(listId: number, restaurantId: number, userId: number): Promise<boolean> {
    // Check if list exists and user has access
    const list = this.lists.get(listId);
    if (!list) return false;
    
    const hasAccess = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === userId);
    
    if (!hasAccess) return false;
    
    // Find and delete the relationship
    for (const [id, rel] of this.restaurantsInLists.entries()) {
      if (rel.listId === listId && rel.restaurantId === restaurantId) {
        this.restaurantsInLists.delete(id);
        return true;
      }
    }
    
    return false;
  }

  async reorderRestaurantsInList(listId: number, restaurantIds: number[], userId: number): Promise<boolean> {
    // Check if list exists and user has access
    const list = this.lists.get(listId);
    if (!list) return false;
    
    const hasAccess = Array.from(this.listCollaborators.values())
      .some(collab => collab.listId === listId && collab.userId === userId);
    
    if (!hasAccess) return false;
    
    // Update order for each restaurant in list
    for (let i = 0; i < restaurantIds.length; i++) {
      const restaurantId = restaurantIds[i];
      let found = false;
      
      for (const [id, rel] of this.restaurantsInLists.entries()) {
        if (rel.listId === listId && rel.restaurantId === restaurantId) {
          this.restaurantsInLists.set(id, { ...rel, order: i });
          found = true;
          break;
        }
      }
      
      if (!found) return false;
    }
    
    return true;
  }

  // Visit methods
  async getVisitsByRestaurant(restaurantId: number, userId: number): Promise<VisitWithDetails[]> {
    // Check if restaurant exists
    const restaurant = this.restaurants.get(restaurantId);
    if (!restaurant) return [];
    
    // Get all visit IDs where user is a collaborator
    const userVisitIds = new Set(
      Array.from(this.visitCollaborators.values())
        .filter(collab => collab.userId === userId)
        .map(collab => collab.visitId)
    );
    
    // Return visits for this restaurant with details
    return Array.from(this.visits.values())
      .filter(visit => visit.restaurantId === restaurantId && userVisitIds.has(visit.id))
      .map(visit => this.transformVisitWithDetails(visit));
  }

  async getVisitDetails(visitId: number, userId: number): Promise<VisitWithDetails | null> {
    // Check if visit exists
    const visit = this.visits.get(visitId);
    if (!visit) return null;
    
    // Check if user has access
    const hasAccess = Array.from(this.visitCollaborators.values())
      .some(collab => collab.visitId === visitId && collab.userId === userId);
    
    if (!hasAccess) return null;
    
    return this.transformVisitWithDetails(visit);
  }

  private transformVisitWithDetails(visit: Visit): VisitWithDetails {
    // Get notes for this visit
    const visitNotes = Array.from(this.notes.values())
      .filter(note => note.visitId === visit.id)
      .map(note => {
        const user = this.users.get(note.userId);
        return {
          ...note,
          user: {
            name: user?.name || "Unknown User",
            avatar: user?.avatar
          }
        };
      });
    
    // Get photos for this visit
    const visitPhotos = Array.from(this.photos.values())
      .filter(photo => photo.visitId === visit.id);
    
    // Get collaborators for this visit
    const collaborators = Array.from(this.visitCollaborators.values())
      .filter(collab => collab.visitId === visit.id)
      .map(collab => {
        const user = this.users.get(collab.userId);
        return {
          userId: collab.userId,
          name: user?.name || "Unknown User",
          avatar: user?.avatar
        };
      });
    
    return {
      ...visit,
      notes: visitNotes,
      photos: visitPhotos,
      collaborators
    };
  }

  async createVisit(insertVisit: InsertVisit, userId: number, collaboratorIds: number[] = []): Promise<Visit> {
    // Create visit
    const id = this.currentId.visits++;
    const visit: Visit = {
      id,
      restaurantId: insertVisit.restaurantId,
      date: insertVisit.date || new Date(), // Ensure date is present
      summary: insertVisit.summary ?? null,
      occasion: insertVisit.occasion ?? null,
      createdAt: new Date()
    };
    
    this.visits.set(id, visit);
    
    // Add user as owner collaborator
    const collabId = this.currentId.visitCollaborators++;
    this.visitCollaborators.set(collabId, {
      visitId: id,
      userId,
      isOwner: true
    });
    
    // Add other friends as collaborators
    for (const friendId of collaboratorIds) {
      // Only add if user exists
      const friend = this.users.get(friendId);
      if (friend) {
        const friendCollabId = this.currentId.visitCollaborators++;
        this.visitCollaborators.set(friendCollabId, {
          visitId: id,
          userId: friendId,
          isOwner: false
        });
      }
    }
    
    return visit;
  }

  async updateVisitSummary(visitId: number, summary: string, userId: number): Promise<Visit | null> {
    // Check if visit exists
    const visit = this.visits.get(visitId);
    if (!visit) return null;
    
    // Check if user has access
    const hasAccess = Array.from(this.visitCollaborators.values())
      .some(collab => collab.visitId === visitId && collab.userId === userId);
    
    if (!hasAccess) return null;
    
    // Update summary
    const updatedVisit: Visit = {
      ...visit,
      summary
    };
    
    this.visits.set(visitId, updatedVisit);
    return updatedVisit;
  }

  // Note methods
  async createNote(insertNote: InsertNote, userId: number): Promise<Note> {
    // Check if visit exists and user has access
    const visit = this.visits.get(insertNote.visitId);
    if (!visit) throw new Error("Visit not found");
    
    const hasAccess = Array.from(this.visitCollaborators.values())
      .some(collab => collab.visitId === insertNote.visitId && collab.userId === userId);
    
    if (!hasAccess) throw new Error("Unauthorized");
    
    // Create note
    const id = this.currentId.notes++;
    const now = new Date();
    const note: Note = {
      id,
      visitId: insertNote.visitId,
      userId: userId,
      content: insertNote.content,
      createdAt: now,
      updatedAt: now
    };
    
    this.notes.set(id, note);
    return note;
  }

  // Photo methods
  async createPhoto(insertPhoto: InsertPhoto, userId: number): Promise<Photo> {
    // Check if visit exists and user has access
    const visit = this.visits.get(insertPhoto.visitId);
    if (!visit) throw new Error("Visit not found");
    
    const hasAccess = Array.from(this.visitCollaborators.values())
      .some(collab => collab.visitId === insertPhoto.visitId && collab.userId === userId);
    
    if (!hasAccess) throw new Error("Unauthorized");
    
    // Create photo
    const id = this.currentId.photos++;
    const photo: Photo = {
      id,
      visitId: insertPhoto.visitId,
      userId: userId,
      url: insertPhoto.url,
      createdAt: new Date()
    };
    
    this.photos.set(id, photo);
    return photo;
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentId.activities++;
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date()
    };
    
    this.activities.set(id, activity);
    return activity;
  }

  async getActivityFeed(userId: number): Promise<ActivityWithDetails[]> {
    const result: ActivityWithDetails[] = [];
    
    // Get all list IDs where user is a collaborator
    const userListIds = new Set(
      Array.from(this.listCollaborators.values())
        .filter(collab => collab.userId === userId)
        .map(collab => collab.listId)
    );
    
    // Get all restaurant IDs from those lists
    const userRestaurantIds = new Set<number>();
    for (const rel of this.restaurantsInLists.values()) {
      if (userListIds.has(rel.listId)) {
        userRestaurantIds.add(rel.restaurantId);
      }
    }
    
    // Get all visit IDs for those restaurants where user is a collaborator
    const userVisitIds = new Set<number>();
    for (const visit of this.visits.values()) {
      if (userRestaurantIds.has(visit.restaurantId)) {
        const isCollaborator = Array.from(this.visitCollaborators.values())
          .some(collab => collab.visitId === visit.id && collab.userId === userId);
        
        if (isCollaborator) {
          userVisitIds.add(visit.id);
        }
      }
    }
    
    // Get activities that are relevant to the user
    for (const activity of Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
      
      let isRelevant = false;
      
      // User's own activities
      if (activity.userId === userId) {
        isRelevant = true;
      }
      
      // Activities on lists the user is part of
      else if (activity.type === 'list_shared' && 
               userListIds.has((activity.data as any).listId)) {
        isRelevant = true;
      }
      
      // Activities on restaurants the user has in their lists
      else if ((activity.type === 'visit_added' || activity.type === 'restaurant_added') && 
               userRestaurantIds.has((activity.data as any).restaurantId)) {
        isRelevant = true;
      }
      
      // Activities on visits the user is part of
      else if ((activity.type === 'note_added' || activity.type === 'photo_added' || activity.type === 'ai_summary') && 
               userVisitIds.has((activity.data as any).visitId)) {
        isRelevant = true;
      }
      
      if (isRelevant) {
        const user = this.users.get(activity.userId);
        
        result.push({
          ...activity,
          user: {
            name: user?.name || "Unknown User",
            avatar: user?.avatar
          }
        });
        
        // Limit to most recent 20 activities
        if (result.length >= 20) break;
      }
    }
    
    return result;
  }

  // Stats methods
  async getUserStats(userId: number): Promise<UserStats> {
    // Count lists
    const userListIds = new Set(
      Array.from(this.listCollaborators.values())
        .filter(collab => collab.userId === userId)
        .map(collab => collab.listId)
    );
    
    const totalLists = userListIds.size;
    
    // Count restaurants
    const userRestaurantIds = new Set<number>();
    for (const rel of this.restaurantsInLists.values()) {
      if (userListIds.has(rel.listId)) {
        userRestaurantIds.add(rel.restaurantId);
      }
    }
    
    const totalRestaurants = userRestaurantIds.size;
    
    // Count visits
    const totalVisits = Array.from(this.visitCollaborators.values())
      .filter(collab => collab.userId === userId)
      .length;
    
    // Count unique collaborators across all lists
    const collaboratorUserIds = new Set<number>();
    for (const listId of userListIds) {
      for (const collab of Array.from(this.listCollaborators.values())
        .filter(c => c.listId === listId && c.userId !== userId)) {
        collaboratorUserIds.add(collab.userId);
      }
    }
    
    const totalCollaborators = collaboratorUserIds.size;
    
    return {
      totalLists,
      totalRestaurants,
      totalVisits,
      totalCollaborators
    };
  }
}

export const storage = new MemStorage();
