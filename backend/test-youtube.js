async function test() {
  console.log("Registering test user...");
  const authRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "testuser_" + Date.now(), email: `test${Date.now()}@test.com`, password: "password123" })
  });
  
  const authData = await authRes.json();
  console.log("Auth response:", authData);
  
  if (!authData.token) {
    console.log("Failed to get token, aborting.");
    return;
  }
  
  console.log("Creating course...");
  const courseRes = await fetch("http://localhost:5000/api/courses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authData.token}`
    },
    body: JSON.stringify({
      // Using a valid Traversy Media React playlist
      playlistUrl: "https://www.youtube.com/playlist?list=PLILLGF-RfqbYeckUaD1z6nviYX3SqIG_" 
    })
  });
  
  const courseData = await courseRes.json();
  console.log("Course response:", JSON.stringify(courseData, null, 2));
}

test();
