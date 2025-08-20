import { 
    signInWithPopup,
    signInWithRedirect, 
    getRedirectResult,
    GoogleAuthProvider, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    const provider = new GoogleAuthProvider();
    
    try {
        // Try popup first
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error: any) {
        // If popup fails due to CORS or other issues, fallback to redirect
        if (error.code === 'auth/popup-blocked' || 
            error.code === 'auth/popup-closed-by-user' ||
            error.message.includes('Cross-Origin-Opener-Policy')) {
            console.log('Popup blocked or CORS issue, falling back to redirect...');
            await signInWithRedirect(auth, provider);
            return null; // Redirect will handle the result
        }
        throw error; // Re-throw other errors
    }
};

export const handleRedirectResult = async (): Promise<FirebaseUser | null> => {
    const result = await getRedirectResult(auth);
    return result?.user || null;
};

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
};

export const createAccountWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
};

export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
