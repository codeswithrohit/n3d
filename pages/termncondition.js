import React from 'react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">Terms & Conditions</h1>
          <p className="text-center text-gray-500 mb-12">Please read these terms carefully before using our services</p>

          <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">1. Introduction</h2>
            <p>
              Welcome to <strong>N3D (Nagina 3D Printer & Co2 Laser Shop)</strong>. 
              By accessing or using our website, products, and services, you agree to be bound by these Terms and Conditions.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">2. Our Services</h2>
            <p>
              N3D provides 3D Printing, CO2 Laser Cutting, Neon Lights, Mandala & Line Art, Custom Decor, and related design services 
              located in Dhanpurwa, Sasaram, Rohtas, Bihar.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">3. Orders & Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All orders must be paid in advance unless otherwise agreed.</li>
              <li>Custom orders require 50% advance payment.</li>
              <li>Prices are subject to change without prior notice.</li>
              <li>We accept UPI, Bank Transfer, and Cash payments.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">4. Delivery & Shipping</h2>
            <p>
              Delivery timelines are estimates only. We are not responsible for delays caused by courier services or unforeseen circumstances.
              Customers are responsible for providing correct delivery details.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">5. Cancellation & Refund Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Custom orders once started are non-refundable.</li>
              <li>Standard products can be refunded within 7 days if unused and in original condition.</li>
              <li>Refund will be processed within 7-10 working days.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">6. Intellectual Property</h2>
            <p>
              All designs, artworks, and 3D models created by N3D remain our intellectual property unless full ownership rights are transferred in writing.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">7. Customer Responsibility</h2>
            <p>
              Customers are responsible for providing accurate design files, dimensions, and specifications. 
              We are not liable for errors caused by incorrect customer inputs.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">8. Limitation of Liability</h2>
            <p>
              N3D shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">9. Governing Law</h2>
            <p>
              These terms shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Sasaram, Rohtas, Bihar.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms & Conditions at any time. Continued use of our services after changes constitutes acceptance of the new terms.
            </p>

          </div>

          {/* Contact Section */}
          <div className="mt-20 bg-white border rounded-3xl p-8 text-center">
            <h3 className="font-semibold text-lg mb-3">Questions?</h3>
            <p className="text-gray-600">
              If you have any questions about these Terms & Conditions, please contact us at:
            </p>
            <p className="mt-4 font-medium">
              📞 +91 9155242261<br />
              ✉️ nagina3dprinter@gmail.com
            </p>
          </div>

          <div className="text-center text-xs text-gray-400 mt-12">
            © {new Date().getFullYear()} N3D Sasaram. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;