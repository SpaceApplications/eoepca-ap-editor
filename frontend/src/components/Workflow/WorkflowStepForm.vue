<template>
  <b-form @submit.stop.prevent>
    <div class="form-content">
      <b-form-group
          label="Identifier:"
          description="The unique identifier for this parameter object."
      >
        <b-form-input v-model="step.id" type="text" @keydown.space.prevent/>
        <b-form-invalid-feedback :state="idValidator">This field is required.</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group label="Run">
        <multiselect
            :value="cltMap" :options="commandLineTools"
            label="id" @select="onCltSelect" @remove="removeClt"
            placeholder="Select a Command Line Tool..."
        />
      </b-form-group>
      <b-form-group label="In:">
        <empty class="m-0 p-0" v-if="!step.in?.length" text="No Inputs" no-icon></empty>
        <b-row class="mt-2" v-for="input in step.in" :key="input._key">
          <b-col sm="5" class="center-text">
            <b-form-input v-model="input.id" type="text" disabled/>
          </b-col>
          <b-col sm="7" class="center-text">
            <multiselect
                v-model="input.source" :options="availableInputs(input.id)"
                placeholder="Choose a input mapping..." multiple
            />
          </b-col>
        </b-row>
      </b-form-group>
      <b-form-group label="Out:">
        <b-form-input :value="step.out.join(', ')" type="text" disabled/>
      </b-form-group>
      <requirement-editor :requirements-prop="step.requirements" modal-title-prop="Step Requirements"/>
      <b-form-group
          label="Scatter:"
          description="Note: you can add a list of input using ',' as a separator."
      >
        <b-form-input :value="scatterValue" @input="handleScatterChange" type="text"/>
      </b-form-group>
      <b-form-group
          label="Scatter Method:"
          description="Required if scatter is an array of more than one element."
      >
        <multiselect v-model="step.scatterMethod" :options="scatterMethodOptions"/>
        <b-form-invalid-feedback :state="scatterMethodValidator">
          This field is required when the scatter field is an array.
        </b-form-invalid-feedback>
      </b-form-group>
      <b-form-group
          label="Label:"
          description="A short, human-readable label of this process object."
      >
        <b-form-input v-model="step.label" type="text" @keydown.space.prevent/>
      </b-form-group>
      <b-form-group
          label="Doc:"
          description="A long, human-readable description of this process object."
      >
        <b-form-textarea v-model="step.doc" rows="3" max-rows="6"/>
      </b-form-group>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" :disabled="!idValidator || !scatterMethodValidator" @click="handleSubmit">
        <fa-icon class="mr-2" :icon="this.stepProp ? 'save' : 'plus'"/>
        <span>{{ this.stepProp ? 'Save' : 'Add' }}</span>
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
import RequirementEditor from "../RequirementEditor";
import Empty from "../Shared/Empty";
import {scatterMethods} from "../../cwlObjectValidator";
import {mapGetters} from "vuex";

export default {
  name: "WorkflowStepForm",
  components: {Empty, Multiselect, RequirementEditor},
  props: {
    stepProp: Object,
  },
  mounted() {
    this.cltMap = _.find(this.commandLineTools, {id: this.stepProp?.run?.replace('#', '')})
  },
  data() {
    return {
      cltMap: undefined,
      step: this.stepProp ? {...this.stepProp} : {
        id: undefined,
        in: [],
        out: [],
        run: undefined,
        requirements: {},
        label: undefined,
        doc: undefined,
        scatter: undefined,
        scatterMethod: undefined,
      },
    }
  },
  methods: {
    handleSubmit() {
      if (this.stepProp) {
        this.$emit('onEdit', this.step);
      } else {
        this.$emit('onAdd', this.step);
      }
    },
    handleCancel() {
      this.$emit('onClose');
    },
    onCltSelect (selectedClt, id) {
      if (this.step.run !== `#${selectedClt.id}`) {
        this.cltMap = selectedClt;
        this.step.run = `#${selectedClt.id}`;
        this.step.in = selectedClt.inputs.map(input => ({id: input.id, source: undefined}));
        this.step.out = selectedClt.outputs.map(output => output.id);
      }
    },
    removeClt() {
      this.cltMap = undefined;
      this.step.run = undefined;
      this.step.in = [];
      this.step.out = [];
    },
    handleScatterChange(newValue){
      const trimmedValue = newValue.replace(/\s/g, '')
      if (trimmedValue.split(',').filter(e => e).length > 1) {
        this.$set(this.step, 'scatter', trimmedValue.split(','));
      } else {
        this.$set(this.step, 'scatter', trimmedValue);
      }
    },
    availableInputs(inputId) {
      const inputType = _.find(this.cltMap?.inputs, {id: inputId})?.type
      return [
          ...this.workflow.inputs.filter(input => input.type === inputType).map(input => input.id),
          ...this.workflow.steps.filter(step => step.run !== this.step.run).map(step => step.out.map(out => {
            const run = step.run.replace('#', '')
            const stepOutput = _.find(this.commandLineTools, {id: run})?.outputs.filter(output => output.type === inputType)
            return stepOutput.includes(out.id) ? `${step.id}/${out.id}` : undefined;
          })).flat(),
          ...this.commandLineTools.filter(clt => clt.id !== this.step.run.replace('#', '')).map(
              clt => clt.outputs.filter(output => output.type === inputType).map(output => `${clt.id}/${output.id}`)
          ).flat()
      ].filter(e => e !== undefined)
    },
  },
  computed: {
    scatterMethodValidator() {
      if (Array.isArray(this.step.scatter) && !this.step.scatterMethod) {
        return false
      }
      return true
    },
    idValidator() {
      return this.step.id !== undefined && this.step.id.length > 0;
    },
    scatterMethodOptions() {
      return scatterMethods;
    },
    scatterValue() {
      if (Array.isArray(this.step.scatter)) return this.step.scatter.join(', ');
      return this.step.scatter;
    },
    ...mapGetters({
      workflow: 'workflow',
      commandLineTools: 'commandLineTools'
    })
  }
}
</script>

<style scoped>
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
