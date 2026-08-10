import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../src/lib/firebase';
import Icon from '../components/Icon';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getErrorMessage = (code: string) => {
        switch (code) {
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);

        try {
            await signInWithPopup(auth, googleAuthProvider);
            navigate('/');
        } catch (err: any) {
            setError(getErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-end font-inter text-text-main">
            {/* Full-bleed background photo */}
            <img
                src="/login-bg-1.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0"
            />
            {/* Gradient overlay: transparent at top, solid ink at the bottom where the card sits */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-b from-ink/10 via-ink/20 to-ink" />

            {/* Logo, overlaid directly on the photo lower down */}
            <div className="absolute top-28 left-0 right-0 z-10 text-center px-5">
                <h1 className="font-display text-4xl text-white tracking-wide drop-shadow-md">GYMPAY</h1>
                <p className="text-[15px] font-bold uppercase tracking-widest text-white/90 mt-2 drop-shadow-md">
                    Invoicing done in 3,2,1
                </p>
            </div>

            {/* Card, anchored to the bottom, overlapping the lower part of the photo */}
            <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-6 p-5 pb-8">
                <div className="plate bg-white/60 backdrop-blur-[10px] p-6 border-2 border-ink shadow-md flex flex-col gap-6">
                    <div className="text-center">
                        <h2 className="font-bold text-xl text-ink mb-1">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
                        <p className="text-sm text-text-muted">
                            {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-danger-soft text-danger p-3 rounded-lg text-sm font-medium flex gap-2 items-start border border-danger/20">
                            <Icon name="error" className="text-[18px] shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="coach@example.com"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn-primary w-full mt-2"
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                    </form>

                    <div className="flex items-center justify-center text-sm my-2">
                        <div className="flex-grow border-t border-border-light"></div>
                        <div className="px-2 text-text-muted font-bold uppercase tracking-widest text-[10px]">
                            Or continue with
                        </div>
                        <div className="flex-grow border-t border-border-light"></div>
                    </div>

                    <button 
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="btn-secondary w-full flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>
                </div>

                <div className="text-center">
                    <button 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm font-medium text-white hover:text-white/80 transition-colors drop-shadow-md"
                    >
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
