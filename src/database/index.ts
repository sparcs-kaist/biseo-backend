import mongoose from 'mongoose';

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error!'));
db.once('open', () => console.log('Connected to MongoDB'));

const HOST = process.env.DB_HOST ?? 'localhost';
mongoose.connect(`mongodb://${HOST}/biseo`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
