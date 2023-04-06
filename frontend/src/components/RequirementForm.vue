<template>
  <b-form @submit.stop.prevent>
    <div class="form-content">
      <b-form-group label="Type:">
        <multiselect v-model="type" :options="dataTypes"/>
      </b-form-group>
      <div v-if="type==='DockerRequirement'" class="p-3" style="background-color: rgba(231,231,231,0.56)">
        <b-form-group label="Docker Pull:">
          <b-form-input v-model="requirement.dockerPull" type="text"/>
        </b-form-group>
        <b-form-group label="Docker Load:">
          <b-form-input v-model="requirement.dockerLoad" type="text"/>
        </b-form-group>
        <b-form-group label="Docker File:">
          <b-form-input v-model="requirement.dockerFile" type="text"/>
        </b-form-group>
        <b-form-group label="Docker Import:">
          <b-form-input v-model="requirement.dockerImport" type="text"/>
        </b-form-group>
        <b-form-group label="Docker Image ID:">
          <b-form-input v-model="requirement.dockerImageId" type="text"/>
        </b-form-group>
        <b-form-group label="Docker Output Directory:">
          <b-form-input v-model="requirement.dockerOutputDirectory" type="text"/>
        </b-form-group>
      </div>
      <div v-if="type==='ResourceRequirement'" class="p-3" style="background-color: rgba(231,231,231,0.56)">
        <b-form-group label="Cores Min:">
          <b-form-input v-model="requirement.coresMin" type="number"/>
        </b-form-group>
        <b-form-group label="Cores Max:">
          <b-form-input v-model="requirement.coresMax" type="number"/>
        </b-form-group>
        <b-form-group label="Ram Min:">
          <b-form-input v-model="requirement.ramMin" type="number"/>
        </b-form-group>
        <b-form-group label="Ram Max:">
          <b-form-input v-model="requirement.ramMax" type="number"/>
        </b-form-group>
      </div>
    </div>
    <div class="form-control-btn">
      <b-btn variant="primary" @click="handleSubmit" size="sm">
        <fa-icon class="mr-2" :icon="this.requirementProp ? 'save' : 'plus'"/>
        <span>{{ this.requirementProp ? 'Save' : 'Add' }}</span>
      </b-btn>
      <b-btn @click="handleCancel" size="sm">
        <fa-icon class="mr-2" icon="times"/>
        <span>Cancel</span>
      </b-btn>
    </div>
  </b-form>
</template>

<script>
import Multiselect from "vue-multiselect";

export default {
  name: "RequirementForm",
  components: { Multiselect },
  props: {
    requirementProp: Array,
  },
  watch: {
    type(newValue, oldValue) {
      this.requirement = {};
    }
  },
  data() {
    return {
      type: this.requirementProp ?  this.requirementProp[0] : 'DockerRequirement',
      requirement: this.requirementProp ?  this.requirementProp[1] : {},
    }
  },
  methods: {
    handleSubmit() {
      if (this.requirementProp) {
        this.$emit('onEdit', {[this.type]: this.requirement});
      } else {
        this.$emit('onAdd', this.type, this.requirement);
      }
    },
    handleCancel() {
      this.$emit('onClose');
    }
  },
  computed: {
    dataTypes() {
      return ['DockerRequirement', 'ResourceRequirement', 'ScatterFeatureRequirement', 'InlineJavascriptRequirement',
        'MultipleInputFeatureRequirement', 'SubworkflowFeatureRequirement'];
    },
  }
}
</script>

<style scoped>
.composite-input {
  margin-left: 20px;
}

.form-content {
  padding-left: 16px;
  padding-right: 16px;
  height: 56vh;
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
