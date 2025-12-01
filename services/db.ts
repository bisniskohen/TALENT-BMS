import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { SalesData, PostData, TalentReference, ProductData } from "../types";

// --- NEW COLLECTIONS (Fresh Start) ---
// Menggunakan nama baru agar data lama tidak tercampur/terhapus secara efektif dari view
const SALES_COLLECTION = "new_sales_data";
const POSTS_COLLECTION = "new_posts_data";
const TALENTS_COLLECTION = "NAMA TALENT"; // Updated collection name per user request
const PRODUCTS_COLLECTION = "new_products_data";

// --- SALES SERVICES ---

export const addSale = async (data: Omit<SalesData, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, SALES_COLLECTION), {
      ...data,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Error adding sale:", error);
    return false;
  }
};

export const getRecentSales = async (): Promise<SalesData[]> => {
  try {
    const q = query(collection(db, SALES_COLLECTION), orderBy("date", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SalesData));
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const deleteSale = async (id: string) => {
  try {
    await deleteDoc(doc(db, SALES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting sale:", error);
    return false;
  }
};

// --- POST/CONTENT SERVICES ---

export const addPost = async (data: Omit<PostData, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, POSTS_COLLECTION), {
      ...data,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Error adding post:", error);
    return false;
  }
};

export const getRecentPosts = async (): Promise<PostData[]> => {
  try {
    const q = query(collection(db, POSTS_COLLECTION), orderBy("date", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostData));
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};

export const deletePost = async (id: string) => {
  try {
    await deleteDoc(doc(db, POSTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
};

// --- PRODUCT SERVICES ---

export const addProduct = async (data: Omit<ProductData, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...data,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Error adding product:", error);
    return false;
  }
};

export const getProducts = async (): Promise<ProductData[]> => {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductData));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
};

// --- TALENT CRUD SERVICES ---

export const addTalentReference = async (name: string, accounts: string[]) => {
  try {
    await addDoc(collection(db, TALENTS_COLLECTION), { name, accounts });
    return true;
  } catch (error) {
    console.error("Error adding talent:", error);
    return false;
  }
};

export const updateTalentReference = async (id: string, name: string, accounts: string[]) => {
  try {
    const docRef = doc(db, TALENTS_COLLECTION, id);
    await updateDoc(docRef, { name, accounts });
    return true;
  } catch (error) {
    console.error("Error updating talent:", error);
    return false;
  }
};

export const getTalentReferences = async (): Promise<TalentReference[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, TALENTS_COLLECTION));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // BUG FIX: Strict check to ensure 'accounts' is always an array
      // This prevents "Cannot read properties of undefined (reading 'map')"
      const safeAccounts = Array.isArray(data.accounts) ? data.accounts : [];
      
      return { 
        id: doc.id, 
        name: data.name || 'Unnamed Talent', 
        accounts: safeAccounts 
      } as TalentReference;
    });
  } catch (error) {
    console.error("Error fetching talents:", error);
    return [];
  }
};

export const deleteTalentReference = async (id: string) => {
  try {
    await deleteDoc(doc(db, TALENTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting talent:", error);
    return false;
  }
};