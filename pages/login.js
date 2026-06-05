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
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] relative overflow-hidden font-sans selection:bg-black selection:text-white sm:px-6 lg:px-8">
      
      {/* Abstract Background Blurs for a Modern Feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gray-200/50 blur-[100px] pointer-events-none"></div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md w-full sm:mx-auto">
        <div className="bg-white sm:shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:border border-gray-100 sm:rounded-[2.5rem] p-8 sm:p-12">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="text-white font-black text-xl flex items-center justify-center  mb-6">
         <img src='/logo.webp' className='w-40 h-40' />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {step === 1 ? 'Welcome to N3D' : 'Check your phone'}
            </h2>
            <p className="mt-3 text-[15px] text-gray-500 font-medium">
              {step === 1 
                ? 'Enter your mobile number to get started.' 
                : (
                  <span>
                    We've sent a secure code to <b className="text-gray-900">+91 {phoneNumber}</b>
                  </span>
                )}
            </p>
          </div>

          {/* Error Alert styled to match modern UI */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3.5 rounded-2xl flex items-center text-sm font-semibold animate-pulse">
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
                <label htmlFor="phone-number" className="block text-sm font-bold text-gray-900 ml-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center bg-gray-50/50 rounded-2xl border border-gray-200 focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 transition-all duration-300">
                  <span className="pl-5 pr-2 text-gray-500 font-bold select-none">+91</span>
                  <input
                    id="phone-number"
                    type="tel"
                    required
                    className="w-full py-4 pr-5 bg-transparent outline-none text-gray-900 font-semibold placeholder-gray-400 text-[15px]"
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
                className="w-full py-4 rounded-2xl bg-black text-white font-bold text-[15px] hover:bg-gray-800 hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
                <label htmlFor="otp" className="block text-sm font-bold text-gray-900 ml-1">
                  6-Digit Secure Code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength="6"
                  className="w-full text-center tracking-[0.75em] text-2xl py-4 bg-gray-50/50 rounded-2xl border border-gray-200 focus:border-black focus:ring-4 focus:ring-black/5 outline-none text-gray-900 font-bold placeholder-gray-300 transition-all duration-300"
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
                className="w-full py-4 rounded-2xl bg-black text-white font-bold text-[15px] hover:bg-gray-800 hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] transition-all duration-200 flex justify-center items-center disabled:bg-gray-300 disabled:shadow-none"
              >
                {loading ? 'Verifying securely...' : 'Verify & Login'}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); }}
                  className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Entered the wrong number? <span className="underline decoration-gray-300 underline-offset-4">Go back</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Floating Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-500 font-medium">
            By joining, you agree to N3D{' '}
            <a href="#" className="text-gray-900 hover:underline decoration-gray-300 underline-offset-4 font-bold">Terms</a> &{' '}
            <a href="#" className="text-gray-900 hover:underline decoration-gray-300 underline-offset-4 font-bold">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;