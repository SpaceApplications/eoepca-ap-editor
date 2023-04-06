<template>
  <b-form>
    <div class="form-content">
      <b-form-group
          label="Identifier:"
          description="The unique identifier for this parameter object."
      >
        <b-form-input v-model="output.id" type="text"/>
        <b-form-invalid-feedback :state="idValidator">This field is required.</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group
          label="Type:"
          description="Specify valid types of data that may be assigned to this parameter."
      >
        <b-row align-v="center">
          <b-col sm="9">
            <multiselect v-model="output.type" :options="dataTypes"/>
          </b-col>
          <b-col sm="2">
            <b-form-checkbox v-model="optionalType">Optional</b-form-checkbox>
          </b-col>
        </b-row>
      </b-form-group>
      <b-form-group
          label="Format:"
          description="Note: you can add a list of format using ',' as a separator."
      >
        <b-form-input
            :value="formatValue" @input="handleFormatChange" type="text" :disabled="!output.type?.includes('File')"
        />
      </b-form-group>
      <b-form-checkbox v-model="output.streamable" class="m-2" :disabled="!output.type?.includes('File')">
        Streamable
      </b-form-checkbox>
      <b-form-group
          label="Output Binding:"
          description="Describes how to handle the outputs of a process."
      >
        <div class="composite-output">
          <b-form-group
              label-cols-sm="2.5"
              label="Glob:"
          >
            <b-form-input v-model="output.outputBinding.glob" type="text"/>
          </b-form-group>
          <b-form-group
              label-cols-sm="2.5"
              label="Output Eval:"
          >
            <b-form-input v-model="output.outputBinding.outputEval" type="text"/>
          </b-form-group>
          <b-form-checkbox v-model="output.outputBinding.loadContents">Load Contents</b-form-checkbox>
        </div>
      </b-form-group>
      <b-form-group
          label="Label:"
          description="A short, human-readable label of this object."
      >
        <b-form-input v-model="output.label" type="text"/>
      </b-form-group>
      <b-form-group
          label="Doc:"
          description="A documentation string for this type."
      >
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

export default {
  name: "WorkflowOutputForm",
  components: {Multiselect},
  props: {
    outputProp: Object,
  },
  methods: {
    handleSubmit() {
      const inputData = {
        ...this.output,
        type: this.output.type ? `${this.output.type}${this.optionalType ? '?' : ''}` : undefined,
      };
      if (this.outputProp) {
        this.$emit('onEdit', inputData);
      } else {
        this.$emit('onAdd', inputData);
      }
    },
    handleCancel() {
      this.$emit('onClose');
    },
    handleFormatChange(newValue){
      const trimmedValue = newValue.replace(/\s/g, '')
      if (trimmedValue.split(',').filter(e => e).length > 1) {
        this.$set(this.output, 'format', trimmedValue.split(','));
      } else {
        this.$set(this.output, 'format', trimmedValue);
      }
    }
  },
  data() {
    return {
      output: this.outputProp ? {...this.outputProp, type: this.outputProp.type?.replace('?', '')} : {
        id: undefined,
        label: undefined,
        doc: undefined,
        streamable: undefined,
        outputBinding: {
          glob: undefined,
          loadContents: undefined,
          outputEval: undefined,
        },
        format: undefined,
        type: undefined,
      },
      optionalType: this.outputProp?.type?.endsWith('?') || false,
    }
  },
  computed: {
    dataTypes() {
      return [
        ...cwlTypes,
        ...cwlTypes.filter(type => type !== 'Directory' && type !== 'File').map(type => `${type}[]`),
      ];
    },
    idValidator() {
      return this.output.id !== undefined && this.output.id.length > 0;
    },
    formatValue() {
      if (Array.isArray(this.output.format)) return this.output.format.join(', ');
      return this.output.format;
    }
  }
}
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
