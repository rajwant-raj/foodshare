// ===================== 🤖 AI MODEL =====================
let model;

async function loadModel() {
  model = await mobilenet.load();
  console.log("AI Model Loaded ✅");
}


// ===================== 🚀 APP START =====================
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";

  loadModel();
  loadData();
  setupImageListener();
  loadTheme();
});


// ===================== 🌙 THEME =====================
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("themeBtn");

  body.classList.toggle("light");

  if (body.classList.contains("light")) {
    localStorage.setItem("theme", "light");
    btn.innerText = "☀";
  } else {
    localStorage.setItem("theme", "dark");
    btn.innerText = "🌙";
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  const btn = document.getElementById("themeBtn");

  if (savedTheme === "light") {
    document.body.classList.add("light");
    if (btn) btn.innerText = "☀";
  }
}


// ===================== 🍱 PRESET FOOD IMAGES =====================
const foodImages = {
  "Rajma-chawal": "images/rajma.jpg",
  "Dal": "images/dal.jpg",
  "veg-biryani": "images/veg-biryani.jpg",
  "chicken-biryani": "images/chicken-biryani.jpg",
  "Rice": "images/rice.jpg",
  "Chapati": "images/chapati.jpg",
  "Vegetables": "images/vegetables.jpg",
  "Pizza": "images/pizza.jpg",
  "Burger": "images/burger.jpg",
  "Sweets": "images/sweets.jpg"
};


// ===================== 📸 IMAGE UPLOAD + AI =====================
function setupImageListener() {
  const imageInput = document.getElementById("image");
  if (!imageInput) return;

  imageInput.addEventListener("change", function () {
    const file = this.files[0];
    const preview = document.getElementById("preview");

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
        preview.classList.add("show");

        preview.onload = async () => {
          if (!model) return;

          const predictions = await model.classify(preview);
          const detected = predictions[0].className.toLowerCase();
          autoSelectFood(detected);
        };
      };

      reader.readAsDataURL(file);
    }
  });
}


// ===================== 📸 CAMERA =====================
let stream;

async function openCamera() {
  const video = document.getElementById("video");
  const captureBtn = document.getElementById("captureBtn");

  stream = await navigator.mediaDevices.getUserMedia({ video: true });

  video.srcObject = stream;
  video.style.display = "block";
  video.classList.add("show");

  captureBtn.style.display = "block";
}

function captureImage() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const preview = document.getElementById("preview");

  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0);

  const imageData = canvas.toDataURL("image/png");

  preview.src = imageData;
  preview.style.display = "block";
  preview.classList.add("show");

  stream.getTracks().forEach(track => track.stop());

  video.style.display = "none";
  document.getElementById("captureBtn").style.display = "none";

  preview.onload = async () => {
    if (!model) return;

    const predictions = await model.classify(preview);
    const detected = predictions[0].className.toLowerCase();

    autoSelectFood(detected);
  };
}


// ===================== 🍱 AUTO FOOD SELECT =====================
function autoSelectFood(label) {
  const dropdown = document.getElementById("foodSelect");
  const custom = document.getElementById("customFood");
  const preview = document.getElementById("preview");

  let detected = "Other";

  if (label.includes("pizza")) detected = "Pizza";
  else if (label.includes("burger")) detected = "Burger";
  else if (label.includes("rice")) detected = "Rice";
  else if (label.includes("vegetable")) detected = "Vegetables";
  else if (label.includes("cake") || label.includes("dessert")) detected = "Sweets";

  dropdown.value = detected;

  if (detected === "Other") {
    custom.classList.add("show");
  } else {
    custom.classList.remove("show");

    preview.src = foodImages[detected];
    preview.style.display = "block";
    preview.classList.add("show");
  }
}


// ===================== 🎛️ TOGGLE =====================
function toggleCustomFood() {
  const select = document.getElementById("foodSelect").value;
  const custom = document.getElementById("customFood");
  const preview = document.getElementById("preview");

  if (select === "Other") {
    custom.style.display = "block";
    custom.classList.add("show");

    // ❌ remove image for "Other"
    preview.style.display = "none";
    preview.classList.remove("show");

  } else {
    custom.style.display = "none";
    custom.classList.remove("show");

    // ✅ show preset image
    if (foodImages[select]) {
      preview.src = foodImages[select];
      preview.style.display = "block";
      preview.classList.add("show");
    }
  }
}


// ===================== 📦 DONATE =====================
async function donate() {
  let food = document.getElementById("foodSelect").value;
  const quantity = document.getElementById("quantity").value;
  const unit = document.getElementById("unit").value;
  const preview = document.getElementById("preview");

  // ✅ Handle "Other"
  if (food === "Other") {
    food = document.getElementById("customFood").value;
  }

  // ✅ Validation
  if (!food || !quantity || !unit) {
    alert("Please fill all fields");
    return;
  }

  const fullQuantity = quantity + " " + unit;

  // ✅ FINAL DATA
  const donationData = {
    food,
    quantity: fullQuantity,
    image: preview.src || ""
  };

  console.log("Sending:", donationData); // 🔥 debug

  await fetch("/donate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donationData)
  });

  loadData();
}


// ===================== 📋 LOAD DONATIONS =====================
async function loadData() {
  const res = await fetch("/donations");
  const data = await res.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(d => {

    let imgSrc = "";

    if (d.image && d.image !== "") {
      imgSrc = d.image;
    } else {
      imgSrc = "images/default.jpg";
    }

    list.innerHTML += `
      <li class="donation-card">

        <div class="donation-left">
          <strong>🍛 ${d.food}</strong><br>
          <small>${d.quantity}</small><br>
          <span>${d.status}</span>
        </div>

        <div class="donation-right">
          <img src="${imgSrc}" onerror="this.src='images/default.jpg'">
        </div>

      </li>
    `;
  });
}

// ===================== 📍 FIND NEARBY NGOs =====================

const ngoData = [
  { 
    name: "Goonj (Dehradun)", 
    lat: 30.3165, 
    lon: 78.0322,
    img: "https://images.unsplash.com/photo-1526976668912-1a811878dd37",
    desc: "A leading NGO working on disaster relief and rural development across India.",
    link: "https://goonj.org"
  },
  { 
    name: "Robin Hood Army (Dehradun)", 
    lat: 30.3256, 
    lon: 78.0437,
    img: "https://images.unsplash.com/photo-1593113598332-cd59a93b6d0f",
    desc: "Volunteer-driven organization distributing surplus food to the needy.",
    link: "https://robinhoodarmy.com"
  },
  { 
    name: "Feeding India (Dehradun)", 
    lat: 30.3075, 
    lon: 78.0356,
    img: "https://images.unsplash.com/photo-1606787366850-de6330128bfc",
    desc: "Zomato initiative focused on hunger relief and food distribution.",
    link: "https://feedingindia.org"
  },
  { 
    name: "People's Science Institute", 
    lat: 30.3490, 
    lon: 78.0200,
    img: "https://images.unsplash.com/photo-1509099836639-18ba1795216d",
    desc: "Works on sustainable development, environment, and community welfare.",
    link: "https://psi.org.in"
  }
];

function findNearbyNGOs() {

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {

    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    const sorted = ngoData.map(ngo => {
      const dist = getDistance(userLat, userLon, ngo.lat, ngo.lon);
      return { ...ngo, distance: dist.toFixed(2) };
    }).sort((a, b) => a.distance - b.distance);

    const list = document.getElementById("ngoList");
    list.innerHTML = "";

    sorted.slice(0, 3).forEach(n => {
      list.innerHTML += `
        <li class="ngo-item" onclick="openNGO('${n.link}')">
          <strong>📍 ${n.name}</strong><br>
          <small>${n.distance} km away</small>

          <div class="ngo-details">
            <img src="${n.img}" onerror="this.src='images/default.jpg'">
            <p>${n.desc}</p>
          </div>
        </li>
      `;
    });

  }, () => {
    alert("Allow location access ❌");
  });
}

//------------------ DISTANCe function ------------------

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function openNGO(link) {
  window.open(link, "_blank");
}

async function markComplete(id) {
  await fetch("/update/" + id, {
    method: "POST"
  });

  loadData(); // refresh UI
}

// Toggle Chat
function toggleChat(){
  const box = document.getElementById("chatBox");
  box.style.display = box.style.display === "flex" ? "none" : "flex";
}

// Send Message
function sendMessage(){
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();

  if(!msg) return;

  const chat = document.getElementById("chatMessages");

  // User message
  chat.innerHTML += `<div class="user">🧑 ${msg}</div>`;
  input.value = "";

  // Typing animation
  chat.innerHTML += `
    <div class="bot typing" id="typing">
      <span></span><span></span><span></span>
    </div>
  `;

  chat.scrollTop = chat.scrollHeight;

  // Delay reply
  setTimeout(()=>{
    document.getElementById("typing").remove();

    chat.innerHTML += `
      <div class="bot">🤖 ${getBotReply(msg)}</div>
    `;

    chat.scrollTop = chat.scrollHeight;

  }, 1200); // ⏳ delay for realism
}

// Simple AI logic
function getBotReply(msg){
  msg = msg.toLowerCase();

  if(msg.includes("donate")) return "You can donate food using the form above 🍱";
  if(msg.includes("ngo")) return "Click 'Find Nearby NGOs' to see nearby NGOs 📍";
  if(msg.includes("login")) return "Use admin@test.com / 1234 to login 🔐";
  if(msg.includes("hello")) return "Hello! How can I help you today? 😊";

  return "I'm here to help with FoodShare 😊";
}