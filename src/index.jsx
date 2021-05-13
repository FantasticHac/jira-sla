import ForgeUI, {
  render,
  IssueGlance,
  Avatar,
  AvatarStack,
  ModalDialog,
  Text,
  Button,
  Form,
  TextArea,
  StatusLozenge,
  Table,
  Head,
  Cell,
  Row,
  useState,
  useProductContext,
  Fragment,
  Strong,
  Link
} from "@forge/ui";
import { storage } from '@forge/api';
import { differenceInDays, format, max } from "date-fns";

import {
  DEFAULT_NOTIFY_BODY,
  DEFAULT_CONFIGURATION,
  STORAGE_KEY,
  getDataFromJira,
  generateLinkedIssuesData,
  composeGetIssueUrl,
  composeOldSprintsUrl,
  pluralizeString,
  generateOldSprints,
  sendEmailToAssignee,
  mapIssueStatusToLozengeAppearance,
  getIssueChangelog,
} from "./helpers";



const App = () => {
  const {
    platformContext: { issueKey, projectKey }
  } = useProductContext();
  const [serverData] = useState(() => getDataFromJira("/rest/api/3/serverInfo"));
  const [fieldsData] = useState(() => getDataFromJira("/rest/api/3/field"));
  const [storageData] = useState(async () => await storage.get(STORAGE_KEY) || DEFAULT_CONFIGURATION);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [historicalAssignees] = useState((storageData.isHistoricalAssigneeVisible && getIssueChangelog(issueKey)))

  const sprintCustomFieldKey =
    fieldsData && fieldsData.filter(field => field.name === "Sprint")[0].key;

  const [issueData] = useState(
    () => getDataFromJira(composeGetIssueUrl(issueKey, sprintCustomFieldKey))
  );
  const {
    versionedRepresentations: {
      [sprintCustomFieldKey]: { 2: sprintCustomField },
      issuelinks: { 1: issuelinks },
      assignee: { 1: assignee },
      statuscategorychangedate: { 1: statuscategorychangedate },
      comment: {
        1: { comments }
      }
    }
  } = issueData;

  const [linkedIssues] = useState(generateLinkedIssuesData(issuelinks));

  // need to have Jira Software sprint field to access sprint data
  const oldSprints = generateOldSprints(sprintCustomField, storageData.timeConfig);

  const issueSprintAge = oldSprints.length;

  const unresolvedLinks = linkedIssues.filter(
    issueLink =>
      issueLink.link.inwardIssue.fields.status.statusCategory.key !== "done"
  );

  const numberOfUnresolvedLinks = unresolvedLinks.length;

  const lastCommentUpdateDate =
  comments.length > 0 && comments[comments.length - 1].updated;

  const daysFromLastUpdate = differenceInDays(
    new Date(),
    max([new Date(lastCommentUpdateDate), new Date(statuscategorychangedate)])
  );

  const isIssueHealthy =
    issueSprintAge < 1 && daysFromLastUpdate < 7 && numberOfUnresolvedLinks < 1;

  const numberOfUnhealthyParams = [
    issueSprintAge < 1,
    daysFromLastUpdate < 7,
    numberOfUnresolvedLinks < 1
  ].reduce(
    (accumulator, currentValue) => accumulator + Number(!currentValue),
    0
  );

  const notifyAssignee = ({ notifyBody }) => {
    sendEmailToAssignee(issueKey, notifyBody);
  };

  const hideModal = () => setModalIsOpen(false);
  const showModal = () => setModalIsOpen(true);

  const renderStatus = () => (
    <Fragment>
      <Text>
        <StatusLozenge
          text={`${isIssueHealthy ? "ON" : "OFF"} TRACK`}
          appearance={isIssueHealthy ? "success" : "removed"}
        />
      </Text>
      {
        isIssueHealthy
            ? <Text content="Healthy and on track"/>
            : <Fragment>
              <Text>
                <Strong>Unhealthy: </Strong>{numberOfUnhealthyParams}/3 health issues
              </Text>
            </Fragment>
      }

    </Fragment>
  );

  const renderSprint = () => (
    <Fragment>
      <Text>
        <StatusLozenge
          text={`${issueSprintAge}`}
          appearance={issueSprintAge > 0 ? "removed" : "inprogress"}
        />
        {" "}
        <Strong>Issue{pluralizeString(issueSprintAge)} carried over</Strong>
      </Text>
      {sprintCustomField && oldSprints.length > 0 && serverData && (
        <Table>
          <Head>
            <Cell>
              <Text content="Sprint name" />
            </Cell>
            <Cell>
              <Text content="Start date" />
            </Cell>
          </Head>
          {oldSprints.map(oldSprint => (
            <Row>
              <Cell>
                <Text>
                  <Link href={composeOldSprintsUrl(projectKey, oldSprint.id, serverData.baseUrl)}>{oldSprint.name}</Link>
                </Text>
              </Cell>
              <Cell>
                <Text content={oldSprint.startDate} />
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </Fragment>
  );
  const renderLinks = () => (
    <Fragment>
      <Text>
        <StatusLozenge
          text={`${numberOfUnresolvedLinks}`}
          appearance={numberOfUnresolvedLinks > 0 ? "removed" : "inprogress"}
        />{" "}
        <Strong>Issue{pluralizeString(numberOfUnresolvedLinks)} in unresolved status</Strong>
      </Text>
      {linkedIssues && linkedIssues.length > 0 && serverData && (
        <Table>
          <Head>
            <Cell>
              <Text content="Issue key" />
            </Cell>
            <Cell>
              <Text content="Status" />
            </Cell>
            <Cell>
              <Text content="Owner" />
            </Cell>
          </Head>
          {linkedIssues.map(
            ({
              link: {
                inwardIssue: {
                  key: linkedIssueKey,
                  fields: {
                    status: {
                      statusCategory: { key: statusKey }
                    }
                  }
                }
              },
              assignee: linkedAssignee
            }) => (
              <Row>
                <Cell>
                  <Text>
                    <Link href={`${serverData.baseUrl}/browse/${linkedIssueKey}`}>{linkedIssueKey}</Link>
                  </Text>
                </Cell>
                <Cell>
                  <Text>
                    <StatusLozenge
                      text={statusKey}
                      appearance={mapIssueStatusToLozengeAppearance(statusKey)}
                    />
                  </Text>
                </Cell>
                <Cell>
                  {linkedAssignee && (
                    <AvatarStack>
                      <Avatar accountId={linkedAssignee.accountId} />
                    </AvatarStack>
                  )}
                </Cell>
              </Row>
            )
          )}
        </Table>
      )}
    </Fragment>
  );
  const renderActivity = () => (
    <Fragment>
      <Text>
        <Strong>Active in the last 7 days:</Strong>
        {" "}
        <StatusLozenge
          text={`${daysFromLastUpdate >= 7 ? "NO" : "YES"}`}
          appearance={daysFromLastUpdate >= 7 ? "removed" : "inprogress"}
        />
      </Text>
      <Table>
        <Head>
          <Cell>
            <Text content="Activity" />
          </Cell>
          <Cell>
            <Text content="Last change" />
          </Cell>
        </Head>
        {comments.length > 0 && (
          <Row>
            <Cell>
              <Text content="Comment" />
            </Cell>
            <Cell>
              <Text content={format(new Date(lastCommentUpdateDate), storageData.timeConfig)} />
            </Cell>
          </Row>
        )}
        <Row>
          <Cell>
            <Text content="Status change" />
          </Cell>
          <Cell>
            {statuscategorychangedate && (
              <Text content={format(new Date(statuscategorychangedate), storageData.timeConfig)} />
            )}
          </Cell>
        </Row>
      </Table>
    </Fragment>
  );
  const renderAssignee = () => (
    <Table>
      <Head>
        <Cell>
          <Text>
            <Strong>Assignee</Strong>
          </Text>
        </Cell>
      </Head>
      <Row>
        <Cell>
          <Avatar accountId={assignee.accountId} />
        </Cell>
        { storageData && storageData.isNotifyAssigneeButtonVisible && (
          <Cell>
            <Button text="Notify" onClick={showModal} />
          </Cell>
        )}
      </Row>
    </Table>
  );
  const renderModal = () => (
    <ModalDialog
      header="Notify assignee about this issue"
      closeButtonText="Close"
      onClose={hideModal}
    >
      <Form onSubmit={notifyAssignee} submitButtonText="Send">
        <TextArea
          isRequired
          spellCheck
          name="notifyBody"
          defaultValue={DEFAULT_NOTIFY_BODY}
        />
      </Form>
    </ModalDialog>
  );

  const renderHistoricalAssignees = () => (
    <Table>
      <Head>
        <Cell>
          <Text>
            <Strong>Historical Assignee</Strong>
          </Text>
        </Cell>
      </Head>
      {
        historicalAssignees.map(({items: { tmpToAccountId }, created}) => (

            <Row>
              <Cell>
                {
                  tmpToAccountId
                      ? <Avatar accountId={tmpToAccountId}/>
                      : <Text content="Unassinged issue" />
                }
              </Cell>
              <Cell>
                <Text content={format(new Date(created), storageData.timeConfig)} />
              </Cell>
            </Row>
        ))
      }

    </Table>
  )

  return (
    <Fragment>
      {renderStatus()}
      {renderSprint()}
      {renderLinks()}
      {renderActivity()}
      {storageData.isAssigneeVisible && assignee && renderAssignee()}
      {modalIsOpen && renderModal()}
      {historicalAssignees && historicalAssignees.length !== 0 && renderHistoricalAssignees()}
    </Fragment>
  );
};

export const run = render(
  <IssueGlance>
    <App />
  </IssueGlance>
);
