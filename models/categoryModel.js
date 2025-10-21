import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        // Check for HTML tags or script tags (prevention)
        const htmlTagPattern = /<[^>]*>/;
        return !htmlTagPattern.test(value);
      },
      message: 'Name contains invalid characters or HTML tags'
    }
  },
  slug: {
    type: String,
    lowercase: true,
    // bug here fix later: Add unique: true to prevent duplicate slugs
    validate: {
      validator: function(value) {
        // Allow only lowercase letters, numbers, and hyphens
        const slugPattern = /^[a-z0-9-]+$/;
        return slugPattern.test(value);
      },
      message: 'Slug must contain only lowercase letters, numbers, and hyphens'
    }
  },
});

export default mongoose.model("Category", categorySchema);