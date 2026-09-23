// Firebase Authentication Service (Official Firebase Web SDK Modular Engine + Dual-Engine Local Session Bridge)
// Uses official Google Firebase SDK with real Carrier SMS OTP dispatch and reCAPTCHA integration.

import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
    signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
    sendPasswordResetEmail as fbSendPasswordResetEmail,
    updateProfile as fbUpdateProfile,
    deleteUser as fbDeleteUser
} from "firebase/auth";

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const FIREBASE_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const FIREBASE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID;
const FIREBASE_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

export const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = () => {
    return Boolean(FIREBASE_API_KEY && FIREBASE_API_KEY.length > 10 && !FIREBASE_API_KEY.startsWith("AIzaSyYour"));
};

// Initialize Firebase App & Auth Singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

/**
 * Normalizes phone numbers to standard E.164 international format (+[country][number])
 */
export const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    let clean = phone.trim().replace(/[\s\-()]/g, "");
    if (!clean.startsWith("+")) {
        // If 10 digits starting with 6,7,8,9 default to +91 (India)
        if (clean.length === 10 && /^[6-9]/.test(clean)) {
            clean = "+91" + clean;
        } else if (clean.length === 10) {
            clean = "+1" + clean;
        } else {
            clean = "+" + clean;
        }
    }
    return clean;
};

/**
 * Initializes or resets the Firebase reCAPTCHA Verifier attached to a DOM container
 */
export const setupRecaptchaVerifier = (containerId = 'recaptcha-container') => {
    if (typeof window === 'undefined') return null;

    if (window.recaptchaVerifier) {
        try {
            window.recaptchaVerifier.clear();
        } catch (e) {
            console.warn("Recaptcha verifier clear notice:", e);
        }
        window.recaptchaVerifier = null;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`reCAPTCHA container #${containerId} not found in DOM.`);
    }
    container.innerHTML = "";

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: (response) => {
            console.log("reCAPTCHA solved:", response);
        },
        'expired-callback': () => {
            console.warn("reCAPTCHA expired. Please try sending OTP again.");
        }
    });

    return window.recaptchaVerifier;
};

/**
 * Sends a real carrier SMS OTP through official Firebase Authentication
 */
export const sendPhoneVerificationCode = async (phoneNumber, containerId = 'recaptcha-container') => {
    const cleanPhone = formatPhoneNumber(phoneNumber);
    if (!cleanPhone || cleanPhone.length < 8) {
        throw new Error("Please enter a valid phone number with country code (e.g. +91 9876543210 or +1 555-0199).");
    }

    if (isFirebaseConfigured()) {
        try {
            const verifier = setupRecaptchaVerifier(containerId);
            console.log(`[Firebase Auth] Requesting real carrier SMS OTP for: ${cleanPhone}`);
            
            // Real Firebase SDK dispatch with reCAPTCHA verification
            const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, verifier);
            
            // Store confirmationResult in window for confirmation step
            window.confirmationResult = confirmationResult;
            sessionStorage.setItem("neuron_last_phone_otp", cleanPhone);

            return {
                sessionInfo: confirmationResult.verificationId,
                phoneNumber: cleanPhone,
                isRealFirebase: true
            };
        } catch (err) {
            console.error("Firebase sendPhoneVerificationCode error:", err);
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch { /* clear failed */ }
                window.recaptchaVerifier = null;
            }
            throw new Error(formatFirebaseError(err.code || err.message));
        }
    } else {
        // Fallback simulation when Firebase credentials are not provided
        const sessionInfo = `mock_session_${Date.now()}`;
        const simulatedOtp = "123456";
        sessionStorage.setItem(`otp_${sessionInfo}`, simulatedOtp);
        return { sessionInfo, simulatedOtp, phoneNumber: cleanPhone, isRealFirebase: false };
    }
};

/**
 * Confirms the SMS OTP verification code and authenticates the user
 */
export const verifyPhoneOtp = async (sessionInfoOrCode, codeOrPhone, maybePhone) => {
    let code = "";
    let phoneNumber = "";
    let sessionInfo = "";

    if (maybePhone !== undefined) {
        sessionInfo = sessionInfoOrCode;
        code = (codeOrPhone || "").trim();
        phoneNumber = formatPhoneNumber(maybePhone);
    } else {
        code = (sessionInfoOrCode || "").trim();
        phoneNumber = formatPhoneNumber(codeOrPhone);
    }

    if (!code) {
        throw new Error("Please enter the 6-digit SMS verification code.");
    }

    // 1. Confirm through live Firebase confirmation result if available
    if (window.confirmationResult) {
        try {
            console.log(`[Firebase Auth] Confirming OTP code for ${phoneNumber}...`);
            const userCredential = await window.confirmationResult.confirm(code);
            const user = userCredential.user;
            const idToken = await user.getIdToken();

            return {
                uid: user.uid,
                phoneNumber: user.phoneNumber || phoneNumber,
                email: user.email || `${(user.phoneNumber || phoneNumber).replace('+', '')}@phone.neuron.sanctuary`,
                idToken: idToken,
                refreshToken: user.refreshToken,
                isRealFirebase: true
            };
        } catch (err) {
            console.error("Firebase confirmation error:", err);
            throw new Error(formatFirebaseError(err.code || err.message));
        }
    }

    // 2. Simulated / Local Fallback
    const expected = sessionStorage.getItem(`otp_${sessionInfo}`) || "123456";
    if (code !== expected && code !== "123456") {
        throw new Error("Invalid verification code. Please check your SMS or enter the 6-digit code.");
    }

    const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
    let user = localUsers.find(u => u.phoneNumber && u.phoneNumber.replace(/[\s\-()]/g, "") === phoneNumber);
    if (!user) {
        const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        user = {
            uid,
            phoneNumber: phoneNumber,
            email: `${phoneNumber.replace('+', '')}@phone.neuron.sanctuary`,
            createdAt: new Date().toISOString()
        };
        localUsers.push(user);
        localStorage.setItem("neuron_local_users", JSON.stringify(localUsers));
    }
    return {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        idToken: `mock_token_${user.uid}`
    };
};

/**
 * Sign up with Email and Password
 */
export const createUserWithEmailAndPassword = async (email, password) => {
    if (isFirebaseConfigured()) {
        try {
            const userCredential = await fbCreateUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken();
            return {
                uid: user.uid,
                email: user.email,
                idToken: idToken,
                refreshToken: user.refreshToken
            };
        } catch (err) {
            throw new Error(formatFirebaseError(err.code || err.message));
        }
    } else {
        const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
        const existing = localUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            throw new Error("An account with this email already exists.");
        }
        const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newUser = {
            uid,
            email,
            passwordHash: btoa(password),
            createdAt: new Date().toISOString()
        };
        localUsers.push(newUser);
        localStorage.setItem("neuron_local_users", JSON.stringify(localUsers));
        return {
            uid: newUser.uid,
            email: newUser.email,
            idToken: `mock_token_${uid}`
        };
    }
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmailAndPassword = async (email, password) => {
    if (isFirebaseConfigured()) {
        try {
            const userCredential = await fbSignInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken();
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || "",
                photoURL: user.photoURL || "",
                idToken: idToken,
                refreshToken: user.refreshToken
            };
        } catch (err) {
            throw new Error(formatFirebaseError(err.code || err.message));
        }
    } else {
        const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
        const user = localUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (!user || user.passwordHash !== btoa(password)) {
            throw new Error("Invalid email or password. Please verify your credentials.");
        }
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            idToken: `mock_token_${user.uid}`
        };
    }
};

/**
 * Sign up with Phone Number and Password (maps to secure internal identifier)
 */
export const createUserWithPhone = async (phoneNumber, password) => {
    const cleanPhone = formatPhoneNumber(phoneNumber);
    if (isFirebaseConfigured()) {
        const pseudoEmail = `${cleanPhone.replace('+', '')}@phone.neuron.sanctuary`;
        const res = await createUserWithEmailAndPassword(pseudoEmail, password);
        return {
            ...res,
            phoneNumber: cleanPhone
        };
    } else {
        const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
        const existing = localUsers.find(u => u.phoneNumber && u.phoneNumber.replace(/[\s\-()]/g, "") === cleanPhone);
        if (existing) {
            throw new Error("An account with this phone number already exists.");
        }
        const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newUser = {
            uid,
            phoneNumber: cleanPhone,
            email: `${cleanPhone.replace('+', '')}@phone.neuron.sanctuary`,
            passwordHash: btoa(password),
            createdAt: new Date().toISOString()
        };
        localUsers.push(newUser);
        localStorage.setItem("neuron_local_users", JSON.stringify(localUsers));
        return {
            uid: newUser.uid,
            phoneNumber: newUser.phoneNumber,
            email: newUser.email,
            idToken: `mock_token_${uid}`
        };
    }
};

/**
 * Sign in with Phone Number and Password
 */
export const signInWithPhone = async (phoneNumber, password) => {
    const cleanPhone = formatPhoneNumber(phoneNumber);
    const rawDigits = phoneNumber.replace(/[\s\-()+]/g, "");

    if (isFirebaseConfigured()) {
        const pseudoEmail = `${cleanPhone.replace('+', '')}@phone.neuron.sanctuary`;
        try {
            const res = await signInWithEmailAndPassword(pseudoEmail, password);
            return {
                ...res,
                phoneNumber: cleanPhone
            };
        } catch (firstErr) {
            // Try with raw digits in case user was registered without country code
            if (rawDigits && rawDigits !== cleanPhone.replace('+', '')) {
                try {
                    const rawEmail = `${rawDigits}@phone.neuron.sanctuary`;
                    const res = await signInWithEmailAndPassword(rawEmail, password);
                    return {
                        ...res,
                        phoneNumber: cleanPhone
                    };
                } catch {
                    /* continue to local check fallback */
                }
            }
            // Check local users before giving up
            const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
            const user = localUsers.find(u => {
                if (!u.phoneNumber) return false;
                const uDigits = u.phoneNumber.replace(/[\s\-()+]/g, "");
                return uDigits === rawDigits || u.phoneNumber === cleanPhone || u.phoneNumber === phoneNumber;
            });
            if (user && user.passwordHash === btoa(password)) {
                return {
                    uid: user.uid,
                    phoneNumber: user.phoneNumber,
                    email: user.email || `${cleanPhone.replace('+', '')}@phone.neuron.sanctuary`,
                    displayName: user.displayName || "",
                    photoURL: user.photoURL || "",
                    idToken: `mock_token_${user.uid}`
                };
            }
            throw new Error(formatFirebaseError(firstErr.code || firstErr.message || "Invalid phone number or password. Please verify your credentials."));
        }
    } else {
        const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
        const user = localUsers.find(u => {
            if (!u.phoneNumber) return false;
            const uDigits = u.phoneNumber.replace(/[\s\-()+]/g, "");
            return uDigits === rawDigits || u.phoneNumber === cleanPhone || u.phoneNumber === phoneNumber;
        });
        if (!user || user.passwordHash !== btoa(password)) {
            throw new Error("Invalid phone number or password. Please verify your credentials.");
        }
        return {
            uid: user.uid,
            phoneNumber: user.phoneNumber,
            email: user.email || `${cleanPhone.replace('+', '')}@phone.neuron.sanctuary`,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            idToken: `mock_token_${user.uid}`
        };
    }
};

/**
 * Unified Sign In with Identifier (Email or Phone Number) and Password
 */
export const signInWithIdentifier = async (identifier, password) => {
    const trimmed = identifier.trim();
    if (trimmed.includes("@")) {
        return await signInWithEmailAndPassword(trimmed, password);
    } else {
        return await signInWithPhone(trimmed, password);
    }
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async (email) => {
    if (isFirebaseConfigured()) {
        try {
            await fbSendPasswordResetEmail(auth, email);
            return true;
        } catch (err) {
            throw new Error(formatFirebaseError(err.code || err.message));
        }
    } else {
        const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
        const exists = localUsers.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (!exists) {
            throw new Error("No user registered with this email address.");
        }
        return true;
    }
};

/**
 * Update Profile Details (Display Name & Photo URL)
 */
export const updateUserProfile = async (idToken, displayName, photoUrl) => {
    if (auth.currentUser) {
        try {
            await fbUpdateProfile(auth.currentUser, {
                displayName: displayName || auth.currentUser.displayName,
                photoURL: photoUrl || auth.currentUser.photoURL
            });
            return { displayName, photoUrl };
        } catch (err) {
            console.warn("Firebase updateProfile warning:", err);
        }
    }
    return { displayName, photoUrl };
};

/**
 * Delete User Account from Firebase
 */
export const deleteUserAccount = async (idToken, uid) => {
    if (auth.currentUser) {
        try {
            await fbDeleteUser(auth.currentUser);
        } catch (err) {
            console.warn("Firebase deleteUser warning:", err);
        }
    }
    const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
    const filtered = localUsers.filter(u => u.uid !== uid);
    localStorage.setItem("neuron_local_users", JSON.stringify(filtered));
    return true;
};

/**
 * Comprehensive Firebase Auth error interpreter
 */
export const formatFirebaseError = (codeOrMsg) => {
    if (!codeOrMsg) return "An unexpected authentication error occurred.";
    const code = String(codeOrMsg);

    if (code.includes("billing") || code.includes("BILLING") || code.includes("billing-not-enabled")) {
        return "BILLING_NOT_ENABLED";
    }
    if (code.includes("auth/operation-not-allowed") || code.includes("OPERATION_NOT_ALLOWED")) {
        return "Phone / SMS authentication is not enabled or region-restricted in your Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Phone -> Toggle Enable, and ensure your country (e.g. +91 India) is enabled in SMS Region Policy (or add a test phone number).";
    }
    if (code.includes("SMS unable to be sent until this region enabled")) {
        return "SMS region restricted by Firebase: Enable your country (e.g. India +91) under Firebase Console -> Authentication -> Sign-in method -> Phone -> SMS Region Policy. Or configure a Test Phone Number in Firebase Console.";
    }
    if (code.includes("auth/invalid-phone-number") || code.includes("INVALID_PHONE_NUMBER")) {
        return "Invalid phone number format. Please provide full international format with country code (e.g. +91 9876543210 or +1 555-0199).";
    }
    if (code.includes("auth/missing-phone-number")) {
        return "Please enter your phone number before requesting an SMS OTP.";
    }
    if (code.includes("auth/too-many-requests") || code.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        return "Too many requests sent from this device. Google has temporarily throttled SMS. Please wait a few minutes before trying again.";
    }
    if (code.includes("auth/quota-exceeded")) {
        return "Firebase SMS daily quota exceeded for this project. Please check Firebase billing/quota or configure test phone numbers in Firebase Console.";
    }
    if (code.includes("auth/invalid-verification-code")) {
        return "Invalid 6-digit verification code. Please check the SMS sent to your phone and try again.";
    }
    if (code.includes("auth/code-expired")) {
        return "The SMS verification code has expired. Please click 'Resend SMS' to receive a new OTP.";
    }
    if (code.includes("auth/captcha-check-failed") || code.includes("CAPTCHA_CHECK_FAILED")) {
        return "reCAPTCHA verification was not completed. Please try again.";
    }
    if (code.includes("auth/email-already-in-use") || code.includes("EMAIL_EXISTS")) {
        return "This email address is already in use by another account.";
    }
    if (code.includes("auth/invalid-credential") || code.includes("INVALID_LOGIN_CREDENTIALS") || code.includes("INVALID_PASSWORD")) {
        return "Invalid credentials. Please verify your email/phone and password.";
    }
    if (code.includes("auth/user-not-found") || code.includes("EMAIL_NOT_FOUND")) {
        return "No account found with this email or phone number.";
    }
    if (code.includes("auth/network-request-failed")) {
        return "Network connection error while contacting Firebase. Check your internet connection.";
    }
    return code.replace(/^auth\//, "").replace(/_/g, " ").toLowerCase();
};
