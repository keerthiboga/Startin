import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "your_api_key",
    authDomain: "your_project_id.firebaseapp.com",
    databaseURL: "https://your_project_id.firebaseio.com",
    projectId: "your_project_id",
    storageBucket: "your_project_id.appspot.com",
    messagingSenderId: "your_sender_id",
    appId: "your_app_id",
    measurementId: "your_measurement_id"
        };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let userId;

// Authentication state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        await loadUserProfile();
        await loadUserIdeas();
    } else {
        window.location.href = "index.html";
    }
});

// Load User Profile Data
async function loadUserProfile() {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById("username-display").innerText = data.username || "Username";
        document.getElementById("bio-display").innerText = data.bio || "Click to add bio";
        document.getElementById("funds-count").innerText = data.funds || 0;
        document.getElementById("ideas-count").innerText = data.ideas || 0;
        document.getElementById("investor-count").innerText = data.investors || 0;

        if (data.profilePicUrl) {
            document.getElementById("profile-pic").src = data.profilePicUrl;
        }
    }
}

// Change Profile Picture
document.getElementById("change-pic-btn").addEventListener("click", () => {
    document.getElementById("upload-profile-pic").click();
});

document.getElementById("upload-profile-pic").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
        const profilePicRef = ref(storage, `profilePictures/${userId}`);
        await uploadBytes(profilePicRef, file);
        const url = await getDownloadURL(profilePicRef);

        await setDoc(doc(db, "users", userId), { profilePicUrl: url }, { merge: true });
        document.getElementById("profile-pic").src = url;
        alert("Profile picture updated successfully!");
    }
});

// Load User Ideas
async function loadUserIdeas() {
    const ideasGrid = document.getElementById("ideas-grid");
    ideasGrid.innerHTML = ""; // Clear existing ideas

    const ideasSnapshot = await getDocs(query(collection(db, "ideas"), where("userId", "==", userId)));
    ideasSnapshot.forEach((doc) => {
        const ideaData = doc.data();
        const ideaCard = document.createElement("div");
        ideaCard.className = "idea-card";
        ideaCard.innerHTML = `<img src="${ideaData.photoUrl}" alt="${ideaData.title}">`;

        ideaCard.addEventListener("click", () => showIdeaDetails(ideaData));
        ideasGrid.appendChild(ideaCard);
    });
}

// Show Idea Details in Full-Screen Dialog
function showIdeaDetails(ideaData) {
    document.getElementById("idea-image").src = ideaData.photoUrl;
    document.getElementById("idea-title").innerText = ideaData.title;
    document.getElementById("idea-description").innerText = ideaData.description;
    document.getElementById("idea-patent").href = ideaData.patentUrl;

    document.getElementById("idea-dialog").classList.remove("hidden");
}

document.getElementById("close-dialog").addEventListener("click", () => {
    document.getElementById("idea-dialog").classList.add("hidden");
});
