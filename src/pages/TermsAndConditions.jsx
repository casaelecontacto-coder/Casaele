import React from 'react';
import CmsContent from '../components/CmsContent'; // Import the new component

export default function TermsAndConditions() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-gray-50 to-gray-100/60">
      <div className="px-4 sm:px-6 lg:px-8 pt-10">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-white/60 backdrop-blur border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">Terms & Conditions</h1>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-100">Dynamic Content</span>
            </div>
            <div className="h-px bg-gradient-to-r from-red-200/60 via-gray-200 to-transparent mt-6" />

            <div className="mt-6">
              <div className="rounded-xl bg-white/80 backdrop-blur border border-gray-200 shadow p-5 sm:p-6">
                {/* Use the CmsContent component with the correct slug; include fallback content below */}
                <CmsContent slug="terms-and-conditions">{
                  `
                  <div class="max-w-none leading-relaxed text-gray-800">
                    <p class="text-sm text-gray-600 mb-6"><strong>Last updated:</strong> October 2025</p>
                    <p class="mb-6">
                      Welcome to CasadeELE’s website (“we,” “our,” “us”). By accessing or using our services (website, online school, shop, teaching materials, or newsletter), users (“you”) agree to comply with the following Terms and Conditions, which constitute a legally binding agreement. Kindly read them carefully before registering or creating an account.
                    </p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">1. Site Ownership</h2>
                    <p class="mb-6">This site is owned and operated by CasadeELE. All references to “we,” “us,” or “our” refer to CasadeELE and its authorized representatives.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">2. Site Narrative</h2>
                    <p class="mb-4">The site is based on a storyline and narrates Ele’s adventures. The users accompany them in their Earth exploration. The story continues to develop with new chapters unlocked every month, helping users connect emotionally with Spanish learning. The storyline, narration, characters, visual designs, text, and teaching materials are the intellectual property of CasadeELE and are protected under the Copyright Act, 1957 (India).</p>
                    <p class="mb-6">Users are granted a limited, non-exclusive, non-transferable license to access and use the content for personal learning only. Reproduction, redistribution, or modification of any part of the content without written permission from CasadeELE is strictly prohibited.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">3. Acceptance of Terms</h2>
                    <p class="mb-4">By accessing our website, purchasing products, registering for courses, or subscribing to our newsletter, you confirm that you have read, understood, and agree to these Terms and Conditions, as well as our Privacy Policy and Cookie Policy. If you disagree, please refrain from using our services.</p>
                    <p class="mb-4">The website does not have any age restrictions and has content available for all ages. Suggested age groups are mentioned in each course and chapter available on the website. Parental supervision is advisable but not necessary for minors.</p>
                    <p class="mb-6">Any breach of these Terms & Conditions may result in suspension or termination of access to the website or services with lapse of any payment made. We may update terms and conditions from time to time.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">4. Description of Services</h2>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Online 100% synchronous Spanish language courses via a virtual school platform using third-party applications.</li>
                      <li>Online mixed modality, synchronous and asynchronous Spanish language courses via a virtual school platform using third-party applications.</li>
                      <li>Online 100% asynchronous Spanish language courses via a virtual school platform using third-party applications.</li>
                      <li>Digital teaching material and physical products are available on our shop.</li>
                      <li>A newsletter with Spanish learning and news updates.</li>
                      <li>Community features such as forums, webinars, or live sessions.</li>
                      <li>Monthly updates about Ele’s adventures and favourite picks.</li>
                    </ul>
                    <p class="mb-4">We may integrate third-party platforms (e.g., Zoom, Google Meet, or others) for our classes and community features. CasadeELE is not responsible for the functionality, data collection, or security practices of these third-party platforms.</p>
                    <p class="mb-6">We reserve the right to modify, suspend, or discontinue any course, feature, or service at our sole discretion without prior notice.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">5. School Conditions</h2>
                    <p class="mb-6">Below is a summary of key terms for Spanish courses with Casa de ELE. It applies to group/private courses, downloadable materials, and related services.</p>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Course Enrollment</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Enrollment is completed when a fully filled registration form is submitted and payment is received.</li>
                      <li>Information provided must be accurate and up-to-date.</li>
                      <li>Classes are subject to availability and class size limits; priority is based on registration and payment order.</li>
                      <li>For minors (under 18), enrollment must be authorized by a parent or legal guardian.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Courses and Classes</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Courses are offered in group and private formats, from A1 to C2 (CEFR).</li>
                      <li>Levels/modules and duration/frequency are published on our website.</li>
                      <li>Schedules may change; we may adjust timetables or merge classes as needed.</li>
                      <li>Only registered and paid students may attend classes; digital campus access is limited to registered users.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Payments and Fees</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Fees are due before the start of the course/module unless stated otherwise.</li>
                      <li>Fees are non-transferable; prices may change for future enrollments.</li>
                      <li>Payments may be made online or via approved bank transfer methods; receipts are provided.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Cancellations, Refunds, and Changes</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Refunds generally apply for cancellations made 7–14 days before course start (excluding delivered digital materials).</li>
                      <li>No refunds for digital/downloadable content.</li>
                      <li>Enrollment changes must be requested in writing and may incur fees.</li>
                      <li>Unused hours expire 3 months after purchase.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Course Materials</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Materials may be purchased separately or included in course fees; typically non-refundable.</li>
                      <li>Materials are delivered via the digital campus, during the first lesson, or as specified.</li>
                      <li>Materials are for personal, non-commercial use only.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Attendance and Certificates</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Minimum attendance (typically 70%) is expected for certificates.</li>
                      <li>Attendance may be tracked via the digital campus or by instructors.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Code of Conduct and Use</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>Respectful behavior is required; Casa de ELE is a safe space for all.</li>
                      <li>Unauthorized sharing/distribution of materials is prohibited.</li>
                      <li>We may exclude students for disruptive behavior or non-compliance.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Data Protection and Privacy</h3>
                    <ul class="list-disc pl-6 space-y-2 mb-4">
                      <li>We comply with India’s DPDP Act 2023 and GDPR where applicable.</li>
                      <li>Personal data is collected for registration, communication, payments, certification, newsletters, and site improvement.</li>
                      <li>Lawful bases: consent, contract, legal obligation, or legitimate interests.</li>
                      <li>Data is retained only as necessary and safeguarded appropriately.</li>
                      <li>Data may be shared with authorized providers and authorities as required by law.</li>
                      <li>Cross-border transfers follow lawful safeguards (e.g., SCCs).</li>
                      <li>Users may exercise rights to access, correct, delete, restrict, withdraw consent, or portability via our official email.</li>
                      <li>Cookies/analytics may be used; preferences can be managed in browsers.</li>
                      <li>We implement reasonable security measures including encryption and access controls.</li>
                      <li>Marketing/newsletters only with consent; unsubscribe anytime.</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">Liability</h3>
                    <p class="mb-6">Casa de ELE is not liable for damages, injuries, or losses resulting from participation in courses, misuse of the website or materials, or actions of third parties. We are not responsible for technical interruptions, system outages, or force majeure events that disrupt services.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">6. User Account and Registration</h2>
                    <ul class="list-disc pl-6 space-y-2 mb-6">
                      <li>Account creation is required for certain activities.</li>
                      <li>You are responsible for maintaining the confidentiality of credentials.</li>
                      <li>Provide accurate, current, and complete information.</li>
                      <li>We may terminate accounts for violations or fraud.</li>
                    </ul>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">7. Purchases, Payments, and Refunds</h2>
                    <ul class="list-disc pl-6 space-y-2 mb-6">
                      <li>Prices are indicated in USD & INR and include applicable taxes.</li>
                      <li>Payments: UPI, cards, Stripe, or other options specified; alternatives may be provided via email on request.</li>
                      <li>Digital products are generally non-refundable unless required by law.</li>
                      <li>Refund/cancellation policies are shown at point of sale; partial refunds may be available within 14 days for eligible items.</li>
                      <li>For transaction issues, contact our official email.</li>
                      <li>Third-party delivery services are used; while we are not responsible for damage, we will try to help resolve delivery issues.</li>
                    </ul>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">8. Use of Data and Analytics</h2>
                    <p class="mb-6">We collect and analyze user data to improve services and for compliance purposes, per our Privacy Policy.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">9. Intellectual Property</h2>
                    <p class="mb-6">All content on CasadeELE is owned by us or licensed. Copying, reproducing, distributing, or derivative works are prohibited without explicit permission.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">10. User Contributions and Community</h2>
                    <p class="mb-6">When posting or sharing content, users agree not to submit unlawful, offensive, or infringing material. We may remove content or restrict accounts for violations.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">11. External Links</h2>
                    <p class="mb-6">Our website may contain links to third-party websites. We are not responsible for their content or privacy practices.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">12. Disclaimers</h2>
                    <p class="mb-6">Our services are provided “as is” without warranties. We do not guarantee specific learning outcomes and are not liable for damages beyond what the law permits.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">13. Modifications</h2>
                    <p class="mb-6">We may update these Terms and Conditions at any time. Continued use after updates constitutes acceptance.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">14. Governing Law and Dispute Resolution</h2>
                    <p class="mb-6">These Terms and Conditions are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Uttarakhand. Alternative dispute resolution may be used where applicable.</p>

                    <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 mt-10 mb-3">15. Contact</h2>
                    <p class="mb-1">For further questions, support, or legal inquiries, kindly contact us at our official email.</p>
                    <ul class="list-disc pl-6 space-y-2">
                      <li>Email: <a class="text-red-700 hover:underline" href="mailto:casadeelecontacto@gmail.com">casadeelecontacto@gmail.com</a></li>
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