import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  accountStatus: 'active' | 'inactive' | 'suspended';
  profileComplete: boolean;
  avatar?: string;
  bio?: string;
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  preferences?: {
    emailNotifications: boolean;
    studyReminders: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
  changedPasswordAfter(timestamp: number): boolean;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true, // Add explicit index for email lookups
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password by default in queries
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: 'text', // Add text index for name-based searches
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    lastLogin: {
      type: Date,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true, // Index for account status filtering
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function(v: number[]) {
            return v.length === 2;
          },
          message: 'Coordinates must be [longitude, latitude]'
        }
      },
      address: String
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      studyReminders: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index for geospatial queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Create a compound index for role and status
userSchema.index({ role: 1, accountStatus: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 for stronger security
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set passwordChangedAt to track when password was changed
    this.passwordChangedAt = new Date();
    
    next();
  } catch (error: any) {
    next(error);
  }
});

// Set lastLogin timestamp on document retrieval
userSchema.pre('findOne', function(next) {
  // Only update if checking by email for login
  if (this.getFilter().email && !this.getFilter().passwordResetToken) {
    this.select('+password'); // Ensure password is selected for auth
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to create password reset token with crypto
userSchema.methods.createPasswordResetToken = function (): string {
  // Generate random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and save to the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expiration (10 minutes)
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  // Return unhashed token to send to user
  return resetToken;
};

// Method to check if password was changed after a given timestamp
userSchema.methods.changedPasswordAfter = function (timestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return timestamp < changedTimestamp;
  }
  return false;
};

export const User = mongoose.model<IUser>('User', userSchema); 