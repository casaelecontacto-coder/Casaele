import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CmsPage from '../models/CmsPage.js';

dotenv.config();

const defaultHowToUseContent = `
<div class="how-to-use-guide">
  <h2 style="color: #AD1518; margin-bottom: 20px;">Welcome to Casa De ELE!</h2>

  <p style="margin-bottom: 15px;">
    This guide will help you navigate through Casa De ELE and make the most of your Spanish learning journey with Ele, your friendly alien guide.
  </p>

  <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">🏠 Exploring the Rooms</h3>
  <ol style="line-height: 1.8;">
    <li><strong>Browse All Rooms:</strong> Visit the "All Rooms" section to explore different learning spaces themed around various Spanish topics.</li>
    <li><strong>Select Your Level:</strong> Each room offers content for different CEFR levels (A1-C2). Choose the level that matches your proficiency.</li>
    <li><strong>Interactive Content:</strong> Click on materials to access interactive exercises, videos, and downloadable resources.</li>
  </ol>

  <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">📚 Taking Courses</h3>
  <ol style="line-height: 1.8;">
    <li><strong>Browse Courses:</strong> Navigate to the "Courses" section to see all available structured learning programs.</li>
    <li><strong>Course Details:</strong> Click on any course to view its curriculum, level requirements, and what you'll learn.</li>
    <li><strong>Enroll & Learn:</strong> Purchase courses to access exclusive video lessons, exercises, and downloadable materials.</li>
  </ol>

  <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">🛍️ Shopping for Digital Products</h3>
  <ol style="line-height: 1.8;">
    <li><strong>Visit the Shop:</strong> Browse our collection of digital products including workbooks, audio files, and supplementary materials.</li>
    <li><strong>Add to Cart:</strong> Select products and add them to your shopping cart.</li>
    <li><strong>Checkout:</strong> Complete your purchase securely using Razorpay payment.</li>
    <li><strong>Download Access:</strong> After purchase, you'll receive an email with download links for your digital products.</li>
    <li><strong>Download Limits:</strong> Each product can be downloaded up to 3 times within 30 days (unless otherwise specified).</li>
  </ol>

  <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">📧 Newsletter & Updates</h3>
  <p style="margin-bottom: 15px;">
    Subscribe to our newsletter to receive:
  </p>
  <ul style="line-height: 1.8; margin-left: 20px;">
    <li>Exclusive Spanish learning content</li>
    <li>Special offers and discounts</li>
    <li>New course announcements</li>
    <li>Tips and tricks from Amrit</li>
  </ul>
  <p style="margin-top: 15px;">
    You can subscribe from the footer or during checkout by checking the newsletter opt-in box.
  </p>

  <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">💳 Payment & Digital Delivery</h3>
  <p style="margin-bottom: 15px;">
    <strong>Secure Payments:</strong> We use Razorpay for secure payment processing. All major payment methods are accepted.
  </p>
  <p style="margin-bottom: 15px;">
    <strong>Instant Delivery:</strong> Digital products are delivered instantly via email after successful payment.
  </p>
  <p style="margin-bottom: 15px;">
    <strong>Download Links:</strong> Check your email for personalized download links. Each link is secure and tracked.
  </p>

  <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">🎯 Tips for Success</h3>
  <ul style="line-height: 1.8; margin-left: 20px;">
    <li>Start with content matching your current level</li>
    <li>Practice regularly using the interactive materials</li>
    <li>Follow Ele's guidance through each room</li>
    <li>Download and save materials for offline practice</li>
    <li>Join our community on social media for additional support</li>
  </ul>

  <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">❓ Need Help?</h3>
  <p style="margin-bottom: 15px;">
    If you have any questions or encounter issues:
  </p>
  <ul style="line-height: 1.8; margin-left: 20px;">
    <li><strong>Contact Us:</strong> Use the contact form to reach our support team</li>
    <li><strong>Email:</strong> Send us an email for technical support</li>
    <li><strong>Social Media:</strong> Follow us on Instagram, YouTube, and other platforms for updates and community support</li>
  </ul>

  <div style="margin-top: 40px; padding: 20px; background-color: #FEF2F2; border-left: 4px solid #AD1518; border-radius: 8px;">
    <p style="margin: 0; color: #333;">
      <strong>Ready to start learning?</strong> Head over to the All Rooms section and begin your Spanish learning adventure with Ele today!
    </p>
  </div>
</div>
`;

async function seedHowToUsePage() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if "How to Use" page already exists
    const existingPage = await CmsPage.findOne({ slug: 'how-to-use' });

    if (existingPage) {
      console.log('ℹ️  "How to Use" page already exists. Skipping creation.');
      console.log('   Page ID:', existingPage._id);
      console.log('   Title:', existingPage.title);
      console.log('   Slug:', existingPage.slug);
    } else {
      // Create new "How to Use" page
      const howToUsePage = new CmsPage({
        title: 'How to Use Casa De ELE',
        slug: 'how-to-use',
        content: defaultHowToUseContent,
        imageUrl: '', // You can add a banner image URL later from the admin panel
        secondSectionEmbed: null // No embed by default
      });

      await howToUsePage.save();
      console.log('✅ Successfully created "How to Use" page!');
      console.log('   Page ID:', howToUsePage._id);
      console.log('   Title:', howToUsePage.title);
      console.log('   Slug:', howToUsePage.slug);
      console.log('   URL: /page/how-to-use');
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Visit the admin panel at /admin/cms');
    console.log('   2. Find the "How to Use Casa De ELE" page');
    console.log('   3. Click Edit to customize the content');
    console.log('   4. Add images or embed interactive content');
    console.log('   5. The page is already linked in the footer!');

  } catch (error) {
    console.error('❌ Error seeding How to Use page:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedHowToUsePage();
