"use client";
import React, { useState } from 'react';
import { firebase } from '../Firebase/config';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await firebase.firestore().collection("n3dcontacts").add({
        ...formData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: "new"
      });

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* ================= HERO HEADER ================= */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 md:py-28 text-white overflow-hidden">
        {/* Subtle background blur/glass effect element */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px]"></div>
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-500/20 blur-[100px]"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl mb-8 shadow-xl">
            <img 
              src="/logo.webp" 
              alt="Nagina 3D Printers" 
              className="h-14 md:h-16 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto font-medium">
            Have questions or need assistance? Our team is ready to help you bring your ideas to life.
          </p>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-5 gap-12 lg:gap-16 relative -mt-12 z-20">
        
        {/* LEFT: CONTACT FORM */}
        <div className="lg:col-span-3 bg-white p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Send us a Message</h2>
          <p className="text-slate-500 mb-8 font-medium">Fill out the form below and we will get back to you shortly.</p>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-10 rounded-2xl text-center shadow-sm animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✓</span>
              </div>
              <h3 className="font-bold text-2xl mb-2 text-green-800">Message Sent!</h3>
              <p className="font-medium">Thank you for reaching out. We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Tell us about your project or inquiry..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT: CONTACT INFO + MAP */}
        <div className="lg:col-span-2 space-y-8 mt-12 lg:mt-0">
          
          {/* Contact Details Card */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
              Contact Information
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4 items-start group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FaPhoneAlt size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                  <a href="tel:+919155242261" className="text-slate-800 font-semibold hover:text-blue-600 transition-colors">+91 91552 42261</a>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FaEnvelope size={18} />
                </div>
                <div className="break-all">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                  <a href="mailto:nagina3dprinter@gmail.com" className="text-slate-800 font-semibold hover:text-blue-600 transition-colors">nagina3dprinter@gmail.com</a>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FaMapMarkerAlt size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                  <p className="text-slate-700 font-medium text-sm leading-relaxed">
                    Nagina 3D Printers<br />
                    Near Railway Station, Nagina<br />
                    Uttar Pradesh, India
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FaClock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Business Hours</p>
                  <p className="text-slate-700 font-medium text-sm">Mon - Sat: 9:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
            
            {/* Social Links inside the card for cleaner grouping */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Follow Us</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all border border-slate-200 hover:border-transparent"><FaInstagram size={18} /></a>
                <a href="#" className="w-10 h-10 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all border border-slate-200 hover:border-transparent"><FaFacebook size={18} /></a>
                <a href="#" className="w-10 h-10 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all border border-slate-200 hover:border-transparent"><FaTwitter size={18} /></a>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
            <iframe
              src="https://maps.google.com/maps?q=Nagina,Uttar+Pradesh&t=&z=13&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: '1rem' }}
              allowFullScreen
              loading="lazy"
              className="w-full bg-slate-50"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-slate-900 py-8 text-slate-400 text-center border-t border-slate-800 mt-8">
        <p className="text-sm font-medium">© {new Date().getFullYear()} Nagina 3D Printers. All Rights Reserved.</p>
      </div>

      {/* Embedded Animation Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ContactUs;