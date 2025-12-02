// IMPORT ΤΩΝ ΠΟΛΕΩΝ
import { greekCities } from "./cities.js";

/* ===========================================================
   Firebase Setup
=========================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ===========================================================
   TEXT NORMALIZATION & CITY AUTOCORRECT
=========================================================== */

function removeAccents(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}



function levenshtein(a, b) {
  const m = [];

  if (!(a && b)) return (b || a).length;

  for (let i = 0; i <= b.length; i++) {
    m[i] = [i];
    if (i === 0) continue;
    m[i][0] = i;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? m[i - 1][j - 1]
          : Math.min(
              m[i - 1][j - 1] + 1,
              m[i][j - 1] + 1,
              m[i - 1][j] + 1
            );
    }
  }

  return m[b.length][a.length];
}

function autoCorrectCity(input) {
  const cleaned = removeAccents(input);

  let bestMatch = null;
  let bestScore = Infinity;

  
  return bestMatch;
}

/* ===========================================================
   Firebase Config
=========================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyAWZDH3LTIBMAIh0ZWzyHgzvGdkE-OXdfM",
  authDomain: "beegreek-1c398.firebaseapp.com",
  projectId: "beegreek-1c398",
  storageBucket: "beegreek-1c398.firebasestorage.app",
  messagingSenderId: "1000387369814",
  appId: "1:1000387369814:web:f8be0459c7405138f094f7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* ===========================================================
   CONSTANTS
=========================================================== */
const DEFAULT_AVATAR = "images/avatars/default-avatar.png";
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/du1zkaegu/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "profile_pics";
const OPENWEATHER_API_KEY = "e3df2627a6e84e74f383cc633e37fb77";


/* ===========================================================
   NAVIGATION CONTROL
=========================================================== */
function updateNav(user) {
  const login = document.getElementById("nav-login");
  const register = document.getElementById("nav-register");
  const logout = document.getElementById("nav-logout");
  const chat = document.getElementById("nav-chat");
  const weather = document.getElementById("nav-weather");
  const avatarContainer = document.getElementById("nav-avatar-container");
  const avatarImg = document.getElementById("nav-avatar");

  if (!login) return;

  if (user) {
    login.style.display = "none";
    register.style.display = "none";
    logout.style.display = "inline-block";

    if (chat) chat.style.display = "inline-block";
    if (weather) weather.style.display = "inline-block";

    if (avatarContainer) avatarContainer.style.display = "flex";
    if (avatarImg) avatarImg.src = user.photoURL || DEFAULT_AVATAR;
  } else {
    login.style.display = "inline-block";
    register.style.display = "inline-block";
    logout.style.display = "none";

    if (chat) chat.style.display = "none";
    if (weather) weather.style.display = "none";

    if (avatarContainer) avatarContainer.style.display = "none";
  }
}


/* ===========================================================
   LOAD PROFILE DATA
=========================================================== */
async function loadProfile(user) {
  if (!user) return;

  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profileVerified = document.getElementById("profile-verified");
  const profileCreated = document.getElementById("profile-created");
  const avatarImg = document.getElementById("profile-avatar-img");

  const bkType = document.getElementById("bk-type-display");
  const bkLocation = document.getElementById("bk-location-display");
  const bkHives = document.getElementById("bk-hives-display");
  const bkExperience = document.getElementById("bk-experience-display");

  if (avatarImg) avatarImg.src = user.photoURL || DEFAULT_AVATAR;
  if (profileName) profileName.textContent = user.displayName || "—";
  if (profileEmail) profileEmail.textContent = user.email || "—";
  if (profileVerified) profileVerified.textContent = user.emailVerified ? "✔ Επιβεβαιωμένο" : "❌ Μη επιβεβαιωμένο";
  if (profileCreated) profileCreated.textContent = user.metadata.creationTime;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    if (bkType) bkType.textContent = data.bkType || "—";
    if (bkLocation) bkLocation.textContent = data.bkLocation || "—";
    if (bkHives) bkHives.textContent = data.bkHives || "—";
    if (bkExperience) bkExperience.textContent = data.bkExperience || "—";
  }
}


/* ===========================================================
   REGISTER
=========================================================== */
const regForm = document.getElementById("register-form");
let selectedAvatar = null;

const avatarOptionsReg = document.querySelectorAll(".reg-avatar-option");
if (avatarOptionsReg.length > 0) {
  avatarOptionsReg.forEach(img => {
    img.addEventListener("click", () => {
      avatarOptionsReg.forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
      selectedAvatar = img.src;
    });
  });
}

if (regForm) {
  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-password").value.trim();
    const pass2 = document.getElementById("reg-password2").value.trim();
    const msg = document.getElementById("auth-error");

    if (pass !== pass2) {
      msg.textContent = "Οι κωδικοί δεν ταιριάζουν.";
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      await updateProfile(cred.user, {
        displayName: name,
        photoURL: selectedAvatar || DEFAULT_AVATAR,
      });

      await setDoc(doc(db, "users", cred.user.uid), {
        bkType: "",
        bkLocation: "",
        bkHives: "",
        bkExperience: ""
      });

      window.location.href = "verify.html";

    } catch (err) {
      msg.textContent = err.message;
    }
  });
}


/* ===========================================================
   LOGIN
=========================================================== */
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value.trim();
    const msg = document.getElementById("auth-error");

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = "index.html";
    } catch {
      msg.textContent = "Λάθος email ή κωδικός.";
    }
  });
}


/* ===========================================================
   LOGOUT
=========================================================== */
const logoutBtn = document.getElementById("nav-logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.reload();
  });
}


/* ===========================================================
   EDIT PROFILE
=========================================================== */
function showSuccess(msg) {
  const box = document.getElementById("update-success");
  if (!box) return;
  box.textContent = msg;
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 2500);
}

function showError(msg) {
  const box = document.getElementById("update-error");
  if (!box) return;
  box.textContent = msg;
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 3000);
}

const saveNameBtn = document.getElementById("save-name");
if (saveNameBtn) {
  saveNameBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
    const newName = document.getElementById("edit-name").value.trim();

    try {
      await updateProfile(user, { displayName: newName });
      showSuccess("Το όνομα ενημερώθηκε!");
    } catch (err) {
      showError(err.message);
    }
  });
}

const changeEmailBtn = document.getElementById("change-email-btn");
if (changeEmailBtn) {
  changeEmailBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;
    const email = document.getElementById("edit-email").value.trim();

    try {
      await updateEmail(user, email);
      showSuccess("Το email ενημερώθηκε!");
    } catch (err) {
      showError(err.message);
    }
  });
}

const savePassBtn = document.getElementById("save-password");
if (savePassBtn) {
  savePassBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    const oldPass = document.getElementById("old-password").value;
    const newPass = document.getElementById("new-password").value;

    try {
      const cred = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);

      showSuccess("Ο κωδικός ενημερώθηκε!");
    } catch (err) {
      showError(err.message);
    }
  });
}

const saveBeeProfile = document.getElementById("save-beeprofile-btn");
if (saveBeeProfile) {
  saveBeeProfile.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    await updateDoc(ref, {
      bkType: document.getElementById("bk-type").value,
      bkLocation: document.getElementById("bk-location").value,
      bkHives: document.getElementById("bk-hives").value,
      bkExperience: document.getElementById("bk-experience").value,
    });

    showSuccess("Τα στοιχεία μελισσοκόμου ενημερώθηκαν!");
  });
}


/* ===========================================================
   AVATAR MODAL
=========================================================== */
function safeClick(elem, callback) {
  if (elem) elem.addEventListener("click", callback);
}

const avatarModal = document.getElementById("avatar-modal");
const avatarClose = document.querySelector(".avatar-modal-close");
const avatarOptions = document.querySelectorAll(".avatar-option");
const changeAvatarBtn = document.getElementById("change-avatar-btn");
const avatarUploadBtn = document.getElementById("avatar-upload-btn");
const avatarResetBtn = document.getElementById("avatar-reset-btn");
const avatarFile = document.getElementById("avatar-file");

safeClick(changeAvatarBtn, () => (avatarModal.style.display = "block"));
safeClick(avatarClose, () => (avatarModal.style.display = "none"));

avatarOptions.forEach(img => {
  img.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return;

    await updateProfile(user, { photoURL: img.src });

    const profileAvatar = document.getElementById("profile-avatar-img");
    const navAvatar = document.getElementById("nav-avatar");

    if (profileAvatar) profileAvatar.src = img.src;
    if (navAvatar) navAvatar.src = img.src;

    avatarModal.style.display = "none";
  });
});

safeClick(avatarResetBtn, async () => {
  const user = auth.currentUser;
  if (!user) return;

  await updateProfile(user, { photoURL: DEFAULT_AVATAR });

  const profileAvatar = document.getElementById("profile-avatar-img");
  const navAvatar = document.getElementById("nav-avatar");

  if (profileAvatar) profileAvatar.src = DEFAULT_AVATAR;
  if (navAvatar) navAvatar.src = DEFAULT_AVATAR;

  avatarModal.style.display = "none";
});

safeClick(avatarUploadBtn, () => avatarFile.click());

if (avatarFile) {
  avatarFile.addEventListener("change", async () => {
    const user = auth.currentUser;
    if (!user) return;

    const file = avatarFile.files[0];
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    await updateProfile(user, { photoURL: data.secure_url });

    const profileAvatar = document.getElementById("profile-avatar-img");
    const navAvatar = document.getElementById("nav-avatar");

    if (profileAvatar) profileAvatar.src = data.secure_url;
    if (navAvatar) navAvatar.src = data.secure_url;

    avatarModal.style.display = "none";
  });
}


/* ===========================================================
   WEATHER MODULE
=========================================================== */
async function fetchWeather(location) {
  const res = await fetch(
    "https://api.openweathermap.org/data/2.5/weather?q=" +
      encodeURIComponent(location) +
      "&units=metric&lang=el&appid=" +
      OPENWEATHER_API_KEY
  );

  return res.json();
}

/* GPS WEATHER */
async function fetchWeatherByCoords(lat, lon) {
  const res = await fetch(
    "https://api.openweathermap.org/data/2.5/weather?lat=" +
      lat +
      "&lon=" +
      lon +
      "&units=metric&lang=el&appid=" +
      OPENWEATHER_API_KEY
  );
  return res.json();
}

function initWeather() {
  const input = document.getElementById("weather-input");
  const btn = document.getElementById("weather-search-btn");
  const gpsBtn = document.getElementById("weather-gps-btn");

  const info = document.getElementById("weather-info");
  const error = document.getElementById("weather-error");
  const load = document.getElementById("weather-loading");

  if (!btn) return;

  /* Manual Search */
  btn.addEventListener("click", async () => {
    let val = input.value.trim();
    val = autoCorrectCity(val);
    input.value = val;
    if (!val) return;

    load.style.display = "block";
    error.style.display = "none";
    info.style.display = "none";

    try {
      const data = await fetchWeather(val);

      if (data.cod !== 200) throw new Error();

      document.getElementById("weather-location").textContent = data.name;
      document.getElementById("weather-temp").textContent = Math.round(data.main.temp);
      document.getElementById("weather-feels").textContent = Math.round(data.main.feels_like);
      document.getElementById("weather-desc").textContent = data.weather[0].description;
      document.getElementById("weather-wind").textContent = data.wind.speed;
      document.getElementById("weather-hum").textContent = data.main.humidity;

      info.style.display = "block";
      load.style.display = "none";
    } catch {
      load.style.display = "none";
      error.style.display = "block";
      error.textContent = "Δεν βρέθηκαν δεδομένα για αυτή την περιοχή.";
    }
  });

  /* GPS Search */
  if (gpsBtn) {
    gpsBtn.addEventListener("click", () => {
      load.style.display = "block";
      error.style.display = "none";
      info.style.display = "none";

      if (!navigator.geolocation) {
        load.style.display = "none";
        error.style.display = "block";
        error.textContent = "Η συσκευή δεν υποστηρίζει εντοπισμό τοποθεσίας.";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          try {
            const data = await fetchWeatherByCoords(lat, lon);

            document.getElementById("weather-location").textContent = data.name;
            document.getElementById("weather-temp").textContent = Math.round(data.main.temp);
            document.getElementById("weather-feels").textContent = Math.round(data.main.feels_like);
            document.getElementById("weather-desc").textContent = data.weather[0].description;
            document.getElementById("weather-wind").textContent = data.wind.speed;
            document.getElementById("weather-hum").textContent = data.main.humidity;

            info.style.display = "block";
            load.style.display = "none";
          } catch {
            load.style.display = "none";
            error.style.display = "block";
            error.textContent = "Αποτυχία λήψης δεδομένων.";
          }
        },
        () => {
          load.style.display = "none";
          error.style.display = "block";
          error.textContent = "Δεν δώσατε άδεια για τοποθεσία.";
        }
      );
    });
  }
}


/* ===========================================================
   REAL-TIME CHAT
=========================================================== */
function initChat(user) {
  const msgBox = document.getElementById("chat-messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const empty = document.getElementById("chat-empty");

  if (!form) return;

  const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, snapshot => {
    msgBox.innerHTML = "";

    if (snapshot.empty) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    snapshot.forEach(docu => {
      const data = docu.data();

      const div = document.createElement("div");
      div.className = "chat-message" + (data.uid === user.uid ? " me" : "");
      div.innerHTML = `
        <div class="chat-meta">${data.name} • ${new Date(
        data.timestamp?.toDate()
      ).toLocaleString()}</div>
        ${data.text}
      `;

      msgBox.appendChild(div);
      msgBox.scrollTop = msgBox.scrollHeight;
    });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    await addDoc(collection(db, "messages"), {
      uid: user.uid,
      name: user.displayName || "Χρήστης",
      avatar: user.photoURL,
      text,
      timestamp: serverTimestamp(),
    });

    input.value = "";
  });
}


/* ===========================================================
   AUTH LISTENER (PAGE INITIALIZER)
=========================================================== */
onAuthStateChanged(auth, user => {
  updateNav(user);

  if (user && document.getElementById("profile-page")) {
    loadProfile(user);
  }

  if (document.getElementById("weather-input")) {
    initWeather();
  }

  if (document.getElementById("chat-page") && user) {
    initChat(user);
  }
});