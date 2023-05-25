<template>
  <b-form @submit.stop.prevent>
    <div class="form-content">
      <b-form-group label="Identifier:" v-b-tooltip.hover.window.html="getHelper('paramIdentifier')">
        <b-form-input v-model="input.id" type="text" @keydown.space.prevent/>
        <b-form-invalid-feedback :state="idValidator">{{ this.idValidatorFeedback }}</b-form-invalid-feedback>
      </b-form-group>
      <b-form-group label="Type:" v-b-tooltip.hover.window.html="getHelper('paramType')">
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
      <b-form-group label="Default:" v-b-tooltip.hover.window.html="getHelper('paramDefault')">
        <b-form-input v-model="input.default" type="text"/>
      </b-form-group>
      <b-form-group label="Label:" v-b-tooltip.hover.window.html="getHelper('label')">
        <b-form-input v-model="input.label" type="text" @keydown.space.prevent/>
      </b-form-group>
      <b-form-group label="Description:" v-b-tooltip.hover.window.html="getHelper('description')">
        <b-form-textarea v-model="input.doc" rows="3" max-rows="6"/>
      </b-form-group>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" :disabled="!idValidator" @click="handleSubmit">
        <fa-icon class="mr-2" :icon="this.inputProp ? 'save' : 'plus'"/>
        <span>{{ this.inputProp ? 'Save' : 'Add' }}</span>
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

export default {
  name: "WorkflowInputForm",
  components: {Multiselect},
  props: {
    inOutStepIds: Array,
    inputProp: Object,
  },
  data() {
    return {
      input: {
        id: undefined,
        label: undefined,
        doc: undefined,
        default: undefined,
        ...this.inputProp,
        type: this.inputProp?.type?.replace('?', '')
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
      return this.input?.id !== undefined && this.input.id?.length > 0
        && this.inOutStepIds.filter(id => id === this.input?.id && id !== this.inputProp?.id).length === 0;
    },
    idValidatorFeedback() {
      if (this.input?.id === undefined || this.input?.id.length === 0)
        return 'This field is required.';
      return 'This field must be unique.';
    },
    ...mapGetters({
      mode: 'mode'
    }),
  }
};
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
