import _ from "lodash";
import {DEFAULT_NAMESPACE, DEFAULT_NS_PREFIX} from "./store/store";
import Vue from "vue";

export const showNotification = (title, options = {}) => {
  const {group = 'info', type = 'warn', text = '', duration = 3000} = options;
  Vue.notify({
    title: title,
    text: text,
    group: group,
    type: type,
    duration: duration,
  });
};

export const removeEmpty = (obj) => {
  const keepUnchanged = ['requirements'];
  if (typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => (typeof v === "boolean" && v) || !_.isEmpty(v))
      .map(([k, v]) => {
        if (typeof v === 'object' && !keepUnchanged.includes(k)) {
          if (Array.isArray(v)) return [k, v.map(e => removeEmpty(e))];
          if (Object.entries(v).filter(([, v]) => !_.isEmpty(v)).length > 0) return [k, removeEmpty(v)];
          return undefined;
        } else {
          return [k, v];
        }
      }).filter(keyPair => !_.isEmpty(keyPair))
  );
};

const parseWorkflow = (wfl) => {
  if (typeof wfl.inputs === 'object') wfl.inputs = Object.entries(wfl.inputs).map(([k, v]) => ({id: k, ...v}));
  if (typeof wfl.outputs === 'object') wfl.outputs = Object.entries(wfl.outputs).map(([k, v]) => ({id: k, ...v}));
  if (typeof wfl.steps === 'object') {
    wfl.steps = Object.entries(wfl.steps).map(([k, v]) => ({
      id: k,
      ...v,
      'in': typeof v.in === 'object' ? Object.entries(v.in).map(([k, v]) =>
        ({id: k, ...(typeof v === 'string' ? {source: [v]} : v)})) : v.in,
    }));
  }
  wfl.steps = wfl.steps.map(step => {
    step = parseRequirements(step);
    step = parseRequirements(step, 'hints');
    step.requirements = {...step.hints, ...step.requirements};
    delete step['hints'];
    return step;
  });
  wfl = parseRequirements(wfl);
  wfl = parseRequirements(wfl, 'hints');
  wfl.requirements = {...wfl.hints, ...wfl.requirements};
  delete wfl['hints'];
  return wfl;
};

const parseRequirements = (process, attribute = 'requirements') => {
  if (process[attribute] === undefined) {
    process[attribute] = {};
    return process;
  }
  if (Array.isArray(process[attribute])) {
    process[attribute] = process[attribute].reduce((acc, current) => {
      const classField = current.class;
      if (classField) {
        if (current.class === 'EnvVarRequirement' && Array.isArray(current.envDef)) {
          current.envDef = current.envDef.reduce((acc, envDef) => ({...acc, [envDef.envName]: envDef.envValue}), {});
        }
        delete current['class'];
        return {...acc, [classField]: current};
      } else {
        return acc;
      }
    }, {});
  } else {
    if (Array.isArray(process[attribute]?.EnvVarRequirement?.envDef)) {
      process[attribute].EnvVarRequirement.envDef =
        process[attribute].EnvVarRequirement.envDef.reduce(
          (acc, envDef) => ({...acc, [envDef.envName]: envDef.envValue}), {});
    }
  }
  return process;
};

const parseCommandLineTool = (clt) => {
  if (typeof clt.inputs === 'object') clt.inputs = Object.entries(clt.inputs).map(([k, v]) => ({id: k, ...v}));
  if (typeof clt.outputs === 'object') clt.outputs = Object.entries(clt.outputs).map(([k, v]) => ({id: k, ...v}));
  clt = parseRequirements(clt);
  clt = parseRequirements(clt, 'hints');
  clt.requirements = {...clt.hints, ...clt.requirements};
  delete clt['hints'];
  clt.baseCommand = (typeof clt.baseCommand === 'string' ? [clt.baseCommand] : clt.baseCommand) || [];
  clt['arguments'] = (typeof clt['arguments'] === 'string' ? [clt['arguments']] : clt['arguments']) || [];
  return clt;
};

const parseMetadata = (cwlObject) => {
  let nsPrefix = DEFAULT_NS_PREFIX;
  cwlObject.$namespaces = cwlObject.$namespaces ? cwlObject.$namespaces : {};
  const defaultNs = Object.entries(cwlObject.$namespaces).filter(([, v]) => v === DEFAULT_NAMESPACE);
  if (defaultNs.length) {
    nsPrefix = defaultNs[0][0];
  } else {
    cwlObject.$namespaces[DEFAULT_NS_PREFIX] = DEFAULT_NAMESPACE;
  }
  const namespacedKeys = [
    ['contributor', []], ['author', []], ['dateCreated', (new Date()).toISOString().split('T')[0]],
    ['softwareVersion', undefined], ['keywords', undefined], ['codeRepository', undefined],
    ['releaseNotes', undefined], ['license', undefined], ['logo', undefined]
  ];
  namespacedKeys.forEach(entry => {
    const importedKey = Object.keys(cwlObject).find(q => q.endsWith(entry[0]));
    if (entry[0] !== 'author' && entry[0] !== 'contributor') {
      cwlObject[`${nsPrefix}:${entry[0]}`] = cwlObject[importedKey] ? cwlObject[importedKey] : entry[1];
    } else {
      cwlObject[`${nsPrefix}:${entry[0]}`] = !cwlObject[importedKey]?.length ? entry[1] :
        cwlObject[importedKey].map(el => ({
          [`${nsPrefix}:name`]: el[Object.keys(el).find(q => q.endsWith('name')) || ''],
          [`${nsPrefix}:email`]: el[Object.keys(el).find(q => q.endsWith('email')) || ''],
          [`${nsPrefix}:affiliation`]: el[Object.keys(el).find(q => q.endsWith('affiliation')) || '']
        }));
    }
    if (importedKey !== `${nsPrefix}:${entry[0]}`) delete cwlObject[importedKey];
  });
  return cwlObject;
};

export const parseCwlObject = (cwlObject) => {
  cwlObject.$graph = cwlObject.$graph.map(process => {
    if (process.class === 'Workflow') return parseWorkflow(process);
    if (process.class === 'CommandLineTool') return parseCommandLineTool(process);
    return process;
  });
  return parseMetadata(cwlObject);
};

export const validateCwlConsistency = (cwlObject) => {
  const issues = [];
  if (_.isEmpty(cwlObject.cwlVersion)) issues.push('CWL Version field is required.');
  if (cwlObject.$graph.some(p => !['Workflow', 'CommandLineTool'].includes(p.class))) {
    issues.push(
      'Allowed class inside of the $graph must be either "Workflow" or "CommandLineToll" and class is required.'
    );
  }
  if (cwlObject.$graph.some(p => _.isEmpty(p.id))) {
    issues.push(
      'All Workflows and command line tools inside of the $graph must have an ID set, this field is required.'
    );
  }
  const processesIds = cwlObject.$graph.map(p => p.id).filter(identifier => !_.isEmpty(identifier));
  if (processesIds.length !== _.uniq(processesIds).length) {
    issues.push(
      'All Workflows and command line tools IDs inside of the $graph must be unique.'
    );
  }
  cwlObject.$graph.forEach(p => {
    if (!['Workflow', 'CommandLineTool'].includes(p.class)) return;

    if (p.inputs.some(p => _.isEmpty(p.id)))
      issues.push(
        `All inputs of ${p.class} with id "${p.id}" must have an ID set, this field is required.`
      );
    const pInputsIds = p.inputs.map(p => p.id).filter(identifier => !_.isEmpty(identifier));
    if (pInputsIds.length !== _.uniq(pInputsIds).length)
      issues.push(
        `All inputs ids of ${p.class} with id "${p.id}" must be unique.`
      );

    if (p.outputs.some(p => _.isEmpty(p.id)))
      issues.push(
        `All outputs ${p.class} with id "${p.id}" must have an ID set, this field is required.`
      );
    const pOutputsIds = p.outputs.map(p => p.id).filter(identifier => !_.isEmpty(identifier));
    if (pOutputsIds.length !== _.uniq(pOutputsIds).length)
      issues.push(
        `All outputs ids of ${p.class} with id "${p.id}" must be unique.`
      );

    if (p.class === 'Workflow') {
      if (p.steps.some(p => _.isEmpty(p.id)))
        issues.push(
          `All steps of ${p.class} with id "${p.id}" must have an ID set, this field is required.`
        );
      const pStepsIds = p.steps.map(p => p.id).filter(identifier => !_.isEmpty(identifier));
      if (pStepsIds.length !== _.uniq(pStepsIds).length)
        issues.push(
          `All steps ids of ${p.class} with id "${p.id}" must be unique.`
        );

      p.steps.forEach(step => {
        if (step.in.some(input => _.isEmpty(input.source)))
          issues.push(
            `Some inputs of step "${step.id}" of ${p.class} with id "${p.id}" have no source field.`
          );
        const clt = _.find(cwlObject.$graph, {class: 'CommandLineTool', id: step.run.replace('#', '')});
        step.in.forEach(input => {
          if (input.id && clt && !clt.inputs.map(inp => inp.id).includes(input.id)) issues.push(
            `Input "${input.id}" in inputs of step "${step.id}" of ${p.class} with id "${p.id}" 
            has no match in inputs of CommandLineTool "${clt.id}".`
          );
          input.source.forEach(source => {
            let [pId, outId] = source.split('/');
            const steps = p.steps.filter(step => step.id === pId);
            if ((!outId && p.inputs.filter(input => input.id === pId).length === 0)
              || (outId !== undefined &&
                (steps.length === 0 || steps[0].out.filter(output => output === outId).length === 0)))
              issues.push(
                `Source "${source}" in inputs of step "${step.id}" of ${p.class} with id "${p.id}" is unknown.`
              );
          });
        });
        step.out.forEach(output => {
          if (output && clt && !clt.outputs.map(out => out.id).includes(output)) issues.push(
            `Output "${output}" in outputs of step "${step.id}" of ${p.class} with id "${p.id}" 
            has no match in outputs of CommandLineTool "${clt.id}".`
          );
        });
      });

      if (p.outputs.some(output => _.isEmpty(output.outputSource)))
        issues.push(
          `Some outputs of step of ${p.class} with id "${p.id}" have no output source field.`
        );

      p.outputs.forEach(output => {
        if (_.isEmpty(output.outputSource)) return;
        output.outputSource.forEach(outputSource => {
          let [pId, outId] = outputSource.split('/');
          const steps = p.steps.filter(step => step.id === pId);
          if (steps.length === 0 || steps[0].out.filter(output => output === outId).length === 0)
            issues.push(
              `Output Source "${outputSource}" in outputs of ${p.class} with id "${p.id}" is unknown.`
            );
        });
      });
    }
  });
  return issues;
};
