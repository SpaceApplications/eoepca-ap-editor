<template>
  <b-form>
    <div class="form-content">
      <b-form-group label="Identifier:" v-b-tooltip.hover.html="getHelper('paramIdentifier')">
        <b-form-input v-model="output.id" type="text" @keydown.space.prevent/>
        <b-form-invalid-feedback :state="idValidator">{{ this.idValidatorFeedback }}</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group label="Type:" v-b-tooltip.hover.html="getHelper('paramDefault')">
        <b-row align-v="center">
          <b-col sm="9">
            <multiselect :value="output.type" :options="dataTypes" @select="onTypeChange" @remove="remove"/>
          </b-col>
          <b-col sm="2">
            <b-form-checkbox v-model="optionalType">Optional</b-form-checkbox>
          </b-col>
        </b-row>
      </b-form-group>
      <b-form-group label="Output Source:" v-b-tooltip.hover.html="getHelper('paramOutputSource')">
        <multiselect :value="outputSourceValue" :options="availableOutputs" label='id' @select="onOutputSourceSelect"/>
      </b-form-group>
      <div v-if="mode==='advanced'">
        <b-form-group label="Output Binding:" v-b-tooltip.hover.html="getHelper('paramOutputBinding')">
          <div class="composite-output">
            <b-form-group label-cols-sm="2.5" label="Glob:">
              <b-form-input :v-model="output.outputBinding?.glob" type="text" @keydown.space.prevent/>
            </b-form-group>
            <b-form-group label-cols-sm="2.5" label="Output Eval:">
              <b-form-input :v-model="output.outputBinding?.outputEval" type="text" @keydown.space.prevent/>
            </b-form-group>
            <b-form-checkbox :v-model="output.outputBinding?.loadContents">Load Contents</b-form-checkbox>
          </div>
        </b-form-group>
      </div>
      <b-form-group label="Label:" v-b-tooltip.hover.html="getHelper('label')">
        <b-form-input v-model="output.label" type="text" @keydown.space.prevent/>
      </b-form-group>
      <b-form-group label="Description:" v-b-tooltip.hover.html="getHelper('description')">
        <b-form-textarea v-model="output.doc" rows="3" max-rows="6"/>
      </b-form-group>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" :disabled="!idValidator" @click="handleSubmit">
        <fa-icon class="mr-2" :icon="this.outputProp ? 'save' : 'plus'"/>
        <span>{{ this.outputProp ? 'Save' : 'Add' }}</span>
      </b-btn>
      <b-btn @click="handleCancel">
        <fa-icon class="mr-2" icon="times"/>
        <span>Cancel</span>
      </b-btn>
    </div>
  </b-form>
</template>

<script>
import Multiselect from "vue-multiselect";
import {cwlTypes} from "../../cwlObjectValidator";
import {mapGetters} from "vuex";
import _ from 'lodash';

export default {
  name: "WorkflowOutputForm",
  components: {Multiselect},
  props: {
    inOutStepIds: Array,
    outputProp: Object,
  },
  data() {
    return {
      output: {
        id: undefined,
        label: undefined,
        doc: undefined,
        outputSource: undefined,
        ...this.outputProp,
        type: this.outputProp?.type?.replace('?', ''),
        outputBinding: {
          glob: undefined,
          loadContents: undefined,
          outputEval: undefined,
          ...this.outputProp?.outputBinding
        },
      },
      optionalType: this.outputProp?.type?.endsWith('?') || false,
    };
  },
  methods: {
    handleSubmit() {
      const outputData = {
        ...this.output,
        type: this.output.type ? `${this.output.type}${this.optionalType ? '?' : ''}` : undefined,
      };
      if (this.outputProp) {
        this.$emit('onEdit', outputData);
      } else {
        this.$emit('onAdd', outputData);
      }
    },
    handleCancel() {
      this.$emit('onClose');
    },
    onOutputSourceSelect(value) {
      this.output.outputSource = value ? [value.id] : [];
      this.output.type = value ? value.type : undefined;
    },
    onTypeChange(value) {
      if (this.output.type !== value) this.output.outputSource = [];
      this.output.type = value;
    },
    remove() {
      this.output.type = undefined;
      this.output.outputSource = [];
    }
  },
  computed: {
    dataTypes() {
      return cwlTypes;
    },
    idValidator() {
      return this.output?.id !== undefined && this.output?.id.length > 0
        && this.inOutStepIds.filter(id => id === this.output?.id && id !== this.outputProp?.id).length === 0;
    },
    idValidatorFeedback() {
      if (this.output?.id === undefined || this.output?.id.length === 0)
        return 'This field is required.';
      return 'This field must be unique.';
    },
    outputSourceValue() {
      if (this.output.type && this.output.outputSource?.length) return {
        id: this.output.outputSource[0],
        type: this.output.type
      };
      return undefined;
    },
    availableOutputs() {
      const outputType = this.output.type;
      return [
        ...this.workflow.steps.map(step => step.out.map(out => {
            const run = step.run.replace('#', '');
            let stepCltOutput = _.find(this.commandLineTools, {id: run})?.outputs;
            if (outputType) stepCltOutput = stepCltOutput.filter(output => output.type === outputType);
            return stepCltOutput.map(output => output.id).includes(out) ?
              {id: `${step.id}/${out}`, type: stepCltOutput.filter(output => output.id === out)[0].type} : undefined;
          }
        )).flat(),
      ].filter(e => e !== undefined);
    },
    ...mapGetters({
      workflow: 'workflow',
      commandLineTools: 'commandLineTools',
      mode: 'mode'
    })
  }
};
</script>

<style scoped>
.composite-output {
  margin-left: 20px;
}

.form-content {
  padding-left: 16px;
  padding-right: 16px;
  max-height: 75vh;
  overflow: auto;
}

.form-control-btn {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.form-control-btn .btn {
  margin-left: 6px;
  margin-right: 6px;
}
</style>
