import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      
      /* BEFORE: Accepted any string like "abc", "123", "not-email" */
      /* AFTER: Only accepts valid email formats like "user@domain.com" */
      /* FIX: Email format validation */
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ],
    },
    password: {
      type: String,
      required: true,
      /* BEFORE: Accepted any password including "1", "a", "" */
      /* AFTER: Requires minimum 8 characters for basic security */
      /* FIX: Password strength validation */
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    phone: {
      type: String,
      required: true,
      /* BEFORE: Accepted any string like "abc", "!!!", "email@test.com" */
      /* AFTER: Only accepts numeric phone formats */
      /* FIX: Phone number format validation */
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        'Please enter a valid phone number'
      ],
    },
    address: {
      type: {},
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);