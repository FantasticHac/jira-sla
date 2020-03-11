import ForgeUI, {
  render,
  Text,
  Button,
  useState,
  useProductContext,
  Fragment
} from "@forge/ui";
import api from "@forge/api";
import { differenceInDays } from "date-fns";

import {
  getDataFromJira,
  generateHealthInfoTextContent,
  generateMovementInfoTextContent,
  generateSprintInfoTextContent,
  generateIsBlockedByTextContent
} from "./helpers";

const App = () => {
  // custom field with Sprint age data is diffrent on each instance (customfield_10020)
  const composeGetIssueUrl = issueKey =>
    `/rest/api/3/issue/${issueKey}?fields=updated,customfield_10020,issuelinks&expand=versionedRepresentations`;

  const {
    platformContext: { issueKey }
  } = useProductContext();

  const [issueData, setIssueData] = useState(
    getDataFromJira(composeGetIssueUrl(issueKey))
  );
  const [serverData] = useState(getDataFromJira("/rest/api/3/serverInfo"));

  // with use of &expand=versionedRepresentations needs to deconstruct appropriate version
  const {
    versionedRepresentations: {
      updated: { 1: updated },
      // check custom field with Sprint age!
      customfield_10020: { 2: sprintCustomField },
      issuelinks: { 1: issuelinks }
    }
  } = issueData;

  const daysFromUpdate = differenceInDays(new Date(), new Date(updated));

  // need to have Jira Software sprint field to access sprint data
  const oldSprintsNames = sprintCustomField
    ? sprintCustomField.reduce(
        (sprintNames, currentSprint) =>
          currentSprint.state === "closed"
            ? [...sprintNames, currentSprint.name]
            : sprintNames,
        []
      )
    : [];

  const issueSprintAge = oldSprintsNames.length;

  const blockers = issuelinks.filter(
    link =>
      link.type.inward === "is blocked by" && link.hasOwnProperty("inwardIssue")
  );

  const numberOfBlockers = blockers.length;

  const isIssueHealthy =
    issueSprintAge < 1 && daysFromUpdate < 3 && numberOfBlockers < 1;

  return (
    <Fragment>
      <Text content={generateHealthInfoTextContent(isIssueHealthy)} />
      <Text content='**Symptoms includes:**' />
      <Text content={generateMovementInfoTextContent(daysFromUpdate)} />
      <Text content={generateSprintInfoTextContent(issueSprintAge)} />
      {sprintCustomField &&
        oldSprintsNames.map(sprintName => (
          <Text content={`󠀠󠀠󠀠               • ${sprintName}`} />
        ))}
      <Text content={generateIsBlockedByTextContent(numberOfBlockers)} />
      {blockers.map(({ inwardIssue: { key: blockingIssueKey } }) => (
        <Text
          content={`󠀠󠀠󠀠               • [${blockingIssueKey}](${serverData.baseUrl}/browse/${blockingIssueKey})`}
        />
      ))}
      <Button
        text={`🌀 Refresh`}
        onClick={() => {
          setIssueData(getDataFromJira(composeGetIssueUrl(issueKey)));
        }}
      />
    </Fragment>
  );
};

export const run = render(<App />);
