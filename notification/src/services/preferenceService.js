const store = require('../store/notificationStore');

async function getPreferences(userId) {
  return store.getPreferences(userId);
}

async function updatePreferences(userId, channels) {
  return store.upsertPreferences(userId, channels);
}

module.exports = {
  getPreferences,
  updatePreferences,
};
