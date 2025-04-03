import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set, push, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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
const db = getDatabase(app);

document.getElementById("idea-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("idea-title").value.trim();
    const description = document.getElementById("idea-description").value.trim();
    const budget = document.getElementById("idea-budget").value.trim(); // New budget field
    const fileInput = document.getElementById("idea-photo");
    const submissionMessage = document.getElementById("submission-message");

    if (fileInput.files.length === 0) {
        submissionMessage.innerText = "Please upload a project photo.";
        submissionMessage.style.color = "red";
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
        const photoBase64 = reader.result;

        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            console.log("User ID:", userId); // Debugging output

            // Attempt to fetch username from Realtime Database
            try {
                const usernameRef = ref(db, `users/${userId}/username`);
                const snapshot = await get(usernameRef);

                if (snapshot.exists()) {
                    const username = snapshot.val();
                    console.log("Username found:", username); // Debugging output

                    // Store idea data in Realtime Database under user's ID
                    const ideasRef = ref(db, `users/${userId}/ideas`);
                    await push(ideasRef, {
                        username,
                        title,
                        description,
                        budget, // Save budget field
                        photoBase64
                    });

                    submissionMessage.innerText = "Idea submitted successfully!";
                    submissionMessage.style.color = "green";

                    // Clear the form
                    document.getElementById("idea-form").reset();

                    // Redirect to home page
                    window.location.href = "home.html";
                } else {
                    console.error("Username not found in Realtime Database.");
                    submissionMessage.innerText = "Username not found in Realtime Database.";
                    submissionMessage.style.color = "red";
                }
            } catch (error) {
                console.error("Error retrieving username:", error);
                submissionMessage.innerText = "Error retrieving username. Please try again.";
                submissionMessage.style.color = "red";
            }
        } else {
            submissionMessage.innerText = "Error: User not signed in.";
            submissionMessage.style.color = "red";
        }
    };

    reader.onerror = (error) => {
        console.error("Error encoding image:", error);
        submissionMessage.innerText = "Error submitting idea. Please try again.";
        submissionMessage.style.color = "red";
    };
});
