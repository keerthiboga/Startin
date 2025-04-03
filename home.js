// Redirect to profile page
document.getElementById("profile-button").addEventListener("click", () => {
    window.location.href = "profile.html";
});

// Redirect to add idea page
document.getElementById("add-idea-button").addEventListener("click", () => {
    window.location.href = "add_idea.html";
});

// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
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
const db = getDatabase(app);

function loadIdeas(userId) {
    const ideasGrid = document.getElementById("ideas-grid");
    ideasGrid.innerHTML = "";

    // Display skeleton placeholders initially
    for (let i = 0; i < 5; i++) {
        const skeletonCard = document.createElement("div");
        skeletonCard.classList.add("idea-card");

        const skeletonImage = document.createElement("div");
        skeletonImage.classList.add("skeleton", "skeleton-image");

        const skeletonTitle = document.createElement("div");
        skeletonTitle.classList.add("skeleton", "skeleton-title");

        skeletonCard.appendChild(skeletonImage);
        skeletonCard.appendChild(skeletonTitle);
        ideasGrid.appendChild(skeletonCard);
    }

    // Load ideas from Firebase
    const ideasRef = ref(db, `users/${userId}/ideas`);
    onValue(ideasRef, (snapshot) => {
        ideasGrid.innerHTML = ""; // Clear skeletons once data is ready

        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const ideaData = childSnapshot.val();

                // Create idea card
                const ideaCard = document.createElement("div");
                ideaCard.classList.add("idea-card");

                const img = document.createElement("img");
                img.src = ideaData.photoBase64 || "default-image.jpg"; // Fallback image if photoBase64 is not available
                img.alt = "Idea Image";

                const title = document.createElement("h2");
                title.innerText = ideaData.title;

                // Add click event to open detailed view of the idea
                ideaCard.addEventListener("click", () => {
                    window.location.href = `idea_detail.html?ideaId=${childSnapshot.key}`;
                });

                ideaCard.appendChild(img);
                ideaCard.appendChild(title);
                ideasGrid.appendChild(ideaCard);
            });
        } else {
            ideasGrid.innerHTML = "<p>No ideas found. Start by adding a new idea.</p>";
        }
    }, (error) => {
        console.error("Error fetching ideas:", error);
        ideasGrid.innerHTML = "<p>Failed to load ideas. Please try again later.</p>";
    });
}

// Check for user authentication and load ideas if signed in
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadIdeas(user.uid);
    } else {
        alert("Please sign in to view your ideas.");
        window.location.href = "signin.html";
    }
});
