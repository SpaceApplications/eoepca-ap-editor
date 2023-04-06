import _ from "lodash";
import {DEFAULT_NAMESPACE, DEFAULT_NS_PREFIX} from "./store/store";
import * as yup from "yup";

export function removeEmpty(obj) {
    const keepUnchanged = ['requirements']
    if (typeof obj !== 'object') return obj;
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([k, v]) => (typeof v === "boolean" && v) || !_.isEmpty(v))
            .map(([k, v]) => {
                if (typeof v === 'object' && !keepUnchanged.includes(k)) {
                    if (Array.isArray(v)) return [k, v.map(e => removeEmpty(e))]
                    if (Object.entries(v).filter(([k, v]) => !_.isEmpty(v)).length > 0) return [k, removeEmpty(v)]
                    return undefined;
                } else {
                    return [k, v]
                }
            }).filter(keyPair => !_.isEmpty(keyPair))
    );
};

function parseWorkflow(wfl) {
    if (typeof wfl.inputs === 'object') wfl.inputs = Object.entries(wfl.inputs).map(([k, v]) => ({id: k, ...v}));
    if (typeof wfl.outputs === 'object') wfl.outputs = Object.entries(wfl.outputs).map(([k, v]) => ({id: k, ...v}));
    if (typeof wfl.steps === 'object') {
        wfl.steps = Object.entries(wfl.steps).map(([k, v]) => ({
            id: k,
            ...v,
            requirements: Array.isArray(v.requirements) ? v.requirements.reduce((acc, current) => {
                const classField = current.class;
                if (classField) {
                    delete current['class'];
                    return {...acc, [classField]: current};
                } else {
                    return acc;
                }
            }, {}) : v.requirements || {},
            'in': typeof v.in === 'object' ? Object.entries(v.in).map(([k, v]) =>
                ({id: k, ...(typeof v === 'string' ? {source: v} : v)})) : v.in,
        }));
    };
    return wfl;
}

function parseCommandLineTool(clt) {
    if (typeof clt.inputs === 'object') clt.inputs = Object.entries(clt.inputs).map(([k, v]) => ({id: k, ...v}));
    if (typeof clt.outputs === 'object') clt.outputs = Object.entries(clt.outputs).map(([k, v]) => ({id: k, ...v}));
    clt.requirements = Array.isArray(clt.requirements) ? clt.requirements.reduce((acc, current) => {
        const classField = current.class;
        if (classField) {
            delete current['class'];
            return {...acc, [classField]: current};
        } else {
            return acc;
        }
    }, {}) : clt.requirements || {};
    clt.baseCommand = typeof clt.baseCommand === 'string' ? [clt.baseCommand] : clt.baseCommand;
    return clt;
}

function parseMetadata(cwlObject) {
    let nsPrefix = DEFAULT_NS_PREFIX;
    cwlObject.$namespaces = cwlObject.$namespaces ? cwlObject.$namespaces : {};
    const defaultNs = Object.entries(cwlObject.$namespaces).filter(([k, v]) => v === DEFAULT_NAMESPACE)
    if (defaultNs.length) {
        nsPrefix = defaultNs[0][0]
    } else {
        cwlObject.$namespaces[DEFAULT_NS_PREFIX] = DEFAULT_NAMESPACE
    }
    const namespacedKeys = [
        ['contributor', []], ['author', []], ['dateCreated', (new Date()).toISOString().split('T')[0]],
        ['softwareVersion', undefined], ['keywords', undefined], ['codeRepository', undefined],
        ['releaseNotes', undefined], ['license', undefined]
    ]
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
    })
    return cwlObject;
}

export function parseCwlObject(cwlObject) {
    cwlObject.$graph = cwlObject.$graph.map(process => {
        if (process.class === 'Workflow') return parseWorkflow(process);
        if (process.class === 'CommandLineTool') return parseCommandLineTool(process);
        return process;
    })
    return parseMetadata(cwlObject)
}
