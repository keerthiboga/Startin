import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

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

// DOM Elements
const toggleButton = document.getElementById("toggle-button");
const formTitle = document.getElementById("form-title");
const usernameGroup = document.getElementById("username-group");
const usernameInput = document.getElementById("username");
const submitButton = document.getElementById("submit-button");
const messageDiv = document.getElementById("message");

// State for toggling between Sign In and Sign Up
let isSignIn = false;

// Toggle Sign In and Sign Up form display
toggleButton.addEventListener("click", () => {
    isSignIn = !isSignIn;
    formTitle.innerText = isSignIn ? "SIGN IN" : "CREATE ACCOUNT";
    usernameGroup.style.display = isSignIn ? "none" : "block";
    submitButton.innerText = isSignIn ? "SIGN IN" : "SIGN UP";
    toggleButton.innerText = isSignIn ? "SIGN UP" : "SIGN IN";

    // Clear form fields when toggling
    document.getElementById("auth-form").reset();
    messageDiv.innerText = "";  // Clear any messages

    // Toggle the `required` attribute for username based on form mode
    if (isSignIn) {
        usernameInput.removeAttribute("required");
    } else {
        usernameInput.setAttribute("required", "required");
    }
});

// Function to display messages
function displayMessage(message, type = "error") {
    messageDiv.innerText = message;
    messageDiv.style.color = type === "error" ? "red" : "green";
}

// Helper function to get email by username from Realtime Database
async function getEmailByUsername(username) {
    const usernameRef = ref(db, `usernames/${username}`);
    const snapshot = await get(usernameRef);
    if (snapshot.exists()) {
        const userId = snapshot.val().userId;
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);
        return userSnapshot.exists() ? userSnapshot.val().email : null;
    }
    return null;
}

// Form submission handler
document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect form values
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Validate input
    if (!email || !password || (!isSignIn && !username)) {
        displayMessage("Please fill in all required fields.");
        return;
    }

    try {
        if (isSignIn) {
            // Sign In logic using username or email
            console.log("Attempting to sign in...");
            let userEmail = email;

            if (username) {
                userEmail = await getEmailByUsername(username);
                if (!userEmail) {
                    displayMessage("Username not found.");
                    return;
                }
            }

            const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
            console.log("User signed in:", userCredential.user);
            displayMessage("Sign In Successful!", "success");

            // Redirect to home page after sign-in
            window.location.href = "home.html";
        } else {
            // Check if username is unique in Realtime Database
            console.log("Checking if username is unique...");
            const usernameRef = ref(db, `usernames/${username}`);
            const usernameSnap = await get(usernameRef);

            if (usernameSnap.exists()) {
                displayMessage("Username already taken. Please choose another one.");
                return;
            }

            // Create new user
            console.log("Creating new user...");
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            // Save username and user profile in Realtime Database
            await set(usernameRef, { userId });
            await set(ref(db, `users/${userId}`), {
                username,
                email
            });
            console.log("User profile stored in Realtime Database.");

            displayMessage("Sign Up Successful!", "success");

            // Redirect to home page after sign-up
            window.location.href = "home.html";
        }
    } catch (error) {
        console.error("Error during authentication:", error);
        displayMessage(isSignIn ? `Error signing in: ${error.message}` : `Error signing up: ${error.message}`);
    }
});
