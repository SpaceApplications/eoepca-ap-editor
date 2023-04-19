<template>
  <b-form @submit.stop.prevent>
    <div class="form-content" data-v-step="clt-tour-7">
      <b-form-group
        label="Identifier:"
        description="The unique identifier for this parameter object."
      >
        <b-form-input v-model="input.id" type="text"/>
        <b-form-invalid-feedback :state="idValidator">{{ this.idValidatorFeedback }}</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group
        label="Type:"
        description="Specify valid types of data that may be assigned to this parameter."
      >
        <b-row align-v="center">
          <b-col sm="9">
            <multiselect
              v-model="input.type"
              :options="dataTypes"
            />
          </b-col>
          <b-col sm="2">
            <b-form-checkbox v-model="optionalType">Optional</b-form-checkbox>
          </b-col>
        </b-row>
      </b-form-group>
      <b-form-group
        label="Default:"
        description="The default value to use for this parameter if the parameter is missing from the input object."
      >
        <b-form-input v-model="input.default" type="text"/>
      </b-form-group>
      <b-form-checkbox v-model="input.streamable" class="m-2" v-if="input.type?.includes('File')">
        Streamable
      </b-form-checkbox>
      <b-form-group
        label="Input Binding:"
        description="Describes how to handle the inputs of a process."
      >
        <div class="composite-input">
          <b-form-group
            label-cols-sm="2.5"
            label="Position:"
          >
            <b-form-input v-model="input.inputBinding.position" type="number" min="1"/>
          </b-form-group>
          <b-form-group
            label-cols-sm="2.5"
            label="Prefix:"
          >
            <b-form-input v-model="input.inputBinding.prefix" type="text"/>
          </b-form-group>
          <b-form-group
            label-cols-sm="2.5"
            label="Item Separator:"
          >
            <b-form-input v-model="input.inputBinding.itemSeparator" type="text"/>
          </b-form-group>
          <b-form-group
            label-cols-sm="2.5"
            label="Value From:"
          >
            <b-form-input v-model="input.inputBinding.valueFrom" type="text"/>
          </b-form-group>
          <b-row class="mt-2">
            <b-col sm="4">
              <b-form-checkbox v-model="input.inputBinding.loadContents">Load Contents</b-form-checkbox>
            </b-col>
            <b-col sm="4">
              <b-form-checkbox v-model="input.inputBinding.separate">Separate</b-form-checkbox>
            </b-col>
            <b-col sm="4">
              <b-form-checkbox v-model="input.inputBinding.shellQuote">Shell Quote</b-form-checkbox>
            </b-col>
          </b-row>
        </div>
      </b-form-group>
      <b-form-group
        label="Label:"
        description="A short, human-readable label of this object."
      >
        <b-form-input v-model="input.label" type="text"/>
      </b-form-group>
      <b-form-group
        label="Description:"
        description="A documentation string for this type."
      >
        <b-form-textarea v-model="input.doc" rows="3" max-rows="6"/>
      </b-form-group>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" :disabled="!idValidator" @click="handleSubmit" size="sm">
        <fa-icon class="mr-2" :icon="this.inputProp ? 'save' : 'plus'"/>
        <span>{{ this.inputProp ? 'Save' : 'Add' }}</span>
      </b-btn>
      <b-btn @click="handleCancel" size="sm" id="clt-input-modal-cancel-btn">
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
  name: "CommandLineToolInputForm",
  components: {Multiselect},
  props: {
    inOutIds: Array,
    inputProp: Object,
  },
  data() {
    return {
      input: {
        id: undefined,
        label: undefined,
        doc: undefined,
        default: undefined,
        streamable: undefined,
        ...this.inputProp,
        type: this.inputProp?.type?.replace('?', ''),
        inputBinding: {
          loadContents: undefined,
          position: undefined,
          prefix: undefined,
          separate: undefined,
          itemSeparator: undefined,
          valueFrom: undefined,
          shellQuote: undefined,
          ...this.inputProp?.inputBinding
        }
      },
      optionalType: this.inputProp?.type?.endsWith('?') || false,
    };
  },
  methods: {
    handleSubmit() {
      const inputData = {
        ...this.input,
        type: this.input.type ? `${this.input.type}${this.optionalType ? '?' : ''}` : undefined,
      };
      if (this.inputProp) {
        this.$emit('onEdit', inputData);
      } else {
        this.$emit('onAdd', inputData);
      }
    },
    handleCancel() {
      this.$emit('onClose');
    }
  },
  computed: {
    dataTypes() {
      return cwlTypes;
    },
    idValidator() {
      return this.input?.id !== undefined && this.input?.id.length > 0
        && this.inOutIds.filter(id => id === this.input?.id && id !== this.inputProp?.id).length === 0;
    },
    idValidatorFeedback() {
      if (this.input?.id === undefined || this.input?.id.length === 0)
        return 'This field is required.';
      return 'This field must be unique.';
    }
  }
};
</script>

<style scoped>
.composite-input {
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
