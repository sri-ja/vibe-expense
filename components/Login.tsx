
import React, { useState } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface LoginProps {
    onLogin: (password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;
        
        setIsLoading(true);
        // Small delay for UX feel and crypto initialization
        await new Promise(r => setTimeout(r, 600));
        onLogin(password);
        // Loading state remains until App.tsx updates UI
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-8">
            <div className="w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-2xl">
                    <div className="flex flex-col items-center mb-8 md:mb-10">
                        <div className="p-5 bg-indigo-500/20 rounded-3xl mb-5 border border-indigo-500/30 shadow-inner">
                            <LogoIcon className="h-14 w-14 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white text-center tracking-tight">Privacy Vault</h1>
                        <p className="text-indigo-200/40 text-sm text-center mt-3 font-medium uppercase tracking-widest">
                            Zero-Knowledge Tracking
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-3 ml-1">
                                Your Master Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:bg-white/10 transition-all text-lg font-mono"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors p-2"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !password.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-white/30 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 text-lg"
                        >
                            {isLoading ? (
                                <SpinnerIcon className="h-6 w-6 text-white" />
                            ) : (
                                "Unlock Vault"
                            )}
                        </button>
                    </form>

                    <div className="mt-10 p-5 bg-white/5 border border-white/5 rounded-3xl">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 shrink-0 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 5.548 4.076 10.21 9 11.109 4.924-.899 9-5.561 9-11.109 0-1.287-.203-2.526-.578-3.687A11.956 11.956 0 0112 2.714z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Encrypted Local Access</p>
                                <p className="text-xs text-indigo-100/40 mt-1 leading-relaxed">
                                    Your key initializes an isolated cloud vault. Data is decrypted strictly on your device.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
                    Hosted Securely on Vercel
                </p>
            </div>
        </div>
    );
};

export default Login;
