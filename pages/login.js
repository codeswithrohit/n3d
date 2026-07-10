import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { firebase } from '../Firebase/config';

const Login = () => {
  const router = useRouter();
  
  // UI State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved
        },
      });
    }
  }, []);

  // Step 1: Request OTP
  const requestOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    if (formattedPhone.length < 10) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await firebase.auth().signInWithPhoneNumber(formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const userRef = firebase.firestore().collection('n3duser').doc(user.uid);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        await userRef.set({
          uid: user.uid,
          mobileNumber: user.phoneNumber,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          verified: true
        });
      }

      router.push('/');

    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-white selection:text-black sm:px-6 lg:px-8 transition-colors duration-500">
      
      {/* Abstract Background Blurs for a Modern Dark Feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-neutral-800/30 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-neutral-800/20 blur-[120px] pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md sm:mx-auto">
        <div className="bg-neutral-950 sm:shadow-2xl sm:shadow-white/5 sm:border border-neutral-800 sm:rounded-[2.5rem] p-8 sm:p-12">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="flex items-center justify-center mb-6 bg-white/5 rounded-3xl p-4 border border-white/10 shadow-lg">
               {/* Adding a subtle glow/background behind the logo for contrast in dark mode */}
               <img src='/logo.webp' className='w-32 h-32 object-contain drop-shadow-xl' alt="Logo" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              {step === 1 ? 'Welcome to N3D' : 'Check your phone'}
            </h2>
            <p className="mt-3 text-[14px] text-neutral-400 font-medium">
              {step === 1 
                ? 'Enter your mobile number to get started.' 
                : (
                  <span>
                    We've sent a secure code to <b className="text-white font-bold tracking-wider">+91 {phoneNumber}</b>
                  </span>
                )}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-950/50 border border-red-900/50 text-red-400 px-4 py-3.5 rounded-2xl flex items-center text-sm font-semibold animate-pulse shadow-sm">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Step 1: Phone Form */}
          {step === 1 && (
            <form onSubmit={requestOTP} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="phone-number" className="block text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center bg-neutral-900 rounded-2xl border border-neutral-800 focus-within:border-white focus-within:ring-4 focus-within:ring-white/10 transition-all duration-300">
                  <span className="pl-5 pr-2 text-neutral-500 font-bold select-none">+91</span>
                  <input
                    id="phone-number"
                    type="tel"
                    required
                    className="w-full py-4 pr-5 bg-transparent outline-none text-white font-bold placeholder-neutral-700 text-[15px]"
                    placeholder="98765 43210"
                    value={phoneNumber.replace('+91', '')}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div id="recaptcha-container"></div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[13px] hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </>
                ) : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: OTP Form */}
          {step === 2 && (
            <form onSubmit={verifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">
                  6-Digit Secure Code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength="6"
                  className="w-full text-center tracking-[0.75em] text-2xl py-4 bg-neutral-900 rounded-2xl border border-neutral-800 focus:border-white focus:ring-4 focus:ring-white/10 outline-none text-white font-bold placeholder-neutral-800 transition-all duration-300"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[13px] hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 flex justify-center items-center disabled:bg-neutral-800 disabled:text-neutral-500 disabled:shadow-none"
              >
                {loading ? 'Verifying securely...' : 'Verify & Login'}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); }}
                  className="text-sm font-semibold text-neutral-500 hover:text-white transition-colors"
                >
                  Entered the wrong number? <span className="underline decoration-neutral-700 underline-offset-4">Go back</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Floating Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-500 font-medium tracking-wide">
            By joining, you agree to N3D{' '}
            <a href="#" className="text-white hover:underline decoration-neutral-600 underline-offset-4 font-bold">Terms</a> &{' '}
            <a href="#" className="text-white hover:underline decoration-neutral-600 underline-offset-4 font-bold">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;