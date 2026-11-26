// Firebase 연결 — 담당: 공통
// 앱 전체에서 Firebase를 쓸 때는 이 파일의 auth, db만 가져다 써요.
// (단, 화면 파일은 직접 쓰지 말고 src/services/의 함수를 거쳐서 써요.)
//
//   import { auth, db } from '../firebase.js'
//
// 설정값은 .env 파일의 VITE_FIREBASE_... 에서 읽어요. .env가 없으면 .env.example을 복사해 만들고
// 팀 채팅방에서 받은 값을 채우세요.
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// .env를 안 만들었거나 값이 비어 있으면 원인을 바로 알 수 있게 콘솔에 알려줌
const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)
if (missing.length > 0) {
  console.error(
    `[firebase.js] .env에 Firebase 설정값이 없어요: ${missing.join(', ')}\n` +
      '→ .env.example을 복사해서 .env를 만들고 팀 채팅방의 값을 채운 뒤, npm run dev를 다시 실행하세요.',
  )
}

// Firebase 앱 시작 (앱 전체에서 한 번만)
const app = initializeApp(firebaseConfig)

// 로그인 담당 (Authentication)
export const auth = getAuth(app)

// 데이터베이스 (Cloud Firestore)
export const db = getFirestore(app)
