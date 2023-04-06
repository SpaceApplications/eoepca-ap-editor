<template>
  <div style="padding: 14px">
    <b-modal
        @hide="closeModalForm"
        ref="modal-form"
        :id="modalIdentifier"
        :title="modalIdentifier"
        align-h="end"
        hide-footer
        size="lg"
    >
      <command-line-tool-input-form
          :input-prop="selectedElement"
          v-if="modalIdentifier==='CommandLineTool Input'"
          @onEdit="onEditCommandLineToolInput"
          @onAdd="onAddCommandLineToolInput"
          @onClose="closeModalForm"
      />
      <command-line-tool-output-form
          :output-prop="selectedElement"
          @onEdit="onEditCommandLineToolOutput"
          @onAdd="onAddCommandLineToolOutput"
          @onClose="closeModalForm"
          v-if="modalIdentifier==='CommandLineTool Output'"
      />
      <requirement-form
        :requirement-prop="selectedElement"
        @onEdit="onEditCommandLineToolRequirement"
        @onAdd="onAddCommandLineToolRequirement"
        @onClose="closeModalForm"
        v-if="modalIdentifier==='CommandLineTool Requirements'"
      />
    </b-modal>
    <b-row class="mb-1">
      <b-col sm="3">
        <h6>Class</h6>
      </b-col>
      <b-col sm="3">
        <h6>Identifier</h6>
      </b-col>
      <b-col sm="3">
        <h6>Label</h6>
      </b-col>
      <b-col sm="3">
        <h6>Description</h6>
      </b-col>
    </b-row>
    <b-row class="mt-2">
      <b-col sm="3">
        <b-form-input type="text" :disabled="true" v-model="commandLineTool.class"/>
      </b-col>
      <b-col sm="3">
        <b-form-input type="text" v-model="commandLineTool.id" @keydown.space.prevent/>
        <b-form-invalid-feedback :state="commandLineTool.id !== undefined && commandLineTool.id.length > 0">
          This field is required.
        </b-form-invalid-feedback>
      </b-col>
      <b-col sm="3">
        <b-form-input type="text" v-model="commandLineTool.label" @keydown.space.prevent/>
      </b-col>
      <b-col sm="3">
        <b-form-input type="text" v-model="commandLineTool.doc"/>
      </b-col>
    </b-row>
    <b-row class="mt-2">
      <b-col sm="6">
        <b-form-group label="Base Command:">
          <empty class="m-0 p-0" v-if="commandLineTool.baseCommand?.length === 0" text="No Commands" no-icon/>
          <div class="p-1" style="max-height: 175px; overflow-y: auto; overflow-x: hidden">
            <b-row class="mt-2" v-for="(cmd, index) in commandLineTool.baseCommand" :key="cmd._key">
              <b-col sm="11">
                <b-form-input type="text" :value="cmd" @input="handleCmdChange($event, index)" @keydown.space.prevent/>
              </b-col>
              <b-btn class="float-right" variant="danger" @click="removeCmd(index)" size="sm">
                <fa-icon icon="times"/>
              </b-btn>
            </b-row>
          </div>
          <div align="right" class="pt-3">
            <b-btn class="add-btn" variant="outline-success" @click="addBaseCommand" size="sm">
              <fa-icon icon="plus"/>
              <span class="ml-2">Add command</span>
            </b-btn>
          </div>
        </b-form-group>
      </b-col>
      <b-col sm="6">
        <b-form-group label="Arguments:">
          <empty class="m-0 p-0" v-if="commandLineTool.arguments?.length === 0" text="No Arguments" no-icon/>
          <div class="p-1" style="max-height: 175px; overflow-y: auto; overflow-x: hidden">
            <b-row class="mt-2" v-for="(argument, index) in commandLineTool.arguments" :key="argument._key">
              <b-col sm="11">
                <b-form-input type="text" :value="argument" @input="handleArgumentChange($event, index)" @keydown.space.prevent/>
              </b-col>
              <b-btn class="float-right" variant="danger" @click="removeArgument(index)" size="sm">
                <fa-icon icon="times"/>
              </b-btn>
            </b-row>
          </div>
          <div align="right" class="pt-3">
            <b-btn class="add-btn" variant="outline-success" @click="addArgument" size="sm">
              <fa-icon icon="plus"/>
              <span class="ml-2">Add Argument</span>
            </b-btn>
          </div>
        </b-form-group>
      </b-col>
    </b-row>
    <div class="card-section">
      <div class="title" v-b-toggle="`collapse-inputs-${pos}`">Inputs</div>
      <b-collapse :id="`collapse-inputs-${pos}`">
        <b-table :fields="inputTableFields" :items="commandLineTool.inputs" small show-empty>
          <template #cell(action)="data">
            <b-btn
                variant="primary" @click="edit(data.item, data.index, 'CommandLineTool Input')"
                class="mr-2" size="sm"
            >
              <fa-icon icon="edit"></fa-icon>
            </b-btn>
            <b-btn variant="danger" @click="removeElement('inputs', data.index)" size="sm">
              <fa-icon icon="times"></fa-icon>
            </b-btn>
          </template>
          <template #empty>
            <div class="text-center mt-2"><i>There are no inputs to show.</i></div>
          </template>
        </b-table>
        <div class="col" align="right">
          <b-btn
              class="add-btn" variant="outline-success"
              @click="showModalForm('CommandLineTool Input')" size="sm"
          >
            <fa-icon icon="plus"></fa-icon>
            <span class="ml-2">Add input</span>
          </b-btn>
        </div>
      </b-collapse>
    </div>
    <div class="card-section">
      <div class="title" v-b-toggle="`collapse-outputs-${pos}`">Outputs</div>
      <b-collapse :id="`collapse-outputs-${pos}`">
        <b-table :fields="outputTableFields" :items="commandLineTool.outputs" small show-empty>
          <template #cell(action)="data">
            <b-btn
                variant="primary" @click="edit(data.item, data.index, 'CommandLineTool Output')"
                class="mr-2" size="sm"
            >
              <fa-icon icon="edit"></fa-icon>
            </b-btn>
            <b-btn variant="danger" @click="removeElement('outputs', data.index)" size="sm">
              <fa-icon icon="times"></fa-icon>
            </b-btn>
          </template>
          <template #empty>
            <div class="text-center mt-2"><i>There are no outputs to show.</i></div>
          </template>
        </b-table>
        <div class="col" align="right">
          <b-btn
              class="add-btn"
              variant="outline-success"
              @click="showModalForm('CommandLineTool Output')"
              size="sm"
          >
            <fa-icon icon="plus"></fa-icon>
            <span class="ml-2">Add output</span>
          </b-btn>
        </div>
      </b-collapse>
    </div>
    <requirement-editor
        :requirements-prop="commandLineTool.requirements"
        :pos="pos"
        modal-title-prop="CommandLineTool Requirements"
        :collapsed-prop="false"
    />
  </div>
</template>

<script>
import CommandLineToolInputForm from "./CommandLineToolInputForm";
import CommandLineToolOutputForm from "./CommandLineToolOutputForm";
import RequirementForm from "../RequirementForm";
import RequirementEditor from "../RequirementEditor";
import Empty from "../Shared/Empty";
import {
  ADD_COMMAND_LINE_TOOL_ELEMENT,
  EDIT_COMMAND_LINE_TOOL,
  REMOVE_COMMAND_LINE_TOOL_ELEMENT
} from "../../store/action-types";

export default {
  name: 'CommandLineToolEditor',
  components: {Empty, CommandLineToolInputForm, CommandLineToolOutputForm, RequirementForm, RequirementEditor},
  props: {
    commandLineToolProp: Object,
    pos: Number,
  },
  data() {
    return {
      inputTableFields: [
        {key: 'id', label: 'Identifier', thStyle: { width: "20%" }},
        {key: 'type', label: 'Type', thStyle: { width: "15%" }},
        {key: 'default', label: 'Default', thStyle: { width: "25%" }},
        {key: 'doc', label: 'Description', thStyle: { width: "30%" }},
        {key: 'action', label: '', thStyle: { width: "10%" }},
      ],
      outputTableFields: [
        {key: 'id', label: 'Identifier', thStyle: { width: "20%" }},
        {key: 'type', label: 'Type', thStyle: { width: "15%" }},
        {key: 'label', label: 'Label', thStyle: { width: "25%" }},
        {key: 'doc', label: 'Description', thStyle: { width: "30%" }},
        {key: 'action', label: '', thStyle: { width: "10%" }},
      ],
      modalIdentifier: 'CommandLineTool Input',
      selectedElement: undefined,
      selectedElementIndex: undefined,
      commandLineTool: this.commandLineToolProp || {
        id: undefined,
        class: 'CommandLineTool',
        baseCommand: [],
        arguments: [],
        label: undefined,
        doc: undefined,
        inputs: [],
        outputs: [],
        requirements: {},
      }
    }
  },
  methods: {
    onEditCommandLineToolInput(data) {
      this.$store.dispatch(EDIT_COMMAND_LINE_TOOL, {
        instance: this.commandLineTool, property: 'inputs',
        index: this.selectedElementIndex, updatedData: data
      })
      this.closeModalForm();
    },
    onAddCommandLineToolInput(data) {
      this.$store.dispatch(ADD_COMMAND_LINE_TOOL_ELEMENT, {
        instance: this.commandLineTool, property: 'inputs', data
      })
      this.closeModalForm();
    },
    onEditCommandLineToolOutput(data) {
      this.$store.dispatch(EDIT_COMMAND_LINE_TOOL, {
        instance: this.commandLineTool, property: 'outputs',
        index: this.selectedElementIndex, updatedData: data
      })
      this.closeModalForm();
    },
    onAddCommandLineToolOutput(data) {
      this.$store.dispatch(ADD_COMMAND_LINE_TOOL_ELEMENT, {
        instance: this.commandLineTool, property: 'outputs', data
      })
      this.closeModalForm();
    },
    onEditCommandLineToolRequirement(data) {
      this.$delete(this.commandLineTool.requirements, this.selectedElementIndex)
      this.commandLineTool.requirements = {...this.commandLineTool.requirements, ...data};
      this.closeModalForm();
    },
    onAddCommandLineToolRequirement(type, data) {
      this.$set(this.commandLineTool.requirements, type, data);
      this.closeModalForm();
    },
    showModalForm(identifier) {
      this.modalIdentifier = identifier;
      this.$refs['modal-form'].show();
    },
    closeModalForm() {
      this.$refs['modal-form'].hide();
      this.selectedElement = undefined;
      this.selectedElementIndex = undefined;
    },
    edit(element, index, modalIdentifier) {
      this.selectedElement = element;
      this.selectedElementIndex = index;
      this.showModalForm(modalIdentifier);
    },
    removeElement(property, index) {
      this.$store.dispatch(REMOVE_COMMAND_LINE_TOOL_ELEMENT, {instance: this.commandLineTool, property, index})
    },
    addBaseCommand() {
      this.commandLineTool.baseCommand.push('');
    },
    handleCmdChange(value, index) {
      this.$set(this.commandLineTool.baseCommand, index, value.replace(' ', ''))
    },
    removeCmd(index) {
      this.$delete(this.commandLineTool.baseCommand, index)
    },
    addArgument() {
      this.commandLineTool.arguments.push('');
    },
    handleArgumentChange(value, index) {
      this.$set(this.commandLineTool.arguments, index, value.replace(' ', ''))
    },
    removeArgument(index) {
      this.$delete(this.commandLineTool.arguments, index)
    }
  },
}
</script>

<style scoped>

</style>
