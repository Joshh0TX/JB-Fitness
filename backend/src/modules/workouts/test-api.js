// test-api.js
const res = await fetch("https://api.api-ninjas.com/v1/exercises?muscle=chest", {
  headers: { "X-Api-Key": "2ZLhhctA1ph2JSFPdaRhvJKexr3BOU14XdIi3Lw6" }
});
const data = await res.json();
console.log(data);