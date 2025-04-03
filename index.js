const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.evaluateIdeas = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
    const db = admin.database();
    const ideasRef = db.ref('ideasFeedback');
    const ideasSnapshot = await ideasRef.once('value');

    ideasSnapshot.forEach(async (ideaSnapshot) => {
        const ideaId = ideaSnapshot.key;
        const feedbackCounts = ideaSnapshot.val().feedbackCounts;

        const totalFeedback = feedbackCounts.green + feedbackCounts.yellow + feedbackCounts.red;
        const redPercentage = (feedbackCounts.red / totalFeedback) * 100;
        const greenPercentage = (feedbackCounts.green / totalFeedback) * 100;

        if (redPercentage > 50) {
            // Delete the idea if it has over 50% red feedback
            await db.ref(`ideas/${ideaId}`).remove();
            await ideasRef.child(ideaId).remove();
            console.log(`Idea ${ideaId} deleted due to high negative feedback.`);
        } else if (greenPercentage > 50) {
            // Mark as highlighted if over 50% positive feedback
            await db.ref(`highlightedIdeas/${ideaId}`).set({ highlighted: true });
            console.log(`Idea ${ideaId} marked as highlighted due to positive feedback.`);
        }
    });

    return null;
});
