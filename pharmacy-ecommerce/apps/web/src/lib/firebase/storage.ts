import { getApps, getApp, initializeApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Same config as client.ts — storageBucket included so getStorage() resolves correctly
// whether this module loads before or after client.ts in the same page.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
}

function getFirebaseStorage() {
  if (typeof window === 'undefined') throw new Error('Firebase Storage solo disponible en el browser')
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  return getStorage(app)
}

/**
 * Uploads an invoice image/PDF to Firebase Storage.
 * Path: invoices/{tempId}/{timestamp}_{filename}
 * Returns the public download URL.
 *
 * NOTE: Firebase Storage rules must allow authenticated admin writes to "invoices/**".
 * If uploads fail with a permission error, update Storage rules in the Firebase console:
 *   match /invoices/{allPaths=**} {
 *     allow read, write: if request.auth != null;
 *   }
 */
export async function uploadInvoiceImage(file: File, tempId: string): Promise<string> {
  const storage = getFirebaseStorage()
  const timestamp = Date.now()
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `invoices/${tempId}/${timestamp}_${safeFilename}`
  const storageRef = ref(storage, path)

  const snapshot = await uploadBytes(storageRef, file)
  const downloadUrl = await getDownloadURL(snapshot.ref)
  return downloadUrl
}

/**
 * Uploads a product image to Firebase Storage.
 * Path: products/{productId}/{timestamp}_{filename}
 * Returns the public download URL.
 *
 * NOTE: Firebase Storage rules must allow authenticated admin writes to "products/**".
 * If uploads fail with a permission error, update Storage rules in the Firebase console:
 *   match /products/{allPaths=**} {
 *     allow read, write: if request.auth != null;
 *   }
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const storage = getFirebaseStorage()
  const timestamp = Date.now()
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `products/${productId}/${timestamp}_${safeFilename}`
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}
