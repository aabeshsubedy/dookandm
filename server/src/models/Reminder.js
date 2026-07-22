import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    title: { type: String, required: true, maxlength: 200 },
    dueAt: { type: Date, required: true },
    status: { type: String, enum: ['open', 'done'], default: 'open' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

reminderSchema.index({ seller: 1, status: 1, dueAt: 1 }); // dashboard due list
reminderSchema.index({ customer: 1 });

export const Reminder = mongoose.model('Reminder', reminderSchema);
