// One-time migration: copy every existing Comment and Review document into
// the new unified Feedback collection (see Backend/models/Feedback.js for
// why they're merged). This is a COPY, not a move — the old `comments` and
// `reviews` collections are left untouched as a backup. Safe to re-run: it
// skips any _id that's already present in Feedback.
//
// Run with: npm run migrate:feedback   (from Backend/)

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Comment from '../models/Comment.js';
import Review from '../models/Review.js';
import Feedback from '../models/Feedback.js';

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const [comments, reviews] = await Promise.all([
      Comment.find().lean(),
      Review.find().lean(),
    ]);
    console.log(`Found ${comments.length} comments, ${reviews.length} reviews.`);

    let commentsCopied = 0, commentsSkipped = 0;
    for (const c of comments) {
      const exists = await Feedback.exists({ _id: c._id });
      if (exists) { commentsSkipped++; continue; }
      await Feedback.create({
        _id: c._id,
        name: c.name,
        text: c.message,
        status: c.status,
        createdAt: c.createdAt || c.date,
        updatedAt: c.updatedAt || c.date,
      });
      commentsCopied++;
    }

    let reviewsCopied = 0, reviewsSkipped = 0;
    for (const r of reviews) {
      const exists = await Feedback.exists({ _id: r._id });
      if (exists) { reviewsSkipped++; continue; }
      await Feedback.create({
        _id: r._id,
        name: r.name,
        text: r.comment,
        rating: r.rating,
        course: r.course,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
      reviewsCopied++;
    }

    console.log(`Comments: ${commentsCopied} copied, ${commentsSkipped} already present.`);
    console.log(`Reviews:  ${reviewsCopied} copied, ${reviewsSkipped} already present.`);
    console.log('Done. The old `comments` and `reviews` collections were not touched —');
    console.log('drop them yourself once you\'ve confirmed the admin Feedback page looks right.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

migrate();
