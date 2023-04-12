import * as yup from 'yup';

yup.addMethod(yup.array, 'oneOfSchemas', function oneOfSchemas(schemas, message = null) {
  return this.test('one-of-schemas-exact',
    message || 'Not all items in "${path}" match one of the allowed schemas',
    (items) =>
      items?.length ? items.every(item => schemas.some(schema => schema.isValidSync(item, {strict: true}))) : true
  );
});

const basicType = ['null', 'boolean', 'int', 'long', 'float', 'double', 'string', 'File', 'Directory'];
export const cwlTypes = [
  ...basicType,
  ...basicType.map(type => `${type}[]`)
];
const withOptionalCwlTypes = [
  ...cwlTypes,
  ...cwlTypes.map(type => `${type}?`)
];
export const scatterMethods = ['dotproduct', 'nested_crossproduct', 'flat_crossproduct'];

const stringOrArrayString = yup.lazy((value) => {
  switch (typeof value) {
    case 'string':
      return yup.string();
    default:
      return yup.array().of(yup.string());
  }
});

const dynamicObjectValidator = (objectFields, idRequired = true, field = 'id') => {
  return yup.lazy((value) => {
    const definedFields = [...Object.keys(objectFields), field];
    if (value === undefined) {
      return yup.mixed();
    }
    if (value instanceof Array) {
      return yup.array().of(yup.object().shape({
        ...(idRequired && {[field]: yup.string().required()}),
        ...objectFields
      }).noUnknown(true).strict()).required();
    }
    if (value instanceof Object) {
      if (Object.keys(value).every(key => !definedFields.includes(key))) {
        return yup.object().shape(
          Object.keys(value).reduce((acc, key) => ({
            ...acc,
            [key]: value[key] instanceof Object ?
              yup.object().shape(objectFields) : yup.string().oneOf(withOptionalCwlTypes)
          }), {})
        ).required();
      }
    }
    return yup.mixed();
  });
};

const envVarRequirement = {
  envDef: dynamicObjectValidator({envValue: yup.string()}, true, 'envName'),
};

const dockerRequirement = {
  dockerPull: yup.string(),
  dockerLoad: yup.string(),
  dockerFile: yup.string(),
  dockerImport: yup.string(),
  dockerImageId: yup.string(),
  dockerOutputDirectory: yup.string()
};

const resourceRequirement = {
  coresMin: yup.number(),
  coresMax: yup.number(),
  ramMin: yup.number(),
  ramMax: yup.number(),
};

const subworkflowFeatureRequirement = yup.object().shape({
  class: yup.string().trim().matches('SubworkflowFeatureRequirement').required(),
});

const multipleInputFeatureRequirement = yup.object().shape({
  class: yup.string().trim().matches('MultipleInputFeatureRequirement').required(),
});

const scatterFeatureRequirement = yup.object().shape({
  class: yup.string().trim().matches('ScatterFeatureRequirement').required(),
});

const inlineJavascriptRequirement = yup.object().shape({
  class: yup.string().trim().matches('InlineJavascriptRequirement').required(),
});

const cltRequirementsValidator = yup.array().oneOfSchemas([
  dynamicObjectValidator(envVarRequirement, true, 'class'),
  dynamicObjectValidator(dockerRequirement, true, 'class'),
  dynamicObjectValidator(resourceRequirement, true, 'class'),
  inlineJavascriptRequirement,
]);

const wflRequirementsValidator = yup.array().oneOfSchemas([
  dynamicObjectValidator(envVarRequirement, true, 'class'),
  dynamicObjectValidator(dockerRequirement, true, 'class'),
  dynamicObjectValidator(resourceRequirement, true, 'class'),
  inlineJavascriptRequirement,
  subworkflowFeatureRequirement,
  multipleInputFeatureRequirement,
  scatterFeatureRequirement
]);

const workflowInputFields = {
  label: yup.string(),
  doc: yup.string(),
  default: yup.mixed(),
  type: yup.string().oneOf(withOptionalCwlTypes)
};

const workflowOutputFields = {
  label: yup.string(),
  doc: yup.string(),
  outputBinding: yup.object().shape({
    glob: yup.string(),
    loadContents: yup.boolean(),
    outputEval: yup.string()
  }),
  outputSource: stringOrArrayString,
  type: yup.string().oneOf(withOptionalCwlTypes)
};

const commandLineBindings = yup.object().shape({
  loadContents: yup.boolean(),
  position: yup.number(),
  prefix: yup.string(),
  separate: yup.boolean(),
  itemSeparator: yup.string(),
  valueFrom: yup.string(),
  shellQuote: yup.boolean()
});

const commandLineToolInputFields = {
  label: yup.string(),
  secondaryFiles: yup.string(),
  streamable: yup.boolean(),
  doc: yup.string(),
  inputBinding: commandLineBindings,
  default: yup.mixed(),
  type: yup.string().oneOf(withOptionalCwlTypes)
};

const commandLineToolOutputFields = {
  label: yup.string(),
  secondaryFiles: yup.string(),
  streamable: yup.boolean(),
  doc: yup.string(),
  outputBinding: yup.object().shape({
    glob: yup.string(),
    loadContents: yup.boolean(),
    outputEval: yup.string()
  }),
  format: yup.string(),
  type: yup.string().oneOf(withOptionalCwlTypes)
};

const WorkflowStepFields = {
  in: yup.mixed().required(),
  out: yup.array().of(yup.string()).required(),
  run: yup.string().required(),
  requirements: wflRequirementsValidator,
  label: yup.string(),
  doc: yup.string(),
  scatter: stringOrArrayString,
  scatterMethod: yup.string().oneOf(scatterMethods)
};

const cwlWorkflow = yup.object().shape({
  id: yup.string().required(),
  class: yup.string().trim().matches('Workflow').required(),
  doc: yup.string(),
  label: yup.string(),
  inputs: dynamicObjectValidator(workflowInputFields),
  outputs: dynamicObjectValidator(workflowOutputFields),
  steps: dynamicObjectValidator(WorkflowStepFields),
  requirements: wflRequirementsValidator,
});

const cwlCommandLineTool = yup.object().shape({
  id: yup.string().required(),
  class: yup.string().trim().matches('CommandLineTool').required(),
  inputs: dynamicObjectValidator(commandLineToolInputFields),
  outputs: dynamicObjectValidator(commandLineToolOutputFields),
  doc: yup.string(),
  label: yup.string(),
  requirements: cltRequirementsValidator,
  baseCommand: stringOrArrayString,
  arguments: yup.array().oneOfSchemas([yup.string(), commandLineBindings]),
});

yup.addMethod(yup.array, 'workflowOrClt', function workflowOrClt() {
  return this.test('workflow-or-command-line-tool',
    function (items) {
      if (items.length === 0) return this.createError({
        message: `${this.path} must contain at least one Workflow process.`
      });
      if (items.filter(item => item.class === 'Workflow').length > 1) return this.createError({
        message: 'Multi-Workflow application package are not supported yet by this editor. ' +
          'This might lead to some unknown behavior, use at your own risk!'
      });
      for (const item of items) {
        if (!['Workflow', 'CommandLineTool'].includes(item.class)) {
          return this.createError({
            message: `${JSON.stringify(item, null, 1)} of element ${this.path} has an undefined or non allowed class.`
          });
        }
        if (item.class === 'Workflow')
          return cwlWorkflow.validate(item, {strict: true}).catch(
            err => this.createError({message: `${this.path}: ${err.message}.`})
          );
        if (item.class === 'CommandLineTool')
          return cwlCommandLineTool.validate(item, {strict: true}).catch(
            err => this.createError({message: `${this.path}: ${err.message}.`})
          );
      }
    }
  );
});

export const cwlValidator = yup.object().shape({
  cwlVersion: yup.string(),
  $graph: yup.array().workflowOrClt().required(),
  $namespaces: yup.object().shape({
    s: yup.string()
  }),
  's:contributor': yup.array().of(
    yup.object().shape({
      's:affiliation': yup.string(),
      's:email': yup.string(),
      's:name': yup.string()
    })
  ),
  's:author': yup.array().of(
    yup.object().shape({
      's:affiliation': yup.string(),
      's:email': yup.string(),
      's:name': yup.string()
    })
  ),
  's:logo': yup.string(),
  's:releaseNotes': yup.string(),
  's:softwareVersion': yup.string(),
  's:license': yup.string(),
  's:codeRepository': yup.string(),
  's:dateCreated': yup.string(),
  's:keywords': yup.string(),
  schemas: yup.array().of(yup.string())
});
