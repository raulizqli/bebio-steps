import mongoose, { Document, Schema } from 'mongoose';

export interface IBaby extends Document {
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  parents: mongoose.Types.ObjectId[];
  photoUrl?: string;
  weight?: number;
  height?: number;
  bloodType?: string;
  allergies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BabySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    parents: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    photoUrl: {
      type: String,
    },
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    bloodType: {
      type: String,
    },
    allergies: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBaby>('Baby', BabySchema);
