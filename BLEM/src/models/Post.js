const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true
    },
    content: {
      type: String,
      required: [true, 'Post content cannot be empty'],
      trim: true,
      minlength: [1, 'Post content must contain at least 1 character'],
      maxlength: [500, 'Post content cannot exceed 500 characters']
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    commentsCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.likesCount = ret.likes ? ret.likes.length : 0;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for author's timeline & general feed sorting
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
