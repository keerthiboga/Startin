import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, update } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

document.getElementById("submit-fund").addEventListener("click", () => {
    const amount = parseFloat(document.getElementById("fund-amount").value);

    if (!amount || amount <= 0) {
        document.getElementById("gateway-message").innerText = "Please enter a valid amount.";
        return;
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Assuming `ideaId` is passed in URL as a parameter
            const urlParams = new URLSearchParams(window.location.search);
            const ideaId = urlParams.get("ideaId");

            if (ideaId) {
                const fundRef = ref(db, `users/${user.uid}/funds`);
                const newFund = push(fundRef);
                update(newFund, {
                    ideaId,
                    amount,
                    timestamp: new Date().toISOString()
                }).then(() => {
                    document.getElementById("gateway-message").innerText = "Funding successful!";
                    setTimeout(() => {
                        window.location.href = "home.html";
                    }, 1500);
                }).catch((error) => {
                    console.error("Error funding the project:", error);
                    document.getElementById("gateway-message").innerText = "Error funding the project.";
                });
            } else {
                alert("Idea ID is missing.");
                window.location.href = "home.html";
            }
        } else {
            alert("Please sign in to fund this idea.");
            window.location.href = "signin.html";
        }
    });
});
