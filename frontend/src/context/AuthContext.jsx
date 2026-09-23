import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import {
    createUserWithEmailAndPassword,
    createUserWithPhone,
    signInWithIdentifier,
    sendPhoneVerificationCode,
    verifyPhoneOtp,
    sendPasswordResetEmail,
    updateUserProfile,
    deleteUserAccount,
    isFirebaseConfigured
} from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = localStorage.getItem("neuron_current_user");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

    const saveSessionUser = (userObj) => {
        setCurrentUser(userObj);
        try {
            localStorage.setItem("neuron_current_user", JSON.stringify(userObj));
            if (userObj && userObj.uid) {
                localStorage.setItem(`neuron_profile_${userObj.uid}`, JSON.stringify(userObj));
            }
        } catch (e) {
            console.warn("Could not save session user to localStorage:", e);
        }
    };

    /**
     * Signup with Email or Phone Number, Password, Name, and live camera snapshot
     */
    const signup = async (arg1, arg2, arg3, arg4) => {
        setLoading(true);
        setError(null);

        let email = "";
        let phoneNumber = "";
        let password = "";
        let displayName = "";
        let photoBlobOrBase64 = null;

        if (typeof arg1 === 'object' && arg1 !== null) {
            email = (arg1.email || "").trim();
            phoneNumber = (arg1.phoneNumber || "").trim();
            password = arg1.password || "";
            displayName = (arg1.displayName || "").trim();
            photoBlobOrBase64 = arg1.photoBlobOrBase64 || arg1.photo || null;
        } else {
            email = (arg1 || "").trim();
            password = arg2 || "";
            displayName = (arg3 || "").trim();
            photoBlobOrBase64 = arg4 || null;
        }

        try {
            // 1. Create account via Firebase / Auth Engine (Email or Phone)
            let authRes;
            if (phoneNumber && !email) {
                authRes = await createUserWithPhone(phoneNumber, password);
            } else {
                authRes = await createUserWithEmailAndPassword(email, password);
            }
            const uid = authRes.uid;

            let photoUrl = "";
            let photoBase64 = "";

            if (typeof photoBlobOrBase64 === "string") {
                photoBase64 = photoBlobOrBase64;
            }

            // 2. Register Face into Neural Cortex for Biometric Face Login
            if (photoBlobOrBase64) {
                try {
                    let fileToSend = photoBlobOrBase64;
                    if (typeof photoBlobOrBase64 === "string") {
                        const resBlob = await fetch(photoBlobOrBase64);
                        fileToSend = await resBlob.blob();
                    }

                    const formData = new FormData();
                    formData.append("file", fileToSend, "profile_face.jpg");
                    formData.append("user_id", uid);
                    formData.append("name", displayName);
                    if (email) formData.append("email", email);
                    if (phoneNumber) formData.append("phone", phoneNumber);

                    const regRes = await axios.post(`${apiBase}/auth/register-face`, formData);
                    if (regRes.data && regRes.data.image_base64) {
                        photoBase64 = regRes.data.image_base64;
                    }
                } catch (faceErr) {
                    console.warn("Face embedding registration note:", faceErr);
                }
            }

            // 3. Update Profile Name
            try {
                await updateUserProfile(authRes.idToken, displayName, photoUrl);
            } catch (pErr) {
                console.warn("Update profile note:", pErr);
            }

            const normalizePhoto = (raw) => {
                if (!raw || typeof raw !== 'string') return '';
                if (raw.startsWith('data:image/') || raw.startsWith('http')) return raw;
                return `data:image/jpeg;base64,${raw}`;
            };

            const userProfile = {
                uid,
                email: email || authRes.email || (phoneNumber ? `${phoneNumber}@phone.neuron.sanctuary` : ""),
                phoneNumber: phoneNumber || authRes.phoneNumber || "",
                displayName: displayName || "Sanctuary Member",
                photoURL: normalizePhoto(photoBase64 || photoUrl),
                createdAt: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
                idToken: authRes.idToken
            };

            saveSessionUser(userProfile);
            return userProfile;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Unified Sign In with Email OR Phone Number and Password
     */
    const login = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const authRes = await signInWithIdentifier(identifier, password);
            const uid = authRes.uid;

            // Retrieve stored profile info if available
            const savedProfile = JSON.parse(localStorage.getItem(`neuron_profile_${uid}`) || "{}");

            const isPhone = !identifier.includes("@");
            const userProfile = {
                uid,
                email: authRes.email || (!isPhone ? identifier : savedProfile.email || ""),
                phoneNumber: authRes.phoneNumber || (isPhone ? identifier : savedProfile.phoneNumber || ""),
                displayName: authRes.displayName || savedProfile.displayName || identifier.split("@")[0],
                photoURL: authRes.photoURL || savedProfile.photoURL || "",
                createdAt: savedProfile.createdAt || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
                idToken: authRes.idToken
            };

            saveSessionUser(userProfile);
            return userProfile;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Request Phone SMS Verification OTP
     */
    const sendPhoneOtp = async (phoneNumber) => {
        setLoading(true);
        setError(null);
        try {
            const res = await sendPhoneVerificationCode(phoneNumber);
            return res;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verify Phone Verification OTP and Authenticate / Register User
     */
    const verifyPhoneOtpAndLogin = async ({ sessionInfo, code, phoneNumber, displayName, photoBlobOrBase64, isSignup: _isSignup = false }) => {
        setLoading(true);
        setError(null);
        try {
            const authRes = await verifyPhoneOtp(sessionInfo, code, phoneNumber);
            const uid = authRes.uid;

            let photoBase64 = "";
            if (typeof photoBlobOrBase64 === "string") {
                photoBase64 = photoBlobOrBase64;
            }

            // Register face embedding if snapshot provided
            if (photoBlobOrBase64) {
                try {
                    let fileToSend = photoBlobOrBase64;
                    if (typeof photoBlobOrBase64 === "string") {
                        const resBlob = await fetch(photoBlobOrBase64);
                        fileToSend = await resBlob.blob();
                    }

                    const formData = new FormData();
                    formData.append("file", fileToSend, "profile_face.jpg");
                    formData.append("user_id", uid);
                    formData.append("name", displayName || "Sanctuary Member");
                    formData.append("phone", phoneNumber);

                    const regRes = await axios.post(`${apiBase}/auth/register-face`, formData);
                    if (regRes.data && regRes.data.image_base64) {
                        photoBase64 = regRes.data.image_base64;
                    }
                } catch (faceErr) {
                    console.warn("Face embedding note:", faceErr);
                }
            }

            const savedProfile = JSON.parse(localStorage.getItem(`neuron_profile_${uid}`) || "{}");
            const userProfile = {
                uid,
                phoneNumber: authRes.phoneNumber || phoneNumber,
                email: authRes.email || `${phoneNumber}@phone.neuron.sanctuary`,
                displayName: displayName || authRes.displayName || savedProfile.displayName || "Sanctuary Member",
                photoURL: photoBase64 || authRes.photoURL || savedProfile.photoURL || "",
                createdAt: savedProfile.createdAt || new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
                idToken: authRes.idToken
            };

            saveSessionUser(userProfile);
            return userProfile;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Biometric Face Scan Login
     */
    const loginWithFace = async (imageBlob) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("file", imageBlob, "face_scan.jpg");

            const res = await axios.post(`${apiBase}/auth/face-login`, formData);
            const data = res.data;

            if (data.status === "authenticated" && data.user_id) {
                const userRole = data.role || (data.is_caregiver ? "caregiver" : "patient");
                // FIX 6: use patient_id for caregivers so the app knows which patient they manage
                const patientId = data.patient_id || data.user_id;
                const normalizePhoto = (raw) => {
                    if (!raw || typeof raw !== 'string') return '';
                    if (raw.startsWith('data:image/') || raw.startsWith('http')) return raw;
                    return `data:image/jpeg;base64,${raw}`;
                };
                const userProfile = {
                    uid: data.user_id,
                    email: data.email || `${data.user_id}@neuron.sanctuary`,
                    phoneNumber: data.phone || "",
                    displayName: data.name || (userRole === "caregiver" ? "Caregiver" : "Recognized Member"),
                    photoURL: normalizePhoto(data.image_base64),
                    role: userRole,
                    is_caregiver: Boolean(data.is_caregiver || userRole === "caregiver"),
                    patient_id: patientId,
                    createdAt: "Biometric Access Active",
                    idToken: `face_auth_${data.user_id}`
                };
                saveSessionUser(userProfile);
                return { success: true, user: userProfile, role: userRole };
            } else {
                const message = data.message || "Face not recognized. Please sign in with email and password.";
                setError(message);
                return { success: false, message };
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Face scan verification failed.";
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Caregiver Login with Email/Phone & Password
     */
    const caregiverLogin = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${apiBase}/auth/caregiver-login`, {
                identifier: identifier.trim(),
                password: password
            });
            const data = res.data;
            if (data.status === "authenticated" && data.user) {
                const userProfile = {
                    uid: data.user.id || data.user.uid || `caregiver_${Date.now()}`,
                    email: data.user.email || identifier,
                    phoneNumber: data.user.phone || "",
                    displayName: data.user.name || "Caregiver",
                    role: "caregiver",
                    is_caregiver: true,
                    patient_id: data.user.patient_id || "default_user",
                    photoURL: data.user.image_base64 || "",
                    createdAt: "Caregiver Access Active",
                    idToken: `caregiver_auth_${data.user.id || Date.now()}`
                };
                saveSessionUser(userProfile);
                return { success: true, user: userProfile, role: "caregiver" };
            } else {
                const msg = data.message || "Invalid caregiver credentials";
                setError(msg);
                throw new Error(msg);
            }
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || "Failed to log in as caregiver.";
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send Password Reset Email
     */
    const resetPassword = async (email) => {
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(email);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout
     */
    const logout = () => {
        setCurrentUser(null);
        try {
            localStorage.removeItem("neuron_current_user");
        } catch (e) {
            console.warn(e);
        }
    };

    /**
     * Permanently Delete Account and all User Data
     */
    const deleteAccount = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const uid = currentUser.uid;
            const idToken = currentUser.idToken;
            const email = currentUser.email;
            const isCaregiver = Boolean(currentUser.is_caregiver || currentUser.role === 'caregiver');

            // 1. Purge all user-scoped data from backend Qdrant & gentle anchors & caregivers.json
            try {
                await axios.delete(`${apiBase}/auth/user/${encodeURIComponent(uid)}`, {
                    params: { email: email || '' }
                });
            } catch (beErr) {
                console.warn("Backend user data purge note:", beErr);
            }

            // If caregiver, ALSO explicitly delete from caregivers endpoint using uid and email
            if (isCaregiver || (uid && uid.startsWith('cg_'))) {
                try {
                    await axios.delete(`${apiBase}/caregivers/${encodeURIComponent(uid)}`);
                } catch (cgErr) {
                    console.warn("Caregiver explicit delete note:", cgErr);
                }
                if (email) {
                    try {
                        await axios.delete(`${apiBase}/caregivers/${encodeURIComponent(email)}`);
                    } catch (cgEmailErr) {}
                }
            }

            // 2. Delete user account from Firebase Auth (if not synthetic token)
            try {
                if (idToken && !idToken.startsWith("caregiver_auth_") && !idToken.startsWith("face_auth_")) {
                    await deleteUserAccount(idToken, uid);
                }
            } catch (authErr) {
                console.warn("Firebase Auth deletion note:", authErr);
            }

            // 3. Clear local profile data & local users cache
            try {
                localStorage.removeItem(`neuron_profile_${uid}`);
                localStorage.removeItem("neuron_current_user");
                const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
                const filtered = localUsers.filter(u => u.uid !== uid && u.id !== uid && u.email !== email);
                localStorage.setItem("neuron_local_users", JSON.stringify(filtered));
            } catch { /* local data cleanup - ignore errors */ }

            setCurrentUser(null);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                loading,
                error,
                signup,
                login,
                caregiverLogin,
                sendPhoneOtp,
                verifyPhoneOtpAndLogin,
                loginWithFace,
                resetPassword,
                logout,
                deleteAccount,
                isFirebaseConfigured: isFirebaseConfigured()
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
