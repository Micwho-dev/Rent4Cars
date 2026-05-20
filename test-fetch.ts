import fetch from "node-fetch";
async function run() {
  try {
    const res = await fetch("http://0.0.0.0:3000/api/fleet");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 100));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
run();
