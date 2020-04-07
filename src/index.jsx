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
  Lozenge,
  Table,
  Head,
  Cell,
  Row,
  useState,
  useProductContext,
  Fragment
} from "@forge/ui";
import { differenceInDays, format, max } from "date-fns";

import {
  DEFAULT_NOTIFY_BODY,
  getDataFromJira,
  generateLinkedIssuesData,
  composeGetIssueUrl,
  composeOldSprintsUrl,
  pluralizeString,
  generateOldSprints,
  generateHealthInfoTextContent,
  sendEmailToAssignee,
  mapIssueStatusToLozengeAppearance
} from "./helpers";

const App = () => {
  const {
    platformContext: { issueKey, projectKey }
  } = useProductContext();
  const [serverData] = useState(() => getDataFromJira("/rest/api/3/serverInfo"));
  const [fieldsData] = useState(() => getDataFromJira("/rest/api/3/field"));
  const [modalIsOpen, setModalIsOpen] = useState(false);

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
  const oldSprints = generateOldSprints(sprintCustomField);

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
        <Lozenge
          text={`${isIssueHealthy ? "ON" : "OFF"} TRACK`}
          appearance={isIssueHealthy ? "success" : "removed"}
        />
      </Text>
      <Text
        content={generateHealthInfoTextContent(
          isIssueHealthy,
          numberOfUnhealthyParams
        )}
      />
    </Fragment>
  );

  const renderSprint = () => (
    <Fragment>
      <Text>
        <Lozenge
          text={`${issueSprintAge}`}
          appearance={issueSprintAge > 0 ? "removed" : "inprogress"}
        />{" "}
        {`**Issue${pluralizeString(issueSprintAge)} carried over**`}
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
                <Text
                  content={composeOldSprintsUrl(
                    projectKey,
                    oldSprint,
                    serverData.baseUrl
                  )}
                />
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
        <Lozenge
          text={`${numberOfUnresolvedLinks}`}
          appearance={numberOfUnresolvedLinks > 0 ? "removed" : "inprogress"}
        />{" "}
        {`**Issue${pluralizeString(numberOfUnresolvedLinks)} in unresolved status**`}
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
                  <Text
                    content={`[${linkedIssueKey}](${serverData.baseUrl}/browse/${linkedIssueKey})`}
                  />
                </Cell>
                <Cell>
                  <Text>
                    <Lozenge
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
        **Active in the last 7 days:**{" "}
        <Lozenge
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
              <Text
                content={format(new Date(lastCommentUpdateDate), "yyyy-MM-dd")}
              />
            </Cell>
          </Row>
        )}
        <Row>
          <Cell>
            <Text content="Status change" />
          </Cell>
          <Cell>
            {statuscategorychangedate && (
              <Text
                content={format(
                  new Date(statuscategorychangedate),
                  "yyyy-MM-dd"
                )}
              />
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
          <Text content="**Assignee**" />
        </Cell>
        <Cell>
          <Text content="" />
        </Cell>
      </Head>
      <Row>
        <Cell>
          <Avatar accountId={assignee.accountId} />
        </Cell>
        <Cell>
          <Button text="Notify" onClick={showModal} />
        </Cell>
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

  return (
    <Fragment>
      {renderStatus()}
      {renderSprint()}
      {renderLinks()}
      {renderActivity()}
      {assignee && renderAssignee()}
      {modalIsOpen && renderModal()}
    </Fragment>
  );
};

export const run = render(
  <IssueGlance>
    <App />
  </IssueGlance>
);
