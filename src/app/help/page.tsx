'use client';

import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';

export default function HelpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
            <h1 className="text-[40px] font-bold text-[#092C4C] mb-2">Help & Support</h1>
            <p className="text-black mb-8">
              We're here to help! If you have any questions, concerns, or feedback, please don't hesitate to reach out.
            </p>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#092C4C] mb-4">Submit Feedback</h2>
                <p className="text-gray-600 mb-4">
                  Have feedback about our service or a specific parking spot? We'd love to hear from you!
                </p>
                <button
                  onClick={() => router.push('/dashboard/feedback/submit')}
                  className="bg-[#092C4C] hover:bg-[#0A3A64] text-white px-6 py-2 rounded-md transition-colors"
                >
                  Submit Feedback
                </button>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#092C4C] mb-4">Contact Information</h2>
                <div className="space-y-2 text-gray-600">
                  <p>Email: support@bookmyspot.com</p>
                  <p>Phone: +1 (555) 123-4567</p>
                  <p>Hours: Monday - Friday, 9:00 AM - 6:00 PM</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#092C4C] mb-4">FAQs</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-[#092C4C]">How do I book a parking spot?</h3>
                    <p className="text-gray-600">Browse available spots, select your desired time slot, and complete the booking process.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#092C4C]">How can I cancel my booking?</h3>
                    <p className="text-gray-600">Go to your dashboard, find the booking you want to cancel, and click the cancel button.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#092C4C]">What if I have issues with a parking spot?</h3>
                    <p className="text-gray-600">Use our feedback system to report any issues, and we'll address them promptly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 