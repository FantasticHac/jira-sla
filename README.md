# Issue Health

[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

## Description

As a TL/PM/Scrum Master, I want to be able to quickly identify the risk of given task based on different stats 
(eg. how many days the issue was not updated, how many sprints had the task been in) so that I can escalate or refine the risky tasks.

## Screen shots 

**Forge Glance**

![Forge Glance](docs/images/forge-glance.png)

**Forge Glance panel**

![Forge Glance panel](docs/images/forge-glance-panel.png)

## Installation

If this is your first time using Forge, the [getting started](https://developer.atlassian.com/platform/forge/set-up-forge/) guide will help you install the prerequisites.

If you already have a Forge environment setup you can deploy this example straight away. Visit our [example apps](https://developer.atlassian.com/platform/forge/example-apps/) page for installation steps.


## Usage

Issue Health is using Jira Software sprint custom field. To have full functionality working it need to be available.

**To check if Jira Software sprint custom field is enabled:**
* go to Jira Settings
* select Issues
* select Custom fields
* check if **Sprint** *(Jira Software sprint field)* is enabled

## Documentation

The app's [manifest.yml](./manifest.yml) contains two modules:

 1. A [jira:issueGlance module](https://developer.atlassian.com/platform/forge/manifest-reference/#jira-issue-glance) that
 specifies the metadata displayed to the user by Glance in the Jira Issue View. Information displayed on Glance are defined
 by: 
 *  title: displayed above glance button,
 *  label: displayed on glance button,
 *  status: lozenge displaying ">>" 
  
 2. A corresponding [function module](https://developer.atlassian.com/platform/forge/manifest-reference/#function)
 that implements the issueGlance logic.
 
 The function logic is implemented in two files:
 * main logic: [src/index.jsx](./src/index.jsx),
 * helpers functions: [src/helpers.js](./src/helpers.js),
 
 The app's UI is implemented using these features:
 
 - [`Text`](https://developer.atlassian.com/platform/forge/ui-components/text) component.
 - [`Button`](https://developer.atlassian.com/platform/forge/ui-components/button) component.
 - [`useState`](https://developer.atlassian.com/platform/forge/ui-hooks-reference/#usestate),
 - [`useProductContext`](https://developer.atlassian.com/platform/forge/ui-hooks-reference/#useproductcontext),

## Contributions

Contributions to Issue Health are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details. 

## License

Copyright (c) 2020 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.