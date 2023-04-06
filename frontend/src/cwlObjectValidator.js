import * as yup from 'yup';


yup.addMethod(yup.array, 'oneOfSchemas', function oneOfSchemas(schemas, message = null) {
    return this.test('one-of-schemas-exact',
        message || 'Not all items in "${path}" match one of the allowed schemas',
        (items) =>
            items?.length ? items.every(item => schemas.some(schema => schema.isValidSync(item, {strict: true}))) : true
    );
});

export const cwlTypes = ['null', 'boolean', 'int', 'long', 'float', 'double', 'string', 'File', 'Directory'];
export const scatterMethods = ['dotproduct', 'nested_crossproduct', 'flat_crossproduct'];

const stringOrArrayString = yup.lazy((value) => {
    switch (typeof value) {
        case 'string':
            return yup.string();
        case 'array':
            return yup.array().of(yup.string());
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
            }).noUnknown(true).strict()).required()
        }
        if (value instanceof Object) {
            if (Object.keys(value).every(key => !definedFields.includes(key))) {
                return yup.object().shape(
                    Object.keys(value).reduce((acc, key) => ({
                        ...acc,
                        [key]: value[key] instanceof Object ? yup.object().shape(objectFields) : yup.string().oneOf(cwlTypes)
                    }), {})
                ).required();
            }
        }
    });
};

const dockerRequirement = {
    dockerPull: yup.string(),
    dockerLoad: yup.string(),
    dockerFile: yup.string(),
    dockerImport: yup.string(),
    dockerImageId: yup.string(),
    dockerOutputDirectory: yup.string()
};

const workflowInputFields = {
    label: yup.string(),
    doc: yup.string(),
    default: yup.mixed(),
    type: yup.string().oneOf(cwlTypes)
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
    type: yup.string().oneOf(cwlTypes)
};

const commandLineToolInputFields = {
    label: yup.string(),
    secondaryFiles: yup.string(),
    streamable: yup.boolean(),
    doc: yup.string(),
    inputBinding: yup.object().shape({
        loadContents: yup.boolean(),
        position: yup.number(),
        prefix: yup.string(),
        separate: yup.boolean(),
        itemSeparator: yup.string(),
        valueFrom: yup.string(),
        shellQuote: yup.boolean()
    }),
    default: yup.mixed(),
    type: yup.string().oneOf(cwlTypes)
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
    type: yup.string().oneOf(cwlTypes)
};

const WorkflowStepFields = {
    in: yup.mixed().required(),
    out: yup.array().of(yup.string()).required(),
    run: yup.string().required(),
    requirements: dynamicObjectValidator(dockerRequirement, true, 'class'),
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
});

const cwlCommandLineTool = yup.object().shape({
    id: yup.string(),
    class: yup.string().trim().matches('CommandLineTool').required(),
    inputs: dynamicObjectValidator(commandLineToolInputFields),
    outputs: dynamicObjectValidator(commandLineToolOutputFields),
    doc: yup.string(),
    label: yup.string(),
    requirements: dynamicObjectValidator(dockerRequirement, true, 'class'),
    baseCommand: stringOrArrayString,
    arguments: yup.array().of(yup.string()),
    stdin: yup.string(),
    stderr: yup.string(),
});

export const cwlValidator = yup.object().shape({
    cwlVersion: yup.string(),
    $graph: yup.array().oneOfSchemas([cwlWorkflow, cwlCommandLineTool]).required(),
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
    's:logo': yup.string(),
    's:releaseNotes': yup.string(),
    's:softwareVersion': yup.string(),
    's:dateCreated': yup.string(),
    's:keywords': yup.string(),
    schemas: yup.array().of(yup.string())
});

// const inputYML = 'sentinelhub-custom-scripts.cwl';
// const outputJSON = 'output.json';
// // const test = {
// //     $graph: [{id: 'test', class: 'test'}]
// // }
// // console.log(yaml.dump(test))
// const obj = yaml.load(fs.readFileSync(inputYML));
// console.log(yaml.dump(obj))
//
// // this code if you want to save file locally
// // fs.writeFileSync(outputJSON, JSON.stringify(obj, null, 2));
//
// const testCwlObject = {
//     $graph: [{id: 'test', class: 'Workflow', inputs: [{test: {}}], outputs: [], steps: []}]
// };
//
// cwlValidator.validate(obj, {strict: true}).then(function (value) {
//     console.log('valid', value);
// }).catch(function (err) {
//     console.log(err);
// });
