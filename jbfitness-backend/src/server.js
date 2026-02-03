import app from "./app.js";
const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(`🚀 JBFitness backend running on port ${PORT}`);
});
