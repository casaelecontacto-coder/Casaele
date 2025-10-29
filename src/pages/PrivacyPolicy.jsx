import React from 'react';
import CmsContent from '../components/CmsContent'; // Import the new component

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-gray-50 to-gray-100/60">
      <div className="px-4 sm:px-6 lg:px-8 pt-10">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-white/60 backdrop-blur border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">Privacy Policy</h1>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-100">Dynamic Content</span>
            </div>
            <div className="h-px bg-gradient-to-r from-red-200/60 via-gray-200 to-transparent mt-6" />

            <div className="mt-6">
              <div className="rounded-xl bg-white/80 backdrop-blur border border-gray-200 shadow p-5 sm:p-6">
                {/* Use the CmsContent component with the correct slug; include fallback content below */}
                <CmsContent slug="privacy-policy">{
                  `
                  <div class="max-w-none leading-relaxed text-gray-800">
                    <p class="text-sm text-gray-600 mb-6"><strong>Last updated:</strong> October 2025</p>
                    <p class="mb-6">
                      CasadeELE (“we,” “us,” or “our”) is committed to protecting your privacy and personal information. This Privacy Policy describes what data we collect, how we use it, who we share it with, your rights regarding your data, and how you can contact us. This policy applies to all visitors, students, and subscribers who access our services.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">1. Who We Are</h2>
                    <p class="mb-4">
                      CasadeELE owns and operates this website, including our online school, teaching material shop, and newsletter. Our services and policies apply to website visitors (“users”), registered students, and newsletter subscribers.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">2. What Data We Collect</h2>
                    <p class="mb-3">We may collect the following data:</p>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li><strong>Personal details:</strong> name, email, address, date of birth, phone number</li>
                      <li><strong>Account data:</strong> username, password, profile preferences</li>
                      <li><strong>Payment details:</strong> (when purchasing materials/courses) credit/debit card info (processed securely)</li>
                      <li><strong>Newsletter data:</strong> email address, subscription preferences</li>
                      <li><strong>Usage analytics:</strong> device type, browser information, IP address, geographic location, usage statistics</li>
                      <li><strong>Communications:</strong> support requests, feedback, messages</li>
                      <li><strong>Cookies and tracking data</strong> (see Section 5)</li>
                    </ul>
                    <p class="mb-6">
                      If you enroll a child or a minor, we may collect the child’s name, age, and related parent/guardian information, with consent.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">3. How We Collect Your Data</h2>
                    <p class="mb-3">We collect data in several ways:</p>
                    <ul class="list-disc pl-6 space-y-2 mb-6">
                      <li>When you fill in forms (register, purchase, sign up for the newsletter)</li>
                      <li>When you use our website (automatic data collection via cookies/analytics)</li>
                      <li>Through direct communication (email, support chat)</li>
                      <li>Through newsletter interactions (open rates, click analysis)</li>
                    </ul>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">4. How We Use Your Data</h2>
                    <p class="mb-3">We process your data for the following purposes:</p>
                    <ul class="list-disc pl-6 space-y-2 mb-6">
                      <li>To provide and manage online courses, memberships, and downloadable materials</li>
                      <li>To process orders, transactions, and payments</li>
                      <li>To send newsletters, updates, and educational resources</li>
                      <li>For analytics, website improvement, and fraud prevention</li>
                      <li>To respond to queries and support requests</li>
                      <li>For compliance with legal obligations</li>
                    </ul>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">5. Cookies and Analytics</h2>
                    <p class="mb-3">Our website uses cookies and similar tracking technologies to:</p>
                    <ul class="list-disc pl-6 space-y-2 mb-6">
                      <li>Enhance site functionality and personalization</li>
                      <li>Collect traffic statistics and usage trends</li>
                      <li>Analyze newsletter and marketing campaign performance</li>
                    </ul>
                    <p class="mb-6">
                      You may manage or disable cookies through your browser settings. Continued use of our website implies consent to our cookie policy.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">6. Data Sharing and Third Parties</h2>
                    <p class="mb-3">We may share your information with:</p>
                    <ul class="list-disc pl-6 space-y-2 mb-6">
                      <li>Payment processors (e.g., Stripe, PayPal)</li>
                      <li>Newsletter distribution providers</li>
                      <li>Hosting and website analytics services</li>
                    </ul>
                    <p class="mb-6">
                      We do not sell your personal data. Third parties may only use your data under strict contractual and legal conditions. We ensure appropriate safeguards such as Standard Contractual Clauses or other lawful mechanisms to maintain adequate protection.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">7. Children’s Privacy</h2>
                    <p class="mb-6">
                      Parents or guardians may request access, correction, or deletion of their children’s data.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">8. International Data Transfers</h2>
                    <p class="mb-6">
                      Your data may be processed and stored on servers outside your country. We ensure appropriate safeguards are in place to protect your data per applicable laws.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">9. Data Security</h2>
                    <p class="mb-6">
                      We take reasonable steps to secure data via technical and organizational measures, such as SSL encryption, secure payment gateways, and regular security reviews. However, internet data transmission is not 100% secure.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">10. Your Rights</h2>
                    <p class="mb-3">Depending on your region, you may have the right to:</p>
                    <ul class="list-disc pl-6 space-y-2 mb-6">
                      <li>Access the data we hold about you</li>
                      <li>Request corrections or updates</li>
                      <li>Request deletion of your data</li>
                      <li>Withdraw consent for processing</li>
                      <li>Object to profiling and marketing communications</li>
                      <li>Lodge a complaint with relevant authorities</li>
                    </ul>
                    <p class="mb-6">
                      Contact us for inquiries or to exercise rights.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">11. Third-Party Links</h2>
                    <p class="mb-6">
                      Our website may link to external sites. We are not responsible for their privacy practices. Please check those sites’ privacy policies.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">12. Changes to This Policy</h2>
                    <p class="mb-6">
                      We may update this policy periodically to reflect new laws or business practices. Changes will be posted here with the revised date.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">13. Contact Information</h2>
                    <p class="mb-3">If you have questions, concerns, or requests regarding your privacy or data, please contact us at:</p>
                    <ul class="list-disc pl-6 space-y-2">
                      <li>Email: <a class="text-red-700 hover:underline" href="mailto:casadeelecontacto@gmail.com">casadeelecontacto@gmail.com</a></li>
                      <li>Contact form from the navigation bar.</li>
                    </ul>
                  </div>
                  `}
                </CmsContent>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}