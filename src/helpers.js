export const getDataFromJira = async url => {
  try {
    const response = await api.asUser().requestJira(url);
    return await response.json();
  } catch (error) {
    console.log("getDataFromJira error: ", error);
    throw error;
  }
};

const pluralizeString = num => (num > 1 ? "s" : "");

export const generateHealthInfoTextContent = sprintIsHealthy =>
  !sprintIsHealthy
    ? "This story seems a little sick 🤒"
    : "No worries! This story is healthy 🎉";

export const generateSprintInfoTextContent = issueSprintAge =>
  issueSprintAge
    ? `🔥🥔   Rolled over from ${issueSprintAge} previous sprint${pluralizeString(
        issueSprintAge
      )}`
    : "🌊🍒   No rollovers, this issue is so fresh";

export const generateMovementInfoTextContent = daysFromUpdate =>
  daysFromUpdate > 3
    ? `🗿        No movement in ${daysFromUpdate} days`
    : "🏋️        There was some movement in last 3 days ";

export const generateIsBlockedByTextContent = numberOfBlockers =>
  numberOfBlockers > 0
    ? `🚫        Blocked by ${numberOfBlockers} unresolved issue${pluralizeString(
        numberOfBlockers
      )}`
    : "🥝        No blockers for this issue";
