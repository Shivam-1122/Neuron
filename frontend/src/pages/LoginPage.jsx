import React, { useState, useRef, useEffect } from 'react';
import { 
    User, 
    Lock, 
    Mail, 
    Camera, 
    ScanFace, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight, 
    RotateCcw, 
    AlertCircle, 
    CheckCircle2, 
    Terminal, 
    Eye, 
    EyeOff, 
    KeyRound, 
    HeartHandshake,
    RefreshCw,
    Phone,
    Check,
    Upload,
    Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import soundManager from '../utils/soundManager';
import neuronLogoIcon from '../assets/neuron-logo-icon.png';

const LoginPage = ({ onSelectRole, onLoginSuccess }) => {
    const { 
        login, 
        caregiverLogin,
        signup, 
        loginWithFace, 
        resetPassword 
    } = useAuth();

    // Modes: 'signin' | 'signup' | 'face_scan' | 'forgot_password'
    const [mode, setMode] = useState('signin');
    const [selectedRole, setSelectedRole] = useState('patient'); // 'patient' | 'caregiver'
    const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'

    // Form Fields
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Signup Camera State
    const [signupPhoto, setSignupPhoto] = useState(null); // Data URL
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const faceScanFileInputRef = useRef(null);
    const signupFileInputRef = useRef(null);

    // Face Scan Login State
    const [isScanningFace, setIsScanningFace] = useState(false);
    const [faceScanStatus, setFaceScanStatus] = useState('');

    // Status / Feedback
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Clean up camera stream on unmount or mode switch
    const stopCamera = () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    try { track.stop(); } catch (e) {}
                });
                streamRef.current = null;
            }
        } catch (e) {}
        try {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks ? videoRef.current.srcObject.getTracks() : [];
                tracks.forEach(t => { try { t.stop(); } catch (e) {} });
                videoRef.current.srcObject = null;
            }
        } catch (e) {}
        setCameraActive(false);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Start Camera with Progressive Fallback (Handles Windows Webcam Constraints)
    const startCamera = async () => {
        stopCamera();
        setCameraError(null);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraActive(false);
            setCameraError("Camera API not supported or blocked in this browser. Please use Chrome, Edge, or Firefox over localhost or https.");
            return;
        }

        try {
            let stream;
            try {
                // Tier 1: User facing ideal 640x480
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                    audio: false
                });
            } catch (firstErr) {
                console.warn("Primary camera constraints failed, attempting tier 2 fallback:", firstErr);
                try {
                    // Tier 2: facingMode: 'user' without resolution constraints
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user' },
                        audio: false
                    });
                } catch (secondErr) {
                    console.warn("Tier 2 camera constraints failed, attempting fallback to { video: true }:", secondErr);
                    // Tier 3: standard video: true
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                }
            }

            streamRef.current = stream;
            setCameraActive(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play().catch(e => console.warn("Video play notice:", e));
                    }
                    setCameraActive(true);
                };
                await videoRef.current.play().catch(e => console.warn("Video play notice:", e));
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraActive(false);
            let userMsg = "Camera device unavailable or permission denied.";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                userMsg = "Camera permission was denied in your browser. Click the lock (🔒) or camera icon in your browser address bar to Allow access, then click 'Retry Camera'.";
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                userMsg = "Your webcam is in use by another app or Windows process. Close Zoom/Teams/Camera and click 'Retry Camera'.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                userMsg = "No webcam device was found. You can scan your face by uploading a photo file below.";
            } else if (err.message) {
                userMsg = `Camera error: ${err.message}`;
            }
            setCameraError(userMsg);
        }
    };

    // Keep video element synchronized with camera stream whenever it changes
    useEffect(() => {
        if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.warn("Video stream play notice:", e));
        }
    }, [cameraActive, mode]);

    // When switching to 'face_scan' or 'signup', manage camera
    useEffect(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
        if (mode === 'face_scan') {
            startCamera();
        } else if (mode === 'signup' && !signupPhoto) {
            startCamera();
        } else {
            stopCamera();
        }
    }, [mode]);

    // Handle Snapshot capture for Signup
    const handleSnapSignupPhoto = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setSignupPhoto(dataUrl);
        stopCamera();
        soundManager.playChime('click');
    };

    // Handle File Upload for Signup Photo
    const handleSignupFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
            setSignupPhoto(uploadEvent.target.result);
            stopCamera();
            soundManager.playChime('click');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleRetakeSignupPhoto = () => {
        setSignupPhoto(null);
        startCamera();
    };

    // Empty all form fields
    const resetFormFields = () => {
        setEmail('');
        setPhoneNumber('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setSignupPhoto(null);
    };

    // 1. SIGN IN (EMAIL OR PHONE NUMBER + PASSWORD - NO OTP)
    const handleSignIn = async (e) => {
        if (e) e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        const identifier = (authMethod === 'phone' ? phoneNumber : email).trim();

        if (!identifier) {
            setErrorMessage(authMethod === 'phone' ? "Please enter your phone number." : "Please enter your email address.");
            return;
        }

        if (!password) {
            setErrorMessage("Please enter your password.");
            return;
        }

        setLoading(true);
        try {
            soundManager.playChime('click');
            if (selectedRole === 'caregiver') {
                await caregiverLogin(identifier, password);
            } else {
                await login(identifier, password);
            }
            soundManager.playChime('send');
            resetFormFields();
            if (onLoginSuccess) {
                onLoginSuccess(selectedRole);
            } else if (onSelectRole) {
                onSelectRole(selectedRole);
            }
        } catch (err) {
            setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
        } finally {
            setLoading(false);
        }
    };

    // 2. SIGN UP WITH LIVE PHOTO (PATIENT ONLY - EMAIL OR PHONE NUMBER + PASSWORD)
    const handleSignUp = async (e) => {
        if (e) e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!displayName.trim()) {
            setErrorMessage("Please enter your full name.");
            return;
        }

        if (authMethod === 'email' && !email.trim()) {
            setErrorMessage("Please enter a valid email address.");
            return;
        }

        if (authMethod === 'phone' && !phoneNumber.trim()) {
            setErrorMessage("Please enter a valid phone number.");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }
        if (!signupPhoto) {
            setErrorMessage("Please take a profile photo snapshot with the camera to activate face recognition.");
            return;
        }

        setLoading(true);
        try {
            soundManager.playChime('click');
            await signup({
                email: authMethod === 'email' ? email.trim() : "",
                phoneNumber: authMethod === 'phone' ? phoneNumber.trim() : "",
                password,
                displayName: displayName.trim(),
                photoBlobOrBase64: signupPhoto
            });
            soundManager.playChime('send');
            setSuccessMessage("Account created successfully! Entering Sanctuary...");
            resetFormFields();
            setTimeout(() => {
                if (onLoginSuccess) {
                    onLoginSuccess(selectedRole);
                } else if (onSelectRole) {
                    onSelectRole(selectedRole);
                }
            }, 800);
        } catch (err) {
            setErrorMessage(err.message || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // General Biometric Face Verification (Camera Blob or Photo File)
    const authenticateFaceBlob = async (blob) => {
        if (!blob || isScanningFace) return;
        setIsScanningFace(true);
        setFaceScanStatus("Matching facial embedding against neural vault...");
        setErrorMessage(null);

        try {
            const res = await loginWithFace(blob);

            if (res.success) {
                setFaceScanStatus(`Verified: Welcome, ${res.user.displayName || 'Patient'}!`);
                soundManager.playChime('send');
                stopCamera();
                const finalRole = res.role || res.user?.role || 'patient';
                setTimeout(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess(finalRole);
                    } else if (onSelectRole) {
                        onSelectRole(finalRole);
                    }
                }, 800);
            } else {
                setErrorMessage(res.message || "Face not recognized in Sanctuary vault. Please retry or sign in with email/phone.");
                setFaceScanStatus("");
            }
        } catch (err) {
            setErrorMessage(err.message || "Face scan verification failed. Ensure face is centered and well lit.");
            setFaceScanStatus("");
        } finally {
            setIsScanningFace(false);
        }
    };

    // 3a. BIOMETRIC 1-CLICK FACE SCAN LOGIN (CAMERA SNAPSHOT)
    const handlePerformFaceScanLogin = async () => {
        if (!videoRef.current || !cameraActive || isScanningFace) return;
        try {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });

            if (!blob) throw new Error("Could not capture image from camera.");
            await authenticateFaceBlob(blob);
        } catch (err) {
            setErrorMessage(err.message || "Camera snapshot failed.");
        }
    };

    // 3b. BIOMETRIC 1-CLICK FACE SCAN LOGIN (UPLOADED PHOTO FILE)
    const handleFaceScanFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        await authenticateFaceBlob(file);
    };

    // 4. FORGOT PASSWORD
    const handleForgotPassword = async (e) => {
        if (e) e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!email.trim()) {
            setErrorMessage("Please enter your registered email address.");
            return;
        }

        setLoading(true);
        try {
            soundManager.playChime('click');
            await resetPassword(email.trim());
            setSuccessMessage("Password reset email sent! Check your inbox for recovery instructions.");
        } catch (err) {
            setErrorMessage(err.message || "Failed to send reset link. Verify your email address.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex-1 min-h-0 bg-[#060a12] text-slate-100 flex flex-col items-center justify-start relative overflow-y-auto cyber-grid-bg px-4 py-5 sm:py-7 select-none">
            {/* Ambient Background Glows */}
            <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Logo Brand Mark */}
            <div className="relative z-10 flex flex-col items-center justify-center mb-2 select-none group">
                <div className="relative p-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-md">
                    <img 
                        src={neuronLogoIcon} 
                        alt="Neuron Sanctuary Logo" 
                        className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            </div>

            {/* Header Telemetry */}
            <div className="relative z-10 text-center mb-4 space-y-1.5 max-w-lg shrink-0">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-[11px] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <Terminal size={12} />
                    <span>AUTHENTICATION GATEWAY // SECURE ACCESS</span>
                </div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                    {mode === 'signup' && "Create Patient Sanctuary Profile"}
                    {mode === 'signin' && (selectedRole === 'caregiver' ? "Caregiver Access Portal" : "Access Neural Protocol")}
                    {mode === 'face_scan' && "Biometric Neural Face Login"}
                    {mode === 'forgot_password' && "Recover Sanctuary Access"}
                </h1>
                <p className="font-mono text-[11px] text-slate-400">
                    {mode === 'signup' && "Sign up via Email or Phone, take a live photo for face biometrics, and initialize your memory cortex."}
                    {mode === 'signin' && (selectedRole === 'caregiver' ? "Sign in via Email or Phone Number and Password to access companion care." : "Sign in with Email or Phone Number & Password, or 1-click Biometric Face Scan.")}
                    {mode === 'face_scan' && "Look straight into the camera to authenticate via 512-dim facial vectors."}
                    {mode === 'forgot_password' && "Enter your registered email to receive an instant secure reset link."}
                </p>
            </div>

            {/* Main Auth Container Card */}
            <div className="relative z-10 w-full max-w-md bg-[#0c1322]/95 border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl mb-8">
                
                {/* Navigation Mode Pill Tabs (Sign In vs Sign Up) */}
                {mode !== 'forgot_password' && (
                    <div className="grid grid-cols-2 gap-2 bg-[#121929] p-1.5 rounded-2xl border border-white/[0.06] mb-4">
                        <button
                            type="button"
                            onClick={() => { setMode('signin'); stopCamera(); resetFormFields(); }}
                            className={`py-2 px-3 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mode === 'signin' || mode === 'face_scan'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Lock size={13} />
                            <span>Sign In</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setMode('signup'); setSelectedRole('patient'); resetFormFields(); }}
                            className={`py-2 px-3 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                mode === 'signup'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Camera size={13} />
                            <span>Sign Up + Camera</span>
                        </button>
                    </div>
                )}

                {/* Status Banners */}
                {errorMessage && (
                    <div className="mb-4 animate-fadeIn">
                        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{errorMessage}</span>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{successMessage}</span>
                    </div>
                )}

                {/* ROLE PICKER TOGGLE (Sign In mode only - Caregivers are enrolled inside Caregiver Portal) */}
                {mode === 'signin' && (
                    <div className="mb-4 flex items-center justify-between p-2.5 bg-[#141c2e] rounded-xl border border-white/[0.06]">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Access Mode:</span>
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => setSelectedRole('patient')}
                                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                    selectedRole === 'patient'
                                        ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <User size={12} />
                                <span>Patient</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedRole('caregiver'); if (mode === 'face_scan') setMode('signin'); }}
                                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                    selectedRole === 'caregiver'
                                        ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <HeartHandshake size={12} />
                                <span>Caregiver</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* SIGN UP ROLE NOTE */}
                {mode === 'signup' && (
                    <div className="mb-3.5 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 text-[11px] font-mono">
                        <User size={13} className="text-amber-400 shrink-0" />
                        <span>Patient Registration • Caregivers enroll inside Caregiver Portal</span>
                    </div>
                )}

                {/* VIEW 1: SIGN IN */}
                {mode === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                        {/* Biometric Face Scan Quick Button: PATIENTS ONLY */}
                        {selectedRole === 'patient' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setMode('face_scan')}
                                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:shadow-[0_0_25px_rgba(0,240,255,0.3)] cursor-pointer group"
                                >
                                    <ScanFace size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                                    <span>SIGN IN WITH FACE SCAN</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                                </button>

                                <div className="relative flex items-center justify-center my-3">
                                    <div className="border-t border-white/[0.08] w-full" />
                                    <span className="bg-[#0c1322] px-3 font-mono text-[10px] text-slate-500 uppercase tracking-widest absolute">
                                        Or Sign In With Password
                                    </span>
                                </div>
                            </>
                        )}

                        {/* AUTH METHOD SELECTOR: EMAIL VS PHONE NUMBER (PASSWORD ONLY, NO OTP) */}
                        <div className="flex gap-1.5 p-1 bg-[#121929] rounded-xl border border-white/[0.06]">
                            <button
                                type="button"
                                onClick={() => { setAuthMethod('email'); setErrorMessage(null); }}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    authMethod === 'email'
                                        ? (selectedRole === 'caregiver'
                                            ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40 shadow-sm'
                                            : 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm')
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Mail size={13} />
                                <span>Email</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMethod('phone'); setErrorMessage(null); }}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    authMethod === 'phone'
                                        ? (selectedRole === 'caregiver'
                                            ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40 shadow-sm'
                                            : 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm')
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Phone size={13} />
                                <span>Phone Number</span>
                            </button>
                        </div>

                        {/* EMAIL OR PHONE INPUT */}
                        {authMethod === 'email' ? (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-mono text-slate-400">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={selectedRole === 'caregiver' ? "caregiver@example.com" : "member@neuron.sanctuary"}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#121929] border border-white/[0.08] focus:border-cyan-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-mono text-slate-400">Registered Phone Number</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder={selectedRole === 'caregiver' ? "+91 98765 43210 or 9876543210" : "+91 98765 43210 or (555) 000-0000"}
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#121929] border border-white/[0.08] focus:border-cyan-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-[10px] font-mono text-slate-500">Sign in directly with your password (no OTP required).</p>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-mono text-slate-400">Password</label>
                                <button
                                    type="button"
                                    onClick={() => setMode('forgot_password')}
                                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 bg-[#121929] border border-white/[0.08] focus:border-cyan-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-xl text-slate-950 font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                                selectedRole === 'caregiver'
                                    ? 'bg-purple-500 hover:bg-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                    : 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={15} className="animate-spin" />
                                    <span>AUTHENTICATING...</span>
                                </>
                            ) : (
                                <>
                                    <span>ENTER SANCTUARY</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* VIEW 2: BIOMETRIC FACE SCAN LOGIN (PATIENTS ONLY) */}
                {mode === 'face_scan' && (
                    <div className="space-y-4">
                        {/* Hidden file input for Photo Upload */}
                        <input
                            ref={faceScanFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFaceScanFileUpload}
                        />

                        <div className="relative w-full h-48 sm:h-56 rounded-2xl bg-black border-2 border-cyan-500/40 overflow-hidden shadow-[0_0_25px_rgba(0,240,255,0.2)]">
                            {/* Live Video Feed - Always mounted in DOM to guarantee ref is attached */}
                            <video
                                ref={(el) => {
                                    videoRef.current = el;
                                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                                        el.srcObject = streamRef.current;
                                        el.play().catch(e => console.warn("Video ref play notice:", e));
                                    }
                                }}
                                autoPlay
                                playsInline
                                muted
                                onLoadedMetadata={() => {
                                    if (videoRef.current) {
                                        videoRef.current.play().catch(e => console.warn("Video play notice:", e));
                                    }
                                    setCameraActive(true);
                                }}
                                className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
                                    cameraActive ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                                }`}
                            />

                            {/* Camera Status or Guidance Overlay when camera is inactive */}
                            {!cameraActive && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0a1120] to-black text-center space-y-2 z-10">
                                    <div className="p-3 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                                        <ScanFace size={28} className="animate-pulse" />
                                    </div>
                                    <span className="text-xs font-mono text-cyan-200">
                                        {cameraError ? "Camera Access Needed" : "Starting Visual Sensor..."}
                                    </span>
                                    <p className="text-[11px] text-slate-400 max-w-xs font-mono">
                                        {cameraError 
                                            ? cameraError 
                                            : "Please allow camera access in your browser to start biometric scanning."}
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
                                        >
                                            <RefreshCw size={12} />
                                            <span>{cameraError ? "Retry Camera" : "Start Camera"}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => faceScanFileInputRef.current?.click()}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Upload size={12} />
                                            <span>Use Photo File</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Cyberpunk Face Scanning HUD when active */}
                            {cameraActive && (
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-10">
                                    <div className="w-48 h-48 border-2 border-cyan-400/50 rounded-2xl relative animate-pulse flex items-center justify-center">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
                                        <div className="w-3 h-3 border border-cyan-400/80 rounded-full" />
                                    </div>
                                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00f0ff] animate-bounce" />
                                </div>
                            )}

                            {/* Camera Status Overlay */}
                            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-black/75 backdrop-blur-sm border border-cyan-500/30 flex items-center justify-between text-[11px] font-mono text-cyan-300">
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`}></span>
                                    <span>FACIAL RETINA SENSOR</span>
                                </span>
                                <span>{isScanningFace ? "ANALYZING VECTOR..." : (cameraActive ? "SCANNER READY" : (cameraError ? "CAMERA LOCKED" : "INITIALIZING..."))}</span>
                            </div>
                        </div>

                        {cameraError && (
                            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                                    <span className="leading-snug">{cameraError}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="self-start px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800/80 border border-red-400/40 text-white font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                                >
                                    <RefreshCw size={11} />
                                    <span>Retry Camera Access</span>
                                </button>
                            </div>
                        )}

                        {faceScanStatus && (
                            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center justify-center gap-2 text-center animate-pulse">
                                <RefreshCw size={13} className="animate-spin" />
                                <span>{faceScanStatus}</span>
                            </div>
                        )}

                        <div className="space-y-2.5">
                            {/* Primary Action Button: Camera Scan if camera is active */}
                            {cameraActive && (
                                <button
                                    type="button"
                                    onClick={handlePerformFaceScanLogin}
                                    disabled={isScanningFace}
                                    className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer disabled:opacity-50"
                                >
                                    {isScanningFace ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin" />
                                            <span>AUTHENTICATING PATIENT FACE...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ScanFace size={16} />
                                            <span>SCAN FACE VIA CAMERA</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Guaranteed Face Scan From Photo File Fallback Button */}
                            <button
                                type="button"
                                onClick={() => faceScanFileInputRef.current?.click()}
                                disabled={isScanningFace}
                                className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                                    !cameraActive
                                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                                        : 'bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                                }`}
                            >
                                <Upload size={16} />
                                <span>SCAN FACE FROM PHOTO / FILE</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => { setMode('signin'); stopCamera(); }}
                                className="w-full py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer text-center block"
                            >
                                Return to Credentials Sign In
                            </button>
                        </div>
                    </div>
                )}

                {/* VIEW 3: SIGN UP WITH CAMERA SNAPSHOT (PATIENT ONLY) */}
                {mode === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-4">
                        {/* Name Input */}
                        <div className="space-y-1">
                            <label className="block text-xs font-mono text-slate-400">Full Name</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your Full Name"
                                    required
                                    className="w-full pl-10 pr-4 py-2 bg-[#121929] border border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Auth Identifier Selector: Email vs Phone */}
                        <div className="space-y-1">
                            <div className="flex gap-1.5 p-1 bg-[#121929] rounded-xl border border-white/[0.06]">
                                <button
                                    type="button"
                                    onClick={() => { setAuthMethod('email'); setErrorMessage(null); }}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        authMethod === 'email'
                                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Mail size={13} />
                                    <span>Email Address</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAuthMethod('phone'); setErrorMessage(null); }}
                                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        authMethod === 'phone'
                                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Phone size={13} />
                                    <span>Phone Number</span>
                                </button>
                            </div>
                        </div>

                        {/* EMAIL OR PHONE INPUT */}
                        {authMethod === 'email' ? (
                            <div className="space-y-1">
                                <label className="block text-xs font-mono text-slate-400">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="member@neuron.sanctuary"
                                        required
                                        className="w-full pl-10 pr-4 py-2 bg-[#121929] border border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="block text-xs font-mono text-slate-400">Phone Number</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="+91 98765 43210 or 9876543210"
                                        required
                                        className="w-full pl-10 pr-4 py-2 bg-[#121929] border border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-[10px] font-mono text-slate-500">Fast password registration (no OTP required).</p>
                            </div>
                        )}

                        {/* Password & Confirm Inputs */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="block text-xs font-mono text-slate-400">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3 py-2 bg-[#121929] border border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-mono text-slate-400">Confirm</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3 py-2 bg-[#121929] border border-white/[0.08] focus:border-amber-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* CAMERA CAPTURE SECTION FOR PROFILE PHOTO & FACE ENROLLMENT */}
                        <div className="space-y-2 pt-1 border-t border-white/[0.08]">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-mono font-semibold text-amber-300 flex items-center gap-1.5">
                                    <Camera size={14} />
                                    <span>Profile Photo &amp; Face Signature</span>
                                </label>
                                <span className="text-[10px] font-mono text-slate-400">REQUIRED</span>
                            </div>
                            
                            <p className="text-[11px] text-slate-400 leading-tight">
                                Take a live photo. It will become your profile picture and register your facial biometrics for 1-click login.
                            </p>

                            {/* Viewfinder or Captured Preview */}
                            <div className="relative w-full h-40 sm:h-48 rounded-2xl bg-black border-2 border-amber-500/40 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center justify-center">
                                {signupPhoto ? (
                                    <img
                                        src={signupPhoto}
                                        alt="Captured Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            onLoadedMetadata={() => {
                                                if (videoRef.current) {
                                                    videoRef.current.play().catch(e => console.warn("Video play notice:", e));
                                                }
                                            }}
                                            className="w-full h-full object-cover transform -scale-x-100"
                                        />
                                        {/* Reticle */}
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                            <div className="w-36 h-36 border-2 border-dashed border-amber-400/60 rounded-full animate-pulse" />
                                        </div>
                                    </>
                                )}

                                {/* Capture / Retake / Upload Button Overlay */}
                                <input
                                    ref={signupFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleSignupFileUpload}
                                />
                                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                                    {signupPhoto ? (
                                        <button
                                            type="button"
                                            onClick={handleRetakeSignupPhoto}
                                            className="px-3 py-1.5 rounded-xl bg-[#16181e]/90 hover:bg-black text-amber-300 border border-amber-500/50 text-xs font-mono flex items-center gap-1.5 shadow-md cursor-pointer"
                                        >
                                            <RotateCcw size={12} />
                                            <span>Retake / Change</span>
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => signupFileInputRef.current?.click()}
                                                className="px-2.5 py-1.5 rounded-xl bg-[#16181e]/90 hover:bg-black text-amber-300 border border-amber-500/40 text-xs font-mono flex items-center gap-1.5 shadow-md cursor-pointer"
                                            >
                                                <Upload size={12} />
                                                <span>Upload File</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSnapSignupPhoto}
                                                disabled={!cameraActive}
                                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer disabled:opacity-50"
                                            >
                                                <Camera size={13} />
                                                <span>Snap Photo</span>
                                            </button>
                                        </>
                                    )}
                                </div>

                                {signupPhoto && (
                                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        <span>Biometrics Ready</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !signupPhoto}
                            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={15} className="animate-spin" />
                                    <span>ENROLLING BIOMETRICS &amp; ACCOUNT...</span>
                                </>
                            ) : (
                                <>
                                    <span>CREATE SANCTUARY ACCOUNT</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* VIEW 4: FORGOT PASSWORD */}
                {mode === 'forgot_password' && (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="p-3 rounded-xl bg-[#141c2e] border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                            <span className="font-semibold text-white block">Password Recovery Service</span>
                            <span className="text-[11px] text-slate-400">
                                We will send a secure password reset link to your registered email address.
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-mono text-slate-400">Registered Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="member@neuron.sanctuary"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#121929] border border-white/[0.08] focus:border-cyan-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={15} className="animate-spin" />
                                    <span>DISPATCHING RESET LINK...</span>
                                </>
                            ) : (
                                <>
                                    <KeyRound size={15} />
                                    <span>SEND RESET LINK</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setMode('signin'); setErrorMessage(null); setSuccessMessage(null); }}
                            className="w-full py-2 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer text-center block"
                        >
                            Return to Sign In
                        </button>
                    </form>
                )}

                {/* Footer Telemetry */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span>EMAIL, PHONE &amp; BIOMETRIC SECURITY</span>
                    </span>
                    <span>FIREBASE AUTH v12</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
