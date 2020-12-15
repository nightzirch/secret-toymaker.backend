const { auth, db } = require("../config/firebase");

const getAllAuthUsers = async (nextPageToken, authUsers = []) => {
  const result = await auth.listUsers(1000, nextPageToken);

  if ((result.users && result.users.length > 0) || authUsers.length > 0) {
    result.users = (result.users || []).map((u) => u.toJSON());
    const allUsers = [...authUsers, ...result.users];
    return result.pageToken
      ? getAllAuthUsers(result.pageToken, allUsers)
      : allUsers;
  } else {
    return authUsers;
  }
};

module.exports = { getAllAuthUsers };
