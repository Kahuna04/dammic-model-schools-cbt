"use client";
import Section from "@/components/Section";
import { useState } from "react";

export default function Page() {
  const [showForm, setShowForm] = useState(false);
  
  // Replace with your actual Google Form embed URL
  const googleFormUrl = "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true";

  return (
    <div className="space-y-6">
      <Section title="Admissions" intro="Simple, transparent process. Start your child's journey to greatness.">
        
        {/* Application Method Selector */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl border-2 border-brand-green/20 bg-white p-6 shadow-lg">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-bold text-xl text-brand-dark">Online Application</h3>
            <p className="text-sm text-gray-700 mt-2 mb-4">
              Fill out our application form online. Your responses will be automatically saved to our system.
            </p>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary w-full"
            >
              {showForm ? '📋 View Process' : '📝 Apply Online'}
            </button>
          </div>

          <div className="rounded-2xl border-2 border-brand-green/20 bg-white p-6 shadow-lg">
            <div className="text-4xl mb-3">🏫</div>
            <h3 className="font-bold text-xl text-brand-dark">Visit Campus</h3>
            <p className="text-sm text-gray-700 mt-2 mb-4">
              Pick up a physical application form or schedule a campus tour with our admissions team.
            </p>
            <a href="/contact" className="btn-outline w-full block text-center">
              📍 Contact Us
            </a>
          </div>
        </div>

        {/* Google Form Embed */}
        {showForm ? (
          <div className="rounded-2xl border-2 border-brand-green/20 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-brand-dark">📝 Application Form</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-brand-green hover:text-brand-dark font-semibold text-sm"
              >
                ✕ Close Form
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <iframe
                src={googleFormUrl}
                width="100%"
                height="1200"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                className="rounded-lg"
              >
                Loading form...
              </iframe>
            </div>
            <p className="text-xs text-gray-600 mt-4">
              💡 Tip: Responses are automatically saved to our Google Sheets. You&apos;ll receive a confirmation email after submission.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-brand-green/20 bg-white p-6 shadow-lg">
            <h3 className="font-bold text-xl text-brand-dark mb-4">📋 Application Process</h3>
            <ol className="list-decimal pl-6 space-y-2 text-gray-800">
              <li>Choose your application method above (online or in-person).</li>
              <li>Submit required documents (birth certificate, last report, passport photo).</li>
              <li>Complete entrance assessment (for applicable classes) and interview.</li>
              <li>Receive admission decision and complete enrollment.</li>
            </ol>
            <div className="mt-6 p-4 bg-brand-cream/30 rounded-lg">
              <h4 className="font-semibold text-brand-dark mb-2">📄 Required Documents:</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>✓ Child&apos;s birth certificate</li>
                <li>✓ Last school report (if applicable)</li>
                <li>✓ 2 passport photographs</li>
                <li>✓ Immunization records</li>
              </ul>
            </div>
            <p className="mt-4 text-sm text-gray-700">Fees schedule, term dates, and uniform details will be published here.</p>
          </div>
        )}
      </Section>
    </div>
  );
}
