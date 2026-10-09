const { connectDB, disconnectDB } = require('./db');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const seedData = async () => {
  try {
    await connectDB();

    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('[Seed] Database already contains records. Skipping seed.');
      return;
    }

    console.log('[Seed] Populating initial BLEM demo data...');

    // 1. Create Demo Users
    const alex = await User.create({
      username: 'alexrivera',
      email: 'alex@blem.social',
      password: 'blemPass123',
      name: 'Alex Rivera',
      bio: 'Fullstack engineer & open-source enthusiast. Building on BLEM! 🚀'
    });

    const maya = await User.create({
      username: 'mayachen',
      email: 'maya@blem.social',
      password: 'blemPass123',
      name: 'Maya Chen',
      bio: 'Product designer obsessed with sleek dark modes and micro-interactions ✨'
    });

    const sarah = await User.create({
      username: 'dev_sarah',
      email: 'sarah@blem.social',
      password: 'blemPass123',
      name: 'Sarah Connor',
      bio: 'Cloud architect & distributed systems thinker. Coffee first ☕'
    });

    // 2. Setup Follow Relationships
    alex.following.push(maya._id, sarah._id);
    await alex.save();

    maya.followers.push(alex._id);
    maya.following.push(sarah._id);
    await maya.save();

    sarah.followers.push(alex._id, maya._id);
    sarah.following.push(alex._id);
    await sarah.save();

    // 3. Create Initial Posts
    const post1 = await Post.create({
      author: alex._id,
      content: 'Welcome to BLEM! Built as a clean, modular MVP with Express, Mongoose, and a high-performance Vanilla web frontend. What are you building today?',
      likes: [maya._id, sarah._id]
    });

    const post2 = await Post.create({
      author: maya._id,
      content: 'Testing out the new glassmorphic dark theme on BLEM. The contrast tokens and subtle glow effects make scanning feeds so pleasant on the eyes! 💜',
      likes: [alex._id]
    });

    const post3 = await Post.create({
      author: sarah._id,
      content: 'Clean architecture reminder: keep your routes lightweight, isolate database logic in services, and validate early at the boundaries. Simplicity scales.',
      likes: [alex._id, maya._id]
    });

    // 4. Create Initial Comments
    await Comment.create({
      post: post1._id,
      author: maya._id,
      content: 'Super excited for this MVP! The follow system and live likes feel ultra snappy.'
    });
    await Post.findByIdAndUpdate(post1._id, { $inc: { commentsCount: 1 } });

    await Comment.create({
      post: post1._id,
      author: sarah._id,
      content: 'Loving the clean RESTful responses and error handling.'
    });
    await Post.findByIdAndUpdate(post1._id, { $inc: { commentsCount: 1 } });

    await Comment.create({
      post: post3._id,
      author: alex._id,
      content: '100%! Boring, explicit architecture is always easier to maintain.'
    });
    await Post.findByIdAndUpdate(post3._id, { $inc: { commentsCount: 1 } });

    console.log('[Seed] Demo data successfully seeded!');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
};

// If run directly via node src/config/seed.js
if (require.main === module) {
  seedData().then(() => disconnectDB().then(() => process.exit(0)));
}

module.exports = seedData;
