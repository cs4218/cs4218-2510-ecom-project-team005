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
      /* SECURITY FIX: Email format validation */
      /* BEFORE: Accepted any string like "abc", "123", "not-email" */
      /* AFTER: Only accepts valid email formats like "user@domain.com" */
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ],
      /* WHY THIS MATTERS: */
      /* - Prevents invalid emails from entering database */
      /* - Ensures email notifications can be sent successfully */
      /* - Improves data quality and user experience */
    },
    password: {
      type: String,
      required: true,
      /* SECURITY FIX: Password strength validation */
      /* BEFORE: Accepted any password including "1", "a", "" */
      /* AFTER: Requires minimum 8 characters for basic security */
      minlength: [8, 'Password must be at least 8 characters long'],
      /* WHY THIS MATTERS: */
      /* - Prevents easily hackable passwords */
      /* - Improves account security */
      /* - Follows basic password security standards */
      /* NOTE: In production, also add complexity rules (uppercase, numbers, symbols) */
    },
    phone: {
      type: String,
      required: true,
      /* SECURITY FIX: Phone number format validation */
      /* BEFORE: Accepted any string like "abc", "!!!", "email@test.com" */
      /* AFTER: Only accepts numeric phone formats */
      match: [
        /^[\+]?[1-9][\d]{0,15}$/,
        'Please enter a valid phone number'
      ],
      /* WHY THIS MATTERS: */
      /* - Ensures phone numbers are actually callable */
      /* - Prevents garbage data in database */
      /* - Enables SMS/call features to work properly */
      /* REGEX EXPLANATION: */
      /* ^[\+]? - Optional + at start (for international) */
      /* [1-9] - First digit 1-9 (not 0) */
      /* [\d]{0,15} - Up to 15 more digits */
      /* $ - End of string */
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