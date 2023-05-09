import {waitForElm} from "./utils";
import {REMOVE_COMMAND_LINE_TOOL} from "./store/action-types";

export const guidedTours = {
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
        content: 'Each processing task must be given a unique identifier.',
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
        target: '#wfl-steps-card',
        content: 'Once a processing task is created it may be integrated as a step in a workflow.',
        before: async () => {
          apEditor.currentTab = 2;
          await waitForElm('#wfl-steps-card');
        }
      },
    ];
  }
};

export const guidedToursCallbacks = {
  newProcessingTaskTour: (apEditor) => ({
    onStop: () => {
      apEditor.guidedTourRunning = false;
      if (apEditor.$refs.cltTour.currentStep >= 2) {
        apEditor.$store.dispatch(
          REMOVE_COMMAND_LINE_TOOL, apEditor.commandLineTools[apEditor.commandLineTools.length - 1]
        );
      }
    },
  })
};
