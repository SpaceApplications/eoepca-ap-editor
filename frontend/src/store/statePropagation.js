import {showNotification} from "../utils";
import {EDIT_WORKFLOW} from "./mutation-types";

export const propagateWorkflowElementEdition = (state, instance, property, index, updatedData) => {
  const elementId = instance[property][index].id;
  const refToUpdate = instance[property][index].out?.map(out => `${elementId}/${out}`);
  state.cwlObject.$graph.map(p => {
    if (p.class === 'Workflow') {
      p.steps.map(step => {
        if (property === 'inputs') {
          step.in = step.in.reduce((acc, current) => {
            if (current.source?.includes(elementId)) {
              if (instance[property][index].type !== updatedData.type) {
                current.source = current.source?.filter(s => s !== elementId);
              } else {
                current.source = current.source?.map(s => s === elementId ? updatedData.id : s);
              }
            }
            return [...acc, current];
          }, []);
        }
        if (property === 'steps') {
          step.in = step.in.reduce((acc, current) => {
            current.source = current.source?.map(s =>
              refToUpdate.includes(s) ? `${updatedData.id}/${s?.split('/')[1]}` : s
            );
            return [...acc, current];
          }, []);
        }
        return step;
      });
      p.outputs.map(output => {
        if (property === 'steps') {
          if (updatedData.run === undefined) {
            output.outputSource = output.outputSource?.filter(s => !refToUpdate.includes(s));
          } else {
            output.outputSource = output.outputSource?.map(s =>
              refToUpdate.includes(s) ? `${updatedData.id}/${s?.split('/')[1]}` : s
            );
          }
        }
        return output;
      });
    }
    return p;
  });
};

export const propagateCltElementEdition = (state, instance, property, index, updatedData) => {
  const workflow = state.cwlObject.$graph.filter(p => p.class === 'Workflow')[0];
  const elementId = instance[property][index].id;
  const elementTypeHasChanged = instance[property][index].type !== updatedData.type;
  const refToUpdate = workflow.steps.filter(s => s.run === `#${instance.id}`).map(s => `${s.id}/${elementId}`);
  state.cwlObject.$graph.map(p => {
    if (p.class === 'Workflow') {
      p.steps.map(step => {
        if (property === 'inputs' && step.run === `#${instance.id}`) {
          step.in = step.in.reduce((acc, current) => {
            if (current.id === elementId) {
              if (elementTypeHasChanged) {
                showNotification(
                  `Step ${step.id} of workflow ${p.id} is now missing an input mapping for ${updatedData.id}.`,
                  {duration: 5000}
                );
                current.source = undefined;
              } else {
                current.id = updatedData.id;
              }
            }
            return [...acc, current];
          }, []);
        }
        if (property === 'outputs') {
          if (step.run === `#${instance.id}`) {
            step.out = step.out.reduce(
              (acc, current) => current === elementId ? [...acc, updatedData.id] : [...acc, current], []
            );
          }
          step.in = step.in.reduce((acc, current) => {
            if (elementTypeHasChanged) {
              if (current.source?.some(e => refToUpdate.includes(e))) {
                showNotification(
                  `Step ${step.id} of workflow ${p.id} is now missing an input mapping for ${updatedData.id}.`,
                  {duration: 5000}
                );
              }
              return [...acc, {...current, source: current.source?.filter(s => !refToUpdate.includes(s))}];
            } else {
              current.source = current.source?.map(
                s => !refToUpdate.includes(s) ? s : `${s?.split('/')[0]}/${updatedData.id}`
              );
              return [...acc, current];
            }
          }, []);
        }
        return step;
      });
      p.outputs.map(output => {
        if (property === 'outputs') {
          if (elementTypeHasChanged) {
            output.outputSource = output.outputSource?.filter(s => !refToUpdate.includes(s));
          } else {
            output.outputSource = output.outputSource?.map(
              s => !refToUpdate.includes(s) ? s : `${s?.split('/')[0]}/${updatedData.id}`
            );
          }
        }
        return output;
      });
    }
    return p;
  });
  showNotification('Command Line Tool Element Updated', {
    text: 'Please check that your workflow is still consistent.'
  });
};

export const propagateWorkflowElementRemoval = (state, instance, property, index) => {
  const elementId = instance[property][index].id;
  const refToRemove = instance[property][index].out?.map(out => `${elementId}/${out}`);
  state.cwlObject.$graph.map(p => {
    if (p.class === 'Workflow') {
      p.steps.map(step => {
        if (property === 'inputs') {
          step.in = step.in.map(input => ({...input, source: input.source?.filter(s => s !== elementId)}));
        }
        if (property === 'steps') {
          step.in = step.in.map(input => ({...input, source: input.source?.filter(s => !refToRemove.includes(s))}));
        }
        return step;
      });
      p.outputs.map(output => {
        if (property === 'steps') {
          output.outputSource = output.outputSource?.filter(s => !refToRemove.includes(s));
        }
        return output;
      });
    }
    return p;
  });
};

export const propagateCltElementRemoval = (state, instance, property, index) => {
  const workflow = state.cwlObject.$graph.filter(p => p.class === 'Workflow')[0];
  const refToRemove = workflow.steps.filter(s => s.run === `#${instance.id}`).map(
    s => `${s.id}/${instance[property][index].id}`
  );
  state.cwlObject.$graph.map(p => {
    if (p.class === 'Workflow') {
      p.steps.map(step => {
        if (property === 'inputs' && step.run === `#${instance.id}`) {
          step.in = step.in.filter(current => current.id !== instance[property][index].id);
        }
        if (property === 'outputs') {
          if (step.run === `#${instance.id}`) {
            step.out = step.out.filter(current => current !== instance[property][index].id);
          }
          step.in = step.in.reduce((acc, current) => {
            current.source = current.source?.filter(s => !refToRemove.includes(s));
            if (!current.source.length) showNotification(`Input ${current.id} of Step ${step.id} has no mapping`);
            return [...acc, current];
          }, []);
        }
        return step;
      });
      p.outputs.map(output => {
        if (property === 'outputs') output.outputSource = output.outputSource?.filter(s => !refToRemove.includes(s));
        return output;
      });
    }
    return p;
  });
  showNotification('Command Line Tool Element Removed', {
    text: 'Please check that your workflow is still consistent.'
  });
};

export const propagateCltAddition = (state, instance, property, data) => {
  state.cwlObject.$graph.map(p => {
    if (p.class === 'Workflow') {
      p.steps.map(step => {
        if (property === 'inputs' && step.run === `#${instance.id}`) step.in.push({id: data.id, source: undefined});
        if (property === 'outputs' && step.run === `#${instance.id}`) step.out.push(data.id);
        return step;
      });
    }
    return p;
  });
  showNotification('Command Line Tool Element Added', {
    text: 'Please check that your workflow is still consistent.'
  });
};

export const propagateCltRemoval = (state, clt, commit) => {
  const workflow = state.cwlObject.$graph.filter(p => p.class === 'Workflow')[0];
  workflow.steps.forEach((step, index) => {
    if (step.run === `#${clt.id}`) commit(EDIT_WORKFLOW, {
      instance: workflow, property: 'steps', index, updatedData: {...step, run: undefined, in: [], out: []}
    });
  });
  showNotification('Command Line Tool Removed', {
    text: 'Please check that your workflow is still consistent.'
  });
};
