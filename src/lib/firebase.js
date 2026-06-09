import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDd08__avGQdPfMaRKViHk-FkksHV7cmTM",
  authDomain: "costos-e-importacion.firebaseapp.com",
  projectId: "costos-e-importacion",
  storageBucket: "costos-e-importacion.firebasestorage.app",
  messagingSenderId: "532504241457",
  appId: "1:532504241457:web:0b605d14f772fe47dd7c10",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
