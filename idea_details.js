import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

// Get ideaId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const ideaId = urlParams.get("ideaId");

if (!ideaId) {
    alert("No idea ID provided in the URL.");
} else {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadIdeaDetails(user.uid, ideaId);
            checkFeedbackStatus(user.uid, ideaId);
        } else {
            alert("Please sign in to view idea details.");
            window.location.href = "signin.html";
        }
    });
}

// Function to load and display idea details
async function loadIdeaDetails(userId, ideaId) {
    try {
        const ideaRef = ref(db, `users/${userId}/ideas/${ideaId}`);
        const snapshot = await get(ideaRef);

        if (snapshot.exists()) {
            const ideaData = snapshot.val();

            // Set image source
            const ideaImage = document.getElementById("idea-image");
            if (ideaData.photoBase64) {
                ideaImage.src = ideaData.photoBase64;
                ideaImage.style.display = "block";
            } else {
                ideaImage.alt = "No image available.";
            }

            // Populate other details
            document.getElementById("idea-title").innerText = ideaData.title;
            document.getElementById("idea-description").innerText = ideaData.description;
            document.getElementById("idea-budget").innerText = `Budget: $${ideaData.budget}`;
            document.getElementById("fund-button").style.display = "inline-block";

            // Remove skeleton classes after loading content
            document.querySelector(".idea-image-container").classList.remove("skeleton", "skeleton-photo");
            document.getElementById("idea-title").classList.remove("skeleton", "skeleton-title");
            document.getElementById("idea-description").classList.remove("skeleton", "skeleton-description");
            document.getElementById("idea-budget").classList.remove("skeleton", "skeleton-budget");

            // Add event listener to fund button
            document.getElementById("fund-button").addEventListener("click", () => {
                window.location.href = `gateway.html?ideaId=${ideaId}&userId=${userId}`;
            });
        } else {
            alert("Idea not found.");
        }
    } catch (error) {
        console.error("Error loading idea details:", error);
        alert("Failed to load idea details.");
    }
}

// Function to check if the user has already given feedback
async function checkFeedbackStatus(userId, ideaId) {
    const feedbackStatusRef = ref(db, `ideasFeedback/${ideaId}/userFeedback/${userId}`);
    const snapshot = await get(feedbackStatusRef);

    if (snapshot.exists()) {
        // User has already provided feedback
        document.getElementById("good-button").disabled = true;
        document.getElementById("ok-button").disabled = true;
        document.getElementById("bad-button").disabled = true;
        alert("You have already submitted feedback for this idea.");
    } else {
        // User hasn't given feedback yet
        document.getElementById("good-button").addEventListener("click", () => submitFeedback("green", userId));
        document.getElementById("ok-button").addEventListener("click", () => submitFeedback("yellow", userId));
        document.getElementById("bad-button").addEventListener("click", () => submitFeedback("red", userId));
    }
}

// Handle feedback submission and limit to one feedback per user
async function submitFeedback(type, userId) {
    try {
        const feedbackRef = ref(db, `ideasFeedback/${ideaId}/feedbackCounts`);
        const userFeedbackRef = ref(db, `ideasFeedback/${ideaId}/userFeedback/${userId}`);
        
        const snapshot = await get(feedbackRef);
        let feedbackData = { green: 0, yellow: 0, red: 0 };

        if (snapshot.exists()) {
            feedbackData = snapshot.val();
        }

        feedbackData[type] += 1;

        // Update feedback counts and record that the user has submitted feedback
        await update(feedbackRef, feedbackData);
        await set(userFeedbackRef, { feedbackGiven: true });

        alert("Thank you for your feedback!");
        
        // Disable feedback buttons to prevent multiple feedbacks
        document.getElementById("good-button").onclick = () => alert("Feedback already recorded.");
        document.getElementById("ok-button").onclick = () => alert("Feedback already recorded.");
        document.getElementById("bad-button").onclick = () => alert("Feedback already recorded.");
    } catch (error) {
        console.error("Error submitting feedback:", error);
        alert("Failed to submit feedback.");
    }
}
