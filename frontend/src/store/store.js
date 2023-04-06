import Vuex from 'vuex';
import Vue from "vue";
import * as actionTypes from "./action-types"
import * as mutationTypes from "./mutation-types"
import _ from "lodash";
import {ADD_COMMAND_LINE_TOOL_ELEMENT} from "./mutation-types";

export const DEFAULT_NAMESPACE = 'https://schema.org/';
export const DEFAULT_NS_PREFIX = 's';

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    nsPrefix: DEFAULT_NS_PREFIX,
    cwlFileName: 'application_package_template.cwl',
    cwlObject: {
        cwlVersion: 'v1.0',
        $graph: [
          {
            id: undefined,
            class: 'Workflow',
            label: undefined,
            description: undefined,
            inputs: [],
            outputs: [],
            steps: []
          }
        ],
        schemas: [],
        $namespaces: {
          [DEFAULT_NS_PREFIX]: DEFAULT_NAMESPACE
        },
        [`${DEFAULT_NS_PREFIX}:softwareVersion`]: undefined,
        [`${DEFAULT_NS_PREFIX}:dateCreated`]: (new Date()).toISOString().split('T')[0],
        [`${DEFAULT_NS_PREFIX}:keywords`]: undefined,
        [`${DEFAULT_NS_PREFIX}:contributor`]: [],
        [`${DEFAULT_NS_PREFIX}:codeRepository`]: undefined,
        [`${DEFAULT_NS_PREFIX}:releaseNotes`]: undefined,
        [`${DEFAULT_NS_PREFIX}:license`]: undefined,
        [`${DEFAULT_NS_PREFIX}:author`]: [],
      }
  },
  getters: {
      commandLineTools(state) {
          return state.cwlObject.$graph.filter(p => p.class === 'CommandLineTool');
      },
      workflow(state) {
          return state.cwlObject.$graph.filter(p => p.class === 'Workflow')[0];
      },
      cwlObject(state) {
          return state.cwlObject;
      },
      cwlFileName(state) {
          return state.cwlFileName;
      },
      nsPrefix(state) {
          return state.nsPrefix;
      },
      contributors(state) {
          return state.cwlObject[`${state.nsPrefix}:contributor`];
      },
      authors(state) {
          return state.cwlObject[`${state.nsPrefix}:author`];
      },
      schemas(state) {
          return state.cwlObject.schemas;
      }
  },
  mutations: {
      [mutationTypes.ADD_COMMAND_LINE_TOOL](state) {
          state.cwlObject.$graph.push({
              id: undefined,
              class: 'CommandLineTool',
              baseCommand: [],
              arguments: [],
              label: undefined,
              doc: undefined,
              inputs: [],
              outputs: [],
              requirements: {},
          })
      },
      [mutationTypes.REMOVE_COMMAND_LINE_TOOL](state, clt) {
          const index = _.findIndex(state.cwlObject.$graph, clt)
          state.cwlObject.$graph.splice(index, 1);
      },
      [mutationTypes.SET_CWL_OBJECT](state, cwlObject) {
          Vue.set(state, 'cwlObject', cwlObject);
          Vue.set(state, 'nsPrefix', Object.entries(cwlObject.$namespaces).find(entry => entry[1] === DEFAULT_NAMESPACE)[0])
      },
      [mutationTypes.CHANGE_FILE_NAME](state, filename) {
          state.cwlFileName = filename;
      },
      [mutationTypes.CHANGE_NS_PREFIX](state, nsPrefix) {
          Vue.set(state.cwlObject, `${nsPrefix}:softwareVersion`, state.cwlObject[`${state.nsPrefix}:softwareVersion`]);
          Vue.set(state.cwlObject, `${nsPrefix}:dateCreated`, state.cwlObject[`${state.nsPrefix}:dateCreated`]);
          Vue.set(state.cwlObject, `${nsPrefix}:keywords`, state.cwlObject[`${state.nsPrefix}:keywords`]);
          Vue.set(state.cwlObject, `${nsPrefix}:codeRepository`, state.cwlObject[`${state.nsPrefix}:codeRepository`]);
          Vue.set(state.cwlObject, `${nsPrefix}:releaseNotes`, state.cwlObject[`${state.nsPrefix}:releaseNotes`]);
          Vue.set(state.cwlObject, `${nsPrefix}:license`, state.cwlObject[`${state.nsPrefix}:license`]);
          Vue.set(state.cwlObject, `${nsPrefix}:author`, state.cwlObject[`${state.nsPrefix}:author`].map(
              author => ({
                  [`${nsPrefix}:name`]: author[`${state.nsPrefix}:name`],
                  [`${nsPrefix}:email`]: author[`${state.nsPrefix}:email`],
                  [`${nsPrefix}:affiliation`]: author[`${state.nsPrefix}:affiliation`],
              })
          ));
          Vue.set(state.cwlObject, `${nsPrefix}:contributor`, state.cwlObject[`${state.nsPrefix}:contributor`].map(
              contributor => ({
                  [`${nsPrefix}:name`]: contributor[`${state.nsPrefix}:name`],
                  [`${nsPrefix}:email`]: contributor[`${state.nsPrefix}:email`],
                  [`${nsPrefix}:affiliation`]: contributor[`${state.nsPrefix}:affiliation`],
              })
          ));

          Vue.delete(state.cwlObject, `${state.nsPrefix}:contributor`)
          Vue.delete(state.cwlObject, `${state.nsPrefix}:author`)
          Vue.delete(state.cwlObject, `${state.nsPrefix}:softwareVersion`)
          Vue.delete(state.cwlObject, `${state.nsPrefix}:dateCreated`)
          Vue.delete(state.cwlObject, `${state.nsPrefix}:keywords`)
          Vue.delete(state.cwlObject, `${state.nsPrefix}:codeRepository`)
          Vue.delete(state.cwlObject, `${state.nsPrefix}:releaseNotes`)
          Vue.delete(state.cwlObject, `${state.nsPrefix}:license`)

          state.nsPrefix = nsPrefix;
      },
      [mutationTypes.EDIT_NAMESPACE](state, propertyData) {
          Vue.set(state.cwlObject.$namespaces, propertyData.newName, propertyData.newValue)
          if (propertyData.oldName !== propertyData.newName) Vue.delete(state.cwlObject.$namespaces, propertyData.oldName)
      },
      [mutationTypes.ADD_NAMESPACE](state, namespaceData) {
          if (namespaceData) {
              Vue.set(state.cwlObject.$namespaces, namespaceData.propertyName, namespaceData.value)
          } else {
              Vue.set(state.cwlObject.$namespaces, '', '')
          }
      },
      [mutationTypes.REMOVE_NAMESPACE](state, namespace) {
        Vue.delete(state.cwlObject.$namespaces, namespace)
      },
      [mutationTypes.EDIT_COMMAND_LINE_TOOL](state, {instance, property, index, updatedData}) {
          const cltIndex = _.findIndex(state.cwlObject.$graph, instance)
          Vue.set(state.cwlObject.$graph[cltIndex][property], index, updatedData)
      },
      [mutationTypes.REMOVE_COMMAND_LINE_TOOL_ELEMENT](state, {instance, property, index}) {
        const cltIndex = _.findIndex(state.cwlObject.$graph, instance)
        Vue.delete(state.cwlObject.$graph[cltIndex][property], index)
      },
      [mutationTypes.ADD_COMMAND_LINE_TOOL_ELEMENT](state, {instance, property, data}) {
        const cltIndex = _.findIndex(state.cwlObject.$graph, instance)
        state.cwlObject.$graph[cltIndex][property].push(data)
      },
      [mutationTypes.EDIT_WORKFLOW](state, {instance, property, index, updatedData}) {
          const cltIndex = _.findIndex(state.cwlObject.$graph, instance)
          Vue.set(state.cwlObject.$graph[cltIndex][property], index, updatedData)
      },
      [mutationTypes.REMOVE_WORKFLOW_ELEMENT](state, {instance, property, index}) {
        const cltIndex = _.findIndex(state.cwlObject.$graph, instance)
        Vue.delete(state.cwlObject.$graph[cltIndex][property], index)
      },
      [mutationTypes.ADD_WORKFLOW_ELEMENT](state, {instance, property, data}) {
        const cltIndex = _.findIndex(state.cwlObject.$graph, instance)
        state.cwlObject.$graph[cltIndex][property].push(data)
      },
  },
  actions: {
      [actionTypes.ADD_COMMAND_LINE_TOOL]({commit}) {
          commit(mutationTypes.ADD_COMMAND_LINE_TOOL);
      },
      [actionTypes.REMOVE_COMMAND_LINE_TOOL]({commit}, clt) {
          commit(mutationTypes.REMOVE_COMMAND_LINE_TOOL, clt);
      },
      [actionTypes.SET_CWL_OBJECT]({commit}, cwlObject) {
          commit(mutationTypes.SET_CWL_OBJECT, cwlObject);
      },
      [actionTypes.CHANGE_FILE_NAME]({commit}, filename) {
          commit(mutationTypes.CHANGE_FILE_NAME, filename);
      },
      [actionTypes.CHANGE_NS_PREFIX]({commit}, nsPrefix) {
          commit(mutationTypes.CHANGE_NS_PREFIX, nsPrefix);
      },
      [actionTypes.EDIT_NAMESPACE]({commit, state}, propertyData) {
          if (propertyData.oldName !== propertyData.newName) {
              const keys = Object.keys(state.cwlObject.$namespaces)
              if (keys.includes(propertyData.newName)) {
                  Vue.notify({
                      group: "global",
                      type: 'warn',
                      title: 'Namespace prefix already exist.',
                      duration: 3000,
                  })
                  return;
              }
              commit(mutationTypes.EDIT_NAMESPACE, propertyData)
              if (state.cwlObject.$namespaces[propertyData.newName] === DEFAULT_NAMESPACE) {
                  commit(mutationTypes.CHANGE_NS_PREFIX, propertyData.newName)
              }
          }
          if (propertyData.oldValue !== propertyData.newValue) {
              commit(mutationTypes.EDIT_NAMESPACE, propertyData)
              if (propertyData.oldValue === DEFAULT_NAMESPACE && state.nsPrefix === propertyData.newName) {
                  const others = Object.entries(state.cwlObject.$namespaces).filter(keyValue => keyValue[0] !== propertyData.newName && keyValue[1] === DEFAULT_NAMESPACE)
                  if (others.length > 0) {
                      commit(mutationTypes.CHANGE_NS_PREFIX, others[0][0])
                  } else {
                      commit(mutationTypes.ADD_NAMESPACE, {propertyName: DEFAULT_NS_PREFIX, value: DEFAULT_NAMESPACE})
                      commit(mutationTypes.CHANGE_NS_PREFIX, DEFAULT_NS_PREFIX)
                  }
              }
          }
      },
      [actionTypes.ADD_NAMESPACE]({commit}) {
          commit(mutationTypes.ADD_NAMESPACE)
      },
      [actionTypes.REMOVE_NAMESPACE]({commit, state}, namespace) {
          const value = state.cwlObject.$namespaces[namespace]
          commit(mutationTypes.REMOVE_NAMESPACE, namespace)
          if (value === DEFAULT_NAMESPACE && state.nsPrefix === namespace) {
              const others = Object.entries(state.cwlObject.$namespaces).filter(keyValue => keyValue[1] === DEFAULT_NAMESPACE)
              if (others.length > 0) {
                  commit(mutationTypes.CHANGE_NS_PREFIX, others[0][0])
              } else {
                  commit(mutationTypes.ADD_NAMESPACE, {propertyName: DEFAULT_NS_PREFIX, value: DEFAULT_NAMESPACE})
                  commit(mutationTypes.CHANGE_NS_PREFIX, DEFAULT_NS_PREFIX)
              }
          }
      },
      [actionTypes.EDIT_COMMAND_LINE_TOOL]({commit}, payload) {
          commit(mutationTypes.EDIT_COMMAND_LINE_TOOL, payload)
      },
      [actionTypes.REMOVE_COMMAND_LINE_TOOL_ELEMENT]({commit}, payload) {
          commit(mutationTypes.REMOVE_COMMAND_LINE_TOOL_ELEMENT, payload)
      },
      [actionTypes.ADD_COMMAND_LINE_TOOL_ELEMENT]({commit}, payload) {
          commit(mutationTypes.ADD_COMMAND_LINE_TOOL_ELEMENT, payload)
      },
      [actionTypes.EDIT_WORKFLOW]({commit}, payload) {
          commit(mutationTypes.EDIT_COMMAND_LINE_TOOL, payload)
      },
      [actionTypes.REMOVE_WORKFLOW_ELEMENT]({commit}, payload) {
          commit(mutationTypes.REMOVE_COMMAND_LINE_TOOL_ELEMENT, payload)
      },
      [actionTypes.ADD_WORKFLOW_ELEMENT]({commit}, payload) {
          commit(mutationTypes.ADD_COMMAND_LINE_TOOL_ELEMENT, payload)
      },
  }
})
