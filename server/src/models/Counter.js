import mongoose from 'mongoose';

// Atomic per-user sequences (order numbers etc.)
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });

const Counter = mongoose.model('Counter', counterSchema);

export async function nextSequence(key, start = 1000) {
  const doc = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return start + doc.seq;
}

export default Counter;
