import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

export const appwriteConfig = {
    url: import.meta.env.VITE_APP_WRITE_URL,
    projectId: import.meta.env.VITE_APP_WRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APP_WRITE_DATABASE_ID,
    storageId: import.meta.env.VITE_APP_WRITE_STORAGE_ID,
    userCollectionId: import.meta.env.VITE_APP_WRITE_USER_COLLECTIONS_ID,
    postCollectionId: import.meta.env.VITE_APP_WRITE_POST_COLLECTIONS_ID,
    savesCollectionId: import.meta.env.VITE_APP_WRITE_SAVES_COLLECTIONS_ID,
}

export const cliet = new Client();
cliet.setProject(appwriteConfig.projectId);
cliet.setEndpoint(appwriteConfig.url);
export const account = new Account(cliet);
export const databases = new Databases(cliet);
export const storage = new Storage(cliet);
export const avatars = new Avatars(cliet);