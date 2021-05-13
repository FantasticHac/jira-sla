import ForgeUI, {
    render,
    AdminPage,
    Fragment,
    Form,
    Select,
    Option,
    Toggle,
    useState,
    useEffect,
    SectionMessage,
} from '@forge/ui';
import { format } from "date-fns";
import { DATE_TIME_OPTIONS, DEFAULT_CONFIGURATION, STORAGE_KEY } from './constants';


import { storage } from '@forge/api';

const App = () => {
    const [formState, setFormState] = useState(undefined);
    const [isFormSubmitted, setFormSubmitted] = useState(false);

    useEffect(async () => {
        const storageData = await storage.get(STORAGE_KEY);
        setFormState(storageData || DEFAULT_CONFIGURATION);
    }, []);

    const onSubmit = async (formData) => {
        await storage.set(STORAGE_KEY, formData);
        const storageData = await storage.get(STORAGE_KEY);
        setFormState(storageData);
        setFormSubmitted(true);
    };

    const isDateOptionSelected = (value) => formState && formState.timeConfig && formState.timeConfig === value && { defaultSelected: true };

    const isToggleConfigSelected = (name) => formState && formState[name] && { defaultChecked: true }

    const renderDateTimeOption = (option) => {
        let label;
        const sampleDate = new Date();

        switch (option) {
            case DATE_TIME_OPTIONS.day:
                label = `Day-month-year: ${format(sampleDate, DATE_TIME_OPTIONS.day)}`;
                break;
            case DATE_TIME_OPTIONS.month:
                label = `Month day, year: ${format(sampleDate, DATE_TIME_OPTIONS.month)}`;
                break;
            case DATE_TIME_OPTIONS.year:
                label = `Year, month day: ${format(sampleDate, DATE_TIME_OPTIONS.year)}`;
                break;
            default:
                label = `Year-month-day: ${format(sampleDate, DATE_TIME_OPTIONS.default)}`;
                break;
        }
        return <Option label={label} value={option} {...isDateOptionSelected(option)} />
    }

    const renderDateTimeConfig = () => (
        <Select label="Date time configuration" name="timeConfig">
            {Object.values(DATE_TIME_OPTIONS).map(option => renderDateTimeOption(option))}
        </Select>
    )

    const renderAssigneeConfig = () => (
        <Toggle {...isToggleConfigSelected('isAssigneeVisible')} label="Show/hide Assignee" name="isAssigneeVisible" />
    )

    const renderNotificationButtonConfig = () => (
        <Toggle {...isToggleConfigSelected('isNotifyAssigneeButtonVisible')}  label="Show/hide Assignee notification button" name="isNotifyAssigneeButtonVisible" />
    )

    const renderHistoricalAssigneeConfig = () => (
        <Toggle {...isToggleConfigSelected('isHistoricalAssigneeVisible')}  label="Show/hide Historical assignees" name="isHistoricalAssigneeVisible" />
    )

    return (
        <Fragment>
            {isFormSubmitted && <SectionMessage title="Configuration Saved" appearance="confirmation"/>}
            <Form onSubmit={onSubmit}>
                {renderDateTimeConfig()}
                {renderAssigneeConfig()}
                {renderNotificationButtonConfig()}
                {renderHistoricalAssigneeConfig()}
            </Form>
        </Fragment>
    );
};

export const run = render(
    <AdminPage>
        <App />
    </AdminPage>
);
