<template>
  <b-container fluid class="my-2 px-4">
    <page-title
      title="Application Package Editor"
      subtitle="Interactive Earth Observation Application Package Editor"
    >
      <template v-slot:toolbar>
        <b-btn-toolbar class="float-right">
          <div class="m-1 pr-3 pl-3">
            <h6 align="center">Helper</h6>
            <b-btn variant="primary" @click="validateCwl()">
              <fa-icon class="mr-2" icon="sync-alt"></fa-icon>
              <span>Validate</span>
            </b-btn>
          </div>
          <div class="m-1 pr-3 pl-3">
            <h6 align="center">Workspace</h6>
            <b-btn variant="primary" @click="() => {console.log('Open from workspace action')}" class="mr-2" disabled>
              <fa-icon class="mr-2" icon="folder-open"></fa-icon>
              <span>Open</span>
            </b-btn>
            <b-btn variant="success" @click="() => {console.log('Save in workspace action')}" disabled>
              <fa-icon class="mr-2" icon="save"></fa-icon>
              <span>Save</span>
            </b-btn>
          </div>
          <div class="m-1 pr-3 pl-3">
            <h6 align="center">Transfer</h6>
            <input ref="file" type="file" accept=".cwl" @change="onFileUpload" hidden/>
            <b-btn variant="primary" @click="uploadFile()" class="mr-2">
              <fa-icon class="mr-2" icon="upload"></fa-icon>
              <span>Upload</span>
            </b-btn>
            <b-btn variant="success" @click="downloadWrapper()">
              <fa-icon class="mr-2" icon="download"></fa-icon>
              <span>Download</span>
            </b-btn>
          </div>
        </b-btn-toolbar>
      </template>
    </page-title>
    <b-row>
      <b-col lg="12" xl="7">
        <b-tabs content-class="mt-2" fill>
          <b-tab title="Metadata" active>
            <b-card header="Metadata" class="editor-card">
              <metadata-editor/>
            </b-card>
          </b-tab>
          <b-tab title="Command Line Tool">
            <b-row class="m-2">
              <b-col align="center">
                <b-btn class="add-btn" variant="primary" @click="pushNewClt" size="sm">
                  <fa-icon icon="plus"></fa-icon>
                  <span class="ml-2">Add Command Line Tool</span>
                </b-btn>
              </b-col>
            </b-row>
            <div class="clt-list accordion">
              <b-card v-for="(clt, index) in commandLineTools" :key="clt._key" class="mr-1">
                <template v-slot:header>
                  <div v-b-toggle="`clt-accordion-${index}`" style="height: 44px; padding: 10px">
                    {{ clt.id ? `Command Line Tool: ${clt.id}` : 'Command Line Tool' }}
                    <b-btn class="float-right" variant="danger" size="sm" @click.stop="removeClt(clt)">
                      <fa-icon icon="times"/>
                    </b-btn>
                  </div>
                </template>
                <b-collapse :id="`clt-accordion-${index}`" accordion="clts-accordion" visible>
                  <command-line-tool-editor :command-line-tool-prop="clt" :pos="index"/>
                </b-collapse>
              </b-card>
            </div>
          </b-tab>
          <b-tab title="Workflow">
            <b-card :header="workflow.id ? `Workflow: ${workflow.id}` : 'Workflow'" class="editor-card">
              <workflow-editor/>
            </b-card>
          </b-tab>
        </b-tabs>
      </b-col>
      <b-col lg="12" xl="5">
        <b-card class="cwl-template">
          <template v-slot:header>
            <b-row>
              <b-col sm="1.0" style="display: flex; align-items: center">File Name:</b-col>
              <b-col sm="6">
                <b-form-input :value="cwlFileName" type="text" @input="handleFileNameChange" @keydown.space.prevent/>
              </b-col>
            </b-row>
          </template>
          <ApplicationPackageCwlTemplate :cwlObject="cleanedCwl" ref="processWrapper"/>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import ApplicationPackageCwlTemplate from "../components/Template/ApplicationPackageCwlTemplate";
import PageTitle from "../components/Shared/PageTitle";
import "vue-slider-component/theme/antd.css";
import {saveAs} from "file-saver";
import yaml from "js-yaml";
import {cwlValidator} from "../cwlObjectValidator";
import MetadataEditor from "../components/metadata/MetadataEditor";
import WorkflowEditor from "../components/Workflow/WorkflowEditor";
import CommandLineToolEditor from "../components/CommandLinetool/CommandLineToolEditor";
import {parseCwlObject, removeEmpty, showNotification, validateCwlConsistency} from "../utils";
import {mapGetters} from "vuex";
import {
  ADD_COMMAND_LINE_TOOL,
  CHANGE_FILE_NAME,
  REMOVE_COMMAND_LINE_TOOL,
  SET_CWL_OBJECT
} from "../store/action-types";

export default {
  name: "ApplicationPackageEditor",
  components: {MetadataEditor, WorkflowEditor, CommandLineToolEditor, ApplicationPackageCwlTemplate, PageTitle},
  data() {
    return {
      modalIdentifier: 'Workflow Input',
      selectedInput: undefined,
      idx: undefined,
    };
  },
  methods: {
    removeClt(clt) {
      this.$store.dispatch(REMOVE_COMMAND_LINE_TOOL, clt);
    },
    pushNewClt() {
      this.$store.dispatch(ADD_COMMAND_LINE_TOOL);
    },
    uploadFile() {
      this.$refs.file.click();
    },
    yamlToObject(yamlContent) {
      let yamlObj = undefined;
      try {
        yamlObj = yaml.load(yamlContent);
      } catch (error) {
        showNotification('YAML Validator', {type: 'error', text: error.message, duration: 5000, group: 'global'});
        return undefined;
      }
      return yamlObj;
    },
    onFileUpload(event) {
      if (event.target.files.length) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const yamlObject = this.yamlToObject(reader.result);
          cwlValidator.validate(yamlObject, {strict: true}).then((validatedCwlObject) => {
            this.$store.dispatch(SET_CWL_OBJECT, parseCwlObject(validatedCwlObject));
            this.$store.dispatch(CHANGE_FILE_NAME, file.name);
            this.validateCwl();
          }).catch((error) => {
            showNotification('CWL Validator', {type: 'error', text: error.message, duration: 5000, group: 'global'});
            this.$store.dispatch(SET_CWL_OBJECT, parseCwlObject(yamlObject));
            this.$store.dispatch(CHANGE_FILE_NAME, file.name);
            this.validateCwl();
          });
        };
        reader.onerror = () =>
          showNotification('File Error', {type: 'error', text: reader.error, duration: 5000, group: 'global'});
        reader.readAsText(file);
      }
      this.$refs.file.value = ''; // Clear the file to allow change detection when same file is re-uploaded
    },
    downloadWrapper() {
      let data = this.$refs.processWrapper.$el.innerText;
      let mimetype = "text/yaml";
      let blob = new Blob([data], {type: mimetype + ";charset=utf-8"});
      saveAs(blob, this.cwlFileName);
      return false;
    },
    handleFileNameChange(value) {
      this.$store.dispatch(CHANGE_FILE_NAME, value);
    },
    validateCwl() {
      const issues = validateCwlConsistency(this.cwlObject);
      if (issues.length) {
        showNotification(
          'CWL Validation issues', {group: 'global', type: 'error', text: issues, duration: -1}
        );
      } else {
        showNotification(
          'CWL file is valid', {group: 'info', type: 'success'}
        );
      }
    }
  },
  computed: {
    cleanedCwl() {
      return removeEmpty(this.cwlObject);
    },
    ...mapGetters({
      cwlObject: 'cwlObject',
      commandLineTools: 'commandLineTools',
      workflow: 'workflow',
      cwlFileName: 'cwlFileName',
      nsPrefix: 'nsPrefix'
    })
  }
};
</script>

<style>
.add-btn {
  text-transform: uppercase;
  font-size: 0.8rem;
  width: fit-content;
}

.editor-card .card-body {
  max-height: 79vh;
  overflow-y: auto;
}

.card-section .title {
  display: flex;
  justify-content: center;
  padding: 4px;
  margin: 20px 0px 0px 0px;
  background-color: #f7f7f7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.center-text {
  display: flex;
  align-items: center;
}

.nav-tabs .nav-link {
  padding: 12px !important;
}

.clt-list {
  height: 80vh;
  overflow-y: auto;
}

.clt-list .card-body {
  padding: 0px;
}

.clt-list .card-header {
  padding: 0px;
}

.cwl-template .card-header {
  padding: 0.35rem 2rem !important;
}

.card-header {
  background-color: #ebebeb !important;
}

.cwl-template .card-body {
  max-height: 85vh;
  overflow-y: auto;
  padding: 12px 12px 0px 12px;
}

.empty-text .alert {
  padding: 0.7rem 0.25rem 0rem 0.25rem;
  margin: 0rem;
}
</style>
