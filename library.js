// library.js
"use strict";

const eventEmitter = require("./eventEmitter");
const ReputationLogic = require("./reputationLogic");

const plugin = {};

plugin.init = async function (params) {
  // Called on static:app.load
  // `params` includes router, middleware, etc.
  const { router, middleware, controllers } = params;
  // You can add custom routes here if needed

  // For demonstration, a custom route to manually “share an article”
  router.post("/reputation/share", middleware.ensureLoggedIn, async (req, res) => {
    try {
      const { articleId } = req.body;
      const userId = req.user.uid;
      // Emit event for sharing
      eventEmitter.emit("articleShared", { userId, articleId });

      // Return success
      res.status(200).json({ message: "Article shared" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  console.log("Dynamic Reputation Plugin initialized!");
};

plugin.onPostSave = async function (hookData) {
  // Example: user posted or saved content => treat as “comment”
  if (hookData && hookData.post && hookData.post.uid) {
    eventEmitter.emit("commentCreated", {
      userId: hookData.post.uid,
      articleId: hookData.post.tid // Or custom article ID, if separate from topic
    });
  }
  return hookData;
};

plugin.onComment = async function (hookData) {
  // Possibly redundant, but you can handle comment logic here
  return hookData;
};

plugin.onFlag = async function (hookData) {
  // Example: user flagged a post => negative impact
  if (hookData && hookData.data && hookData.data.flagger && hookData.data.pid) {
    eventEmitter.emit("flaggedPost", {
      userId: hookData.data.flagger.uid,
      postId: hookData.data.pid
    });
  }
  return hookData;
};

plugin.onDownvote = async function (hookData) {
  // Some user downvoted a post
  if (hookData && hookData.uid && hookData.post && hookData.post.uid) {
    eventEmitter.emit("postDownvoted", {
      userId: hookData.post.uid,
      voterId: hookData.uid
    });
  }
  return hookData;
};

plugin.onUpvote = async function (hookData) {
  // Some user upvoted a post
  if (hookData && hookData.uid && hookData.post && hookData.post.uid) {
    eventEmitter.emit("postUpvoted", {
      userId: hookData.post.uid,
      voterId: hookData.uid
    });
  }
  return hookData;
};

// Subscribe to custom events
eventEmitter.on("articleShared", async (data) => {
  await ReputationLogic.updateUserReputation(data.userId, "share");
  await ReputationLogic.updateArticleReputation(data.articleId, "share");
});

eventEmitter.on("commentCreated", async (data) => {
  await ReputationLogic.updateUserReputation(data.userId, "comment");
  // Suppose comment always belongs to an article => update article too
  await ReputationLogic.updateArticleReputation(data.articleId, "comment");
});

eventEmitter.on("flaggedPost", async (data) => {
  await ReputationLogic.updateUserReputation(data.userId, "flag");
});

eventEmitter.on("postDownvoted", async (data) => {
  await ReputationLogic.updateUserReputation(data.userId, "downvote");
});

eventEmitter.on("postUpvoted", async (data) => {
  await ReputationLogic.updateUserReputation(data.userId, "upvote");
});

module.exports = plugin;
