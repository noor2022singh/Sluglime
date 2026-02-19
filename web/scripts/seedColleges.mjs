import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String }
  },
  { timestamps: true }
);

const College = mongoose.models.College || mongoose.model('College', collegeSchema);

const colleges = [
  { name: 'North Valley College', code: 'NVC' },
  { name: 'Riverdale Institute of Technology', code: 'RIT' },
  { name: 'Sunrise State University', code: 'SSU' }
];

await mongoose.connect(uri, { dbName: 'sluglime-web' });

for (const college of colleges) {
  await College.updateOne({ code: college.code }, { $set: college }, { upsert: true });
}

console.log(`Seeded ${colleges.length} colleges.`);
await mongoose.disconnect();
