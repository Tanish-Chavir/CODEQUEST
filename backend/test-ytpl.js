import ytpl from "ytpl";

async function test() {
  console.log("Starting ytpl...");
  try {
    const res = await ytpl("https://www.youtube.com/watch?v=PkZNo7MFOUg", { limit: 10 });
    console.log("Success");
  } catch (err) {
    console.log("Error:", err.message);
  }
  process.exit(0);
}
test();
