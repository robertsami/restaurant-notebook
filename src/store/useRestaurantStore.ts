import { create } from 'zustand';
import { Restaurant, RestaurantList, Note } from '@prisma/client';

interface RestaurantState {
  // Lists
  lists: RestaurantList[];
  currentList: RestaurantList | null;
  setLists: (lists: RestaurantList[]) => void;
  setCurrentList: (list: RestaurantList | null) => void;
  addList: (list: RestaurantList) => void;
  updateList: (list: RestaurantList) => void;
  removeList: (listId: string) => void;
  
  // Restaurants
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setRestaurants: (restaurants: Restaurant[]) => void;
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  addRestaurant: (restaurant: Restaurant) => void;
  updateRestaurant: (restaurant: Restaurant) => void;
  removeRestaurant: (restaurantId: string) => void;
  
  // Notes
  notes: Note[];
  currentNote: Note | null;
  setNotes: (notes: Note[]) => void;
  setCurrentNote: (note: Note | null) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  // Lists
  lists: [],
  currentList: null,
  setLists: (lists) => set({ lists }),
  setCurrentList: (currentList) => set({ currentList }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  updateList: (updatedList) => set((state) => ({
    lists: state.lists.map((list) => list.id === updatedList.id ? updatedList : list),
    currentList: state.currentList?.id === updatedList.id ? updatedList : state.currentList
  })),
  removeList: (listId) => set((state) => ({
    lists: state.lists.filter((list) => list.id !== listId),
    currentList: state.currentList?.id === listId ? null : state.currentList
  })),
  
  // Restaurants
  restaurants: [],
  currentRestaurant: null,
  setRestaurants: (restaurants) => set({ restaurants }),
  setCurrentRestaurant: (currentRestaurant) => set({ currentRestaurant }),
  addRestaurant: (restaurant) => set((state) => ({ restaurants: [...state.restaurants, restaurant] })),
  updateRestaurant: (updatedRestaurant) => set((state) => ({
    restaurants: state.restaurants.map((restaurant) => 
      restaurant.id === updatedRestaurant.id ? updatedRestaurant : restaurant
    ),
    currentRestaurant: state.currentRestaurant?.id === updatedRestaurant.id 
      ? updatedRestaurant 
      : state.currentRestaurant
  })),
  removeRestaurant: (restaurantId) => set((state) => ({
    restaurants: state.restaurants.filter((restaurant) => restaurant.id !== restaurantId),
    currentRestaurant: state.currentRestaurant?.id === restaurantId ? null : state.currentRestaurant
  })),
  
  // Notes
  notes: [],
  currentNote: null,
  setNotes: (notes) => set({ notes }),
  setCurrentNote: (currentNote) => set({ currentNote }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (updatedNote) => set((state) => ({
    notes: state.notes.map((note) => note.id === updatedNote.id ? updatedNote : note),
    currentNote: state.currentNote?.id === updatedNote.id ? updatedNote : state.currentNote
  })),
  removeNote: (noteId) => set((state) => ({
    notes: state.notes.filter((note) => note.id !== noteId),
    currentNote: state.currentNote?.id === noteId ? null : state.currentNote
  })),
  
  // UI State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
}));