import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage
 * @param fileBuffer The file buffer to upload
 * @param fileName The name to give the file in storage
 * @param contentType The content type of the file
 * @returns The download URL of the uploaded file
 */
export async function uploadToFirebase(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `uploads/${fileName}`);
    
    // Create file metadata including the content type
    const metadata = {
      contentType,
    };
    
    // Upload the file and metadata
    const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file to Firebase:', error);
    throw new Error('Failed to upload file');
  }
}

export default app;