import {waitForElm} from "./utils";
import {REMOVE_COMMAND_LINE_TOOL, SET_MODE} from "./store/action-types";

let userMode = 'simple';

export const guidedTours = {
  applicationPackageMetadata: (apEditor) => {
    return [
      {
        target: '#meta-tab-title',
        content: 'Use this tab to fill metadata about the application package file.',
      },
      {
        target: '#ap-meta-information',
        content: 'Define here the information about the application package such as the creation date, the ' +
          'software version, the URL of the code repository or license, etc.',
      },
      {
        target: '#ap-meta-authors',
        content: 'Define here the main author of the Application Package by providing its name, email and affiliation.',
      },
      {
        target: '#ap-meta-contributors',
        content: 'Define here the contributors of the Application Package by providing their name, email and ' +
          'affiliation.',
      },
      {
        target: '#ap-meta-schemas',
        content: 'Define here the URLs of the structure data schemas used in this Application Package.',
      },
      {
        target: '#ap-meta-namespaces',
        content: 'Define here the namespaces used in this Application Package. Note that the default namespace ' +
          '"https://schema.org/" cannot be removed as it is used for other fields such as authors and contributors',
      },
    ];
  },
  newProcessingTaskTour: (apEditor) => {
    return [
      {
        target: '#clt-tab-title',
        content: 'Use this tab to configure processing tasks.',
        before: type => {
          type === 'previous' ? apEditor.currentTab = 0 : null;
        }
      },
      {
        target: '#clt-add-btn',
        content: 'Click here to define a new task.',
        before: async type => {
          if (type === 'previous') await apEditor.$store.dispatch(
            REMOVE_COMMAND_LINE_TOOL, apEditor.commandLineTools[apEditor.commandLineTools.length - 1]
          );
          apEditor.currentTab = 1;
          await waitForElm('#clt-add-btn');
        }
      },
      {
        target: `#clt-id-${apEditor.idxLastClt}`,
        content: 'Each command line tool must be given a unique identifier.',
        before: async type => {
          if (type === 'next') apEditor.$refs.addCltButton.click();
          await waitForElm(`#clt-id-${apEditor.idxLastClt}`);
        }
      },
      {
        target: `#clt-exec-${apEditor.idxLastClt}`,
        content: 'Enter here the name of the executable file.',
      },
      {
        target: `#clt-args-${apEditor.idxLastClt}`,
        content: 'Specify here the static arguments, one element per field. Dynamic arguments are constructed ' +
          'using the task inputs.',
      },
      {
        target: `#clt-input-modal-btn-${apEditor.idxLastClt}`,
        content: 'Click here to define a new task input.',
        before: type => type === 'previous' ?
          document.getElementById('clt-input-modal-cancel-btn')?.click() : null
      },
      {
        target: '#clt-input-form',
        content: 'Give the inputs a name, a type, and indicate in Input Binding how they are appended to the ' +
          'command line.',
        before: async () => {
          document.getElementById(`clt-input-modal-btn-${apEditor.idxLastClt}`)?.click();
          await waitForElm('#clt-input-form');
        }
      },
      {
        target: `#clt-outputs-${apEditor.idxLastClt}`,
        content: 'Configure the task outputs.',
        before: () => document.getElementById('clt-input-modal-cancel-btn')?.click()
      },
      {
        target: `#clt-requirements-${apEditor.idxLastClt}`,
        content: 'Indicate in a DockerRequirement the location of the Docker image that contains the task files.',
        before: type => {
          type === 'previous' ? apEditor.currentTab = 1 : null;
        }
      },
      {
        target: '#wfl-steps',
        content: 'Once a command line tool is created it may be integrated as a step in a workflow.',
        before: async () => {
          apEditor.currentTab = 2;
          await waitForElm('#wfl-steps');
        }
      },
    ];
  },
  processingTaskWorkflowIntegration: (apEditor) => {
    return [
      {
        target: '#wfl-tab-title',
        content: 'When a command line tool is ready, use this tab to integrate it in the current Workflow.',
        before: () => {
          apEditor.currentTab = 1;
          document.getElementById('clt-output-modal-cancel-btn')?.click();
        }
      },
      {
        target: '#wfl-inputs',
        content: 'The inputs of a workflow can be defined here which then can be reused in the mapping of the ' +
          'command line tool inputs defined in its steps.',
        before: async type => {
          if (type === 'next') {
            apEditor.currentTab = 2;
            await waitForElm('#wfl-add-step-btn');
          }
          if (type === 'previous') {
            document.getElementById('wfl-step-modal-cancel-btn')?.click();
          }
        }
      },
      {
        target: '#wfl-outputs',
        content: 'The outputs of a workflow can be defined here, each output of the workflow must have a mapped ' +
          'source which is the output of one its steps.',
      },
      {
        target: '#wfl-add-step-btn',
        content: 'Integrating a command line tool to a workflow consist of adding it as a step of that workflow with' +
          ' a mapping for its inputs and outputs.',
        before: async type => {
          if (type === 'previous') {
            document.getElementById('wfl-step-modal-cancel-btn')?.click();
          }
        }
      },
      {
        target: '#wfl-step-form',
        content: 'For a step to be valid, the command line tool to be run as well as the mapping for all of its ' +
          'inputs must be set. An input of a command line tool can be mapped to an input of the workflow or the ' +
          'output of another step of the workflow.',
        before: async type => {
          if (type === 'next') {
            document.getElementById('wfl-add-step-btn')?.click();
            await waitForElm('#wfl-step-form');
          }
        }
      }
    ];
  }
};

export const guidedToursCallbacks = {
  applicationPackageMetadata: (apEditor) => ({
    onStart: () => {
      userMode = apEditor.$store.state.mode;
      apEditor.$store.dispatch(SET_MODE, 'advanced');
      apEditor.currentTab = 0;
    },
    onStop: () => {
      apEditor.$store.dispatch(SET_MODE, userMode);
      apEditor.guidedTourRunning = false;
    }
  }),
  newProcessingTaskTour: (apEditor) => ({
    onStart: () => {
      userMode = apEditor.$store.state.mode;
      apEditor.$store.dispatch(SET_MODE, 'advanced');
    },
    onStop: () => {
      apEditor.$store.dispatch(SET_MODE, userMode);
      apEditor.guidedTourRunning = false;
      if (apEditor.$refs.cltTour.currentStep >= 2) {
        apEditor.$store.dispatch(
          REMOVE_COMMAND_LINE_TOOL, apEditor.commandLineTools[apEditor.commandLineTools.length - 1]
        );
      }
    },
  }),
  processingTaskWorkflowIntegration: (apEditor) => ({
    onStart: () => {
      userMode = apEditor.$store.state.mode;
      apEditor.$store.dispatch(SET_MODE, 'advanced');
      apEditor.currentTab = 1;
    },
    onStop: () => {
      apEditor.$store.dispatch(SET_MODE, userMode);
      apEditor.guidedTourRunning = false;
      document.getElementById('wfl-step-modal-cancel-btn')?.click();
      if (apEditor.$refs.cltTour.currentStep >= 1) {
        apEditor.$store.dispatch(
          REMOVE_COMMAND_LINE_TOOL, apEditor.commandLineTools[apEditor.commandLineTools.length - 1]
        );
      }
    },
  })
};
