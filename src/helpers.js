import api from "@forge/api";
import { format } from "date-fns";

export const DEFAULT_NOTIFY_BODY =
  "This issue needs your attention. Check with your team for any blockers.";

export const getDataFromJira = async url => {
  try {
    const response = await api.asUser().requestJira(url);
    return await response.json();
  } catch (error) {
    console.log("getDataFromJira error: ", error);
    throw error;
  }
};

export const generateLinkedIssuesData = issueLinks => () => {
  const data = Promise.all(
    issueLinks
      .filter(link => link.hasOwnProperty("inwardIssue"))
      .map(async link => {
        if (link.inwardIssue) {
          const assignee = await getDataFromJira(
            `/rest/api/3/issue/${link.inwardIssue.key}?fields=assignee&expand=versionedRepresentations`
          );

          return {
            link,
            assignee: assignee
              ? assignee.versionedRepresentations.assignee[1]
              : null
          };
        }
      })
  );
  return data;
};

export const composeGetIssueUrl = (issueKey, sprintCustomFieldKey) =>
  `/rest/api/3/issue/${issueKey}?fields=${sprintCustomFieldKey},issuelinks,assignee,statuscategorychangedate,comment&expand=versionedRepresentations`;

export const composeOldSprintsUrl = (projectKey, oldSprint, baseUrl) =>
  `[${oldSprint.name}](${baseUrl}/secure/RapidBoard.jspa?rapidView=2&projectKey=${projectKey}&view=reporting&chart=sprintRetrospective&sprint=${oldSprint.id})`;

export const pluralizeString = num => (num > 1 ? "s" : "");

export const generateOldSprints = sprintCustomField =>
  sprintCustomField
    ? sprintCustomField.reduce(
        (sprintNames, currentSprint) =>
          currentSprint.state === "closed"
            ? [
                ...sprintNames,
                {
                  name: currentSprint.name,
                  startDate: format(
                    new Date(currentSprint.startDate),
                    "yyyy-MM-dd"
                  ),
                  boardId: currentSprint.boardId,
                  id: currentSprint.id
                }
              ]
            : sprintNames,
        []
      )
    : [];

export const generateHealthInfoTextContent = (
  isIssueHealthy,
  numberOfUnhealthyParams
) =>
  isIssueHealthy
    ? "Healthy and on track"
    : `**Unhealthy:** ${numberOfUnhealthyParams}/3 health issues`;

export const mapIssueStatusToLozengeAppearance = issueStatus => {
  switch (issueStatus) {
    case "new":
      return "new";
    case "done":
      return "success";
    case "indeterminate":
      return "dafault";
    default:
      return "inprogress";
  }
};

export const sendEmailToAssignee = async (issueKey, notifyBody) => {
  const body = {
    htmlBody: notifyBody,
    subject: "Issue Health Monitor",
    to: {
      voters: false,
      watchers: false,
      groups: [
        {
          name: "jira-software-users"
        }
      ],
      reporter: false,
      assignee: true,
      users: []
    },
    restrict: {
      permissions: [],
      groups: []
    }
  };
  const response = await api
    .asUser()
    .requestJira(`/rest/api/3/issue/${issueKey}/notify`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
};
