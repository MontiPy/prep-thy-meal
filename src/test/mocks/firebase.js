// src/test/mocks/firebase.js
import { vi } from "vitest";

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn((callback) => {
    callback(mockAuth.currentUser);
    return vi.fn(); // unsubscribe function
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
};

// Mock Firestore
const mockDocData = new Map();

export const mockFirestore = {
  collection: vi.fn((name) => ({ _collectionName: name })),
  doc: vi.fn((collectionOrDb, ...path) => {
    const fullPath =
      typeof collectionOrDb === "string"
        ? [collectionOrDb, ...path].join("/")
        : path.join("/");
    return { _docPath: fullPath };
  }),
  getDoc: vi.fn(async (docRef) => {
    const data = mockDocData.get(docRef._docPath);
    return {
      exists: () => !!data,
      data: () => data,
      id: docRef._docPath.split("/").pop(),
    };
  }),
  getDocs: vi.fn(async () => {
    // Return empty array by default
    return {
      docs: [],
      empty: true,
    };
  }),
  setDoc: vi.fn(async (docRef, data) => {
    mockDocData.set(docRef._docPath, data);
  }),
  updateDoc: vi.fn(async (docRef, data) => {
    const existing = mockDocData.get(docRef._docPath) || {};
    mockDocData.set(docRef._docPath, { ...existing, ...data });
  }),
  addDoc: vi.fn(async (collectionRef, data) => {
    const id = `mock-${Date.now()}`;
    const path = `${collectionRef._collectionName}/${id}`;
    mockDocData.set(path, data);
    return { id, _docPath: path };
  }),
  deleteDoc: vi.fn(async (docRef) => {
    mockDocData.delete(docRef._docPath);
  }),
  query: vi.fn((collectionRef, ...constraints) => ({
    _collectionName: collectionRef._collectionName,
    _constraints: constraints,
  })),
  where: vi.fn((field, op, value) => ({ field, op, value })),
};

// Helper to set mock user
export const setMockUser = (user) => {
  mockAuth.currentUser = user;
};

// Helper to set mock Firestore data
export const setMockFirestoreData = (path, data) => {
  mockDocData.set(path, data);
};

// Helper to clear all mock data
export const clearMockData = () => {
  mockDocData.clear();
  mockAuth.currentUser = null;
};

// Mock Firebase app
export const mockFirebaseApp = {
  name: "[DEFAULT]",
  options: {},
};
