import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
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
