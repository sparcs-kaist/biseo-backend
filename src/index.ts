import app from './app';

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`HTTP & Socket server running on port ${PORT}...`);
});
