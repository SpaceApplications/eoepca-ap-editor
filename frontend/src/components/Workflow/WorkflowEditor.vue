<template>
  <div>
    <b-modal
      ref="modal-form"
      :id="modalIdentifier"
      :title="modalIdentifier"
      align-h="end"
      hide-footer
      size="lg"
      @hide="closeModalForm"
    >
      <workflow-input-form
        :input-prop="selectedElement"
        :in-out-step-ids="inOutStepIds"
        v-if="modalIdentifier==='Workflow Input'"
        @onEdit="onEditWorkflowInput"
        @onAdd="onAddWorkflowInput"
        @onClose="closeModalForm"
      />
      <workflow-output-form
        :output-prop="selectedElement"
        :in-out-step-ids="inOutStepIds"
        @onEdit="onEditWorkflowOutput"
        @onAdd="onAddWorkflowOutput"
        @onClose="closeModalForm"
        v-if="modalIdentifier==='Workflow Output'"
      />
      <workflow-step-form
        :step-prop="selectedElement"
        :in-out-step-ids="inOutStepIds"
        @onEdit="onEditWorkflowStep"
        @onAdd="onAddWorkflowStep"
        @onClose="closeModalForm"
        v-if="modalIdentifier==='Workflow Step'"
      />
    </b-modal>
    <b-row class="mb-1">
      <b-col sm="3" v-b-tooltip.hover.html="getHelper('class')">
        <h6>Class</h6>
        <b-form-input type="text" :disabled="true" v-model="workflow.class"/>
      </b-col>
      <b-col sm="3" v-b-tooltip.hover.html="getHelper('identifier')">
        <h6>Identifier</h6>
        <b-form-input type="text" v-model="workflow.id" @keydown.space.prevent/>
        <b-form-invalid-feedback :state="idValidator">
          {{ this.idValidatorFeedback }}
        </b-form-invalid-feedback>
      </b-col>
      <b-col sm="3" v-b-tooltip.hover.html="getHelper('label')">
        <h6>Label</h6>
        <b-form-input type="text" v-model="workflow.label" @keydown.space.prevent/>
      </b-col>
      <b-col sm="3" v-b-tooltip.hover.html="getHelper('description')">
        <h6>Description</h6>
        <b-form-input type="text" v-model="workflow.doc"/>
      </b-col>
    </b-row>
    <div class="card-section">
      <div class="title" v-b-toggle.collapse-inputs v-b-tooltip.hover.html="getHelper('inputs')">
        Inputs
      </div>
      <b-collapse id="collapse-inputs" visible>
        <b-table :fields="inputTableFields" :items="workflow.inputs" small show-empty>
          <template #cell(action)="data">
            <b-btn
              variant="primary" @click="edit(data.item, data.index, 'Workflow Input')"
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
            class="add-btn"
            variant="outline-success"
            @click="showModalForm('Workflow Input')"
            size="sm"
          >
            <fa-icon icon="plus"></fa-icon>
            <span class="ml-2">Add input</span>
          </b-btn>
        </div>
      </b-collapse>
    </div>
    <div class="card-section">
      <div class="title" v-b-toggle.collapse-outputs v-b-tooltip.hover.html="getHelper('outputs')">
        Outputs
      </div>
      <b-collapse id="collapse-outputs" visible>
        <b-table :fields="outputTableFields" :items="workflow.outputs" small show-empty>
          <template #cell(outputSource)="data">
            <b-icon
              v-if="!data.item.outputSource?.length" icon="exclamation-circle-fill"
              variant="warning" v-b-tooltip.hover.v-warning="'Output has no configured source.'"
            />
            {{ data.item.outputSource?.join(', ') }}
          </template>
          <template #cell(action)="data">
            <b-btn
              variant="primary" @click="edit(data.item, data.index, 'Workflow Output')"
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
            @click="showModalForm('Workflow Output')"
            size="sm"
          >
            <fa-icon icon="plus"></fa-icon>
            <span class="ml-2">Add output</span>
          </b-btn>
        </div>
      </b-collapse>
    </div>
    <div class="card-section" id="wfl-steps-card">
      <div class="title" v-b-toggle.collapse-steps v-b-tooltip.hover.html="getHelper('steps')">
        Steps
      </div>
      <b-collapse id="collapse-steps" visible>
        <b-table :fields="stepTableFields" :items="workflow.steps" small show-empty>
          <template #cell(run)="data">
            <b-icon
              v-if="!data.item.run" icon="exclamation-circle-fill"
              variant="warning" v-b-tooltip.hover.v-warning="'Step has no configured command line tool.'"
            />
            {{ data.item.run?.replace('#', '') }}
          </template>
          <template #cell(in)="data">
            <ul>
              <li v-for="input in data.item.in" :key="input._key">
                <b-icon
                  v-if="!input.source?.length" icon="exclamation-circle-fill"
                  variant="danger" v-b-tooltip.hover.v-danger="'Input has no configured source.'"
                />
                {{ `id: ${input.id || '-'}, source: ${input.source?.length ? input.source : '-'}` }}
              </li>
            </ul>
          </template>
          <template #cell(out)="data">
            {{ data.item.out?.map(out => `id: ${out}`).join(', ') }}
          </template>
          <template #cell(action)="data">
            <b-btn
              variant="primary" @click="edit(data.item, data.index, 'Workflow Step')"
              class="mr-2" size="sm"
            >
              <fa-icon icon="edit"></fa-icon>
            </b-btn>
            <b-btn variant="danger" @click="removeElement('steps', data.index)" size="sm">
              <fa-icon icon="times"></fa-icon>
            </b-btn>
          </template>
          <template #empty>
            <div class="text-center mt-2"><i>There are no steps to show.</i></div>
          </template>
        </b-table>
        <div class="col" align="right">
          <b-btn
            class="add-btn"
            variant="outline-success"
            @click="showModalForm('Workflow Step')"
            size="sm"
          >
            <fa-icon icon="plus"></fa-icon>
            <span class="ml-2">Add Step</span>
          </b-btn>
        </div>
      </b-collapse>
    </div>
    <requirement-editor
      :allow-workflow-req="true" :requirements-prop="workflow.requirements" modal-title-prop="Workflow Requirements"
    />
  </div>
</template>

<script>
import WorkflowInputForm from "./WorkflowInputForm";
import WorkflowOutputForm from "./WorkflowOutputForm";
import WorkflowStepForm from "./WorkflowStepForm";
import RequirementEditor from "../RequirementEditor";
import {mapGetters} from "vuex";
import {
  ADD_WORKFLOW_ELEMENT,
  EDIT_WORKFLOW,
  REMOVE_WORKFLOW_ELEMENT
} from "../../store/action-types";
import {BIcon} from "bootstrap-vue";

export default {
  name: 'WorkflowEditor',
  components: {BIcon, RequirementEditor, WorkflowStepForm, WorkflowOutputForm, WorkflowInputForm},
  data() {
    return {
      inputTableFields: [
        {key: 'id', label: 'Identifier', thStyle: {width: "20%"}},
        {key: 'type', label: 'Type', thStyle: {width: "15%"}},
        {key: 'default', label: 'Default', thStyle: {width: "25%"}},
        {key: 'doc', label: 'Description', thStyle: {width: "30%"}},
        {key: 'action', label: '', thStyle: {width: "15%"}},
      ],
      outputTableFields: [
        {key: 'id', label: 'Identifier', thStyle: {width: "20%"}},
        {key: 'type', label: 'Type', thStyle: {width: "15%"}},
        {key: 'outputSource', label: 'Output Source', thStyle: {width: "55%"}},
        {key: 'action', label: '', thStyle: {width: "10%"}},
      ],
      stepTableFields: [
        {key: 'id', label: 'Identifier', thStyle: {width: "20%"}},
        {key: 'run', label: 'Command Line Tool', thStyle: {width: "15%"}},
        {key: 'in', label: 'Step Inputs', thStyle: {width: "30%"}},
        {key: 'out', label: 'Step Outputs', thStyle: {width: "25%"}},
        {key: 'action', label: '', thStyle: {width: "10%"}},
      ],
      modalIdentifier: 'Workflow Input',
      selectedElement: undefined,
      selectedElementIndex: undefined,
    };
  },
  methods: {
    onEditWorkflowStep(data) {
      this.$store.dispatch(EDIT_WORKFLOW, {
        instance: this.workflow, property: 'steps',
        index: this.selectedElementIndex, updatedData: data
      });
      this.closeModalForm();
    },
    onAddWorkflowStep(data) {
      this.$store.dispatch(ADD_WORKFLOW_ELEMENT, {
        instance: this.workflow, property: 'steps', data
      });
      this.closeModalForm();
    },
    onEditWorkflowInput(data) {
      this.$store.dispatch(EDIT_WORKFLOW, {
        instance: this.workflow, property: 'inputs',
        index: this.selectedElementIndex, updatedData: data
      });
      this.closeModalForm();
    },
    onAddWorkflowInput(data) {
      this.$store.dispatch(ADD_WORKFLOW_ELEMENT, {
        instance: this.workflow, property: 'inputs', data
      });
      this.closeModalForm();
    },
    onEditWorkflowOutput(data) {
      this.$store.dispatch(EDIT_WORKFLOW, {
        instance: this.workflow, property: 'outputs',
        index: this.selectedElementIndex, updatedData: data
      });
      this.closeModalForm();
    },
    onAddWorkflowOutput(data) {
      this.$store.dispatch(ADD_WORKFLOW_ELEMENT, {
        instance: this.workflow, property: 'outputs', data
      });
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
      this.$store.dispatch(REMOVE_WORKFLOW_ELEMENT, {instance: this.workflow, property, index});
    },
  },
  computed: {
    ...mapGetters({
      workflow: 'workflow',
      cwlObject: 'cwlObject',
    }),
    idValidator() {
      return this.workflow?.id !== undefined && this.workflow?.id.length > 0
        && this.cwlObject.$graph.filter(p => p.id === this.workflow?.id).length <= 1;
    },
    idValidatorFeedback() {
      if (this.workflow?.id === undefined || this.workflow?.id.length === 0)
        return 'This field is required.';
      return 'This field must be unique.';
    },
    inOutStepIds() {
      return [
        ...this.workflow.inputs.map(input => input.id),
        ...this.workflow.outputs.map(output => output.id),
        ...this.workflow.steps.map(step => step.id)
      ];
    }
  }
};
</script>

<style scoped>
ul {
  padding-left: 1rem;
  justify-content: center;
  align-items: center;
}
</style>
