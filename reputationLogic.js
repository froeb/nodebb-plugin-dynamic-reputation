// reputationLogic.js
"use strict";

const db = require.main.require("./src/database"); // NodeBB’s DB interface
const _ = require("lodash");

// Example weights – these could later be overridden by Admin plugin
let weights = {
  upvote: 2,
  downvote: -2,
  comment: 3,
  flag: -5,
  share: 4
};

const ReputationLogic = {
  setWeights(newWeights) {
    weights = Object.assign(weights, newWeights);
  },

  async updateUserReputation(userId, action) {
    try {
      const currentReputation = await db.getObjectField(`user:${userId}`, "dynamicReputation");
      const score = parseInt(currentReputation, 10) || 0;
      const newScore = score + (weights[action] || 0);

      // Store updated reputation
      await db.setObjectField(`user:${userId}`, "dynamicReputation", newScore);
      return newScore;
    } catch (err) {
      console.error("Error updating user reputation:", err);
      throw err;
    }
  },

  async updateArticleReputation(articleId, action) {
    try {
      const currentReputation = await db.getObjectField(`article:${articleId}`, "dynamicReputation");
      const score = parseInt(currentReputation, 10) || 0;
      const newScore = score + (weights[action] || 0);

      // Store updated reputation
      await db.setObjectField(`article:${articleId}`, "dynamicReputation", newScore);
      return newScore;
    } catch (err) {
      console.error("Error updating article reputation:", err);
      throw err;
    }
  }
};

module.exports = ReputationLogic;
