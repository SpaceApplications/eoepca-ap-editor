<template>
  <div>
    <div id="ap-meta-information">
      <b-row class="mb-1">
        <b-col sm="2" v-b-tooltip.hover.window.html="getHelper('cwlVersion')">
          <h6>CWL Version</h6>
          <b-form-input type="text" v-model="cwlObject.cwlVersion" @keydown.space.prevent/>
          <b-form-invalid-feedback :state="versionValidator()">This field is required</b-form-invalid-feedback>
        </b-col>
        <b-col sm="2" v-b-tooltip.hover.window.html="getHelper('dateCreated')">
          <h6>Creation Date</h6>
          <b-form-input type="date" v-model="cwlObject[`${nsPrefix}:dateCreated`]"/>
        </b-col>
        <b-col sm="2" v-b-tooltip.hover.window.html="getHelper('softwareVersion')">
          <h6>Software Version</h6>
          <b-form-input type="text" v-model="cwlObject[`${nsPrefix}:softwareVersion`]" @keydown.space.prevent/>
        </b-col>
        <b-col sm="6" v-b-tooltip.hover.window.html="getHelper('keywords')">
          <h6>Keywords</h6>
          <b-form-input type="text" v-model="cwlObject[`${nsPrefix}:keywords`]"/>
        </b-col>
      </b-row>
      <b-row class="mb-1 mt-3">
        <b-col sm="6" v-b-tooltip.hover.window.html="getHelper('codeRepository')">
          <h6>Code Repository (URL)</h6>
          <b-form-input type="url" v-model="cwlObject[`${nsPrefix}:codeRepository`]" @keydown.space.prevent/>
        </b-col>
        <b-col sm="6" v-b-tooltip.hover.window.html="getHelper('license')">
          <h6>License (URL)</h6>
          <b-form-input type="url" v-model="cwlObject[`${nsPrefix}:license`]"/>
        </b-col>
      </b-row>
      <b-row class="mb-1 mt-3">
        <b-col sm="6" v-b-tooltip.hover.window.html="getHelper('releaseNotes')">
          <h6>Release Notes (URL)</h6>
          <b-form-input type="url" v-model="cwlObject[`${nsPrefix}:releaseNotes`]"/>
        </b-col>
        <b-col sm="6" v-b-tooltip.hover.window.html="getHelper('logo')">
          <h6>Logo (URL)</h6>
          <b-row>
            <b-col :sm="cwlObject[`${nsPrefix}:logo`] ? 10 : 12">
              <b-form-input type="url" v-model="cwlObject[`${nsPrefix}:logo`]"/>
            </b-col>
            <b-col :sm="cwlObject[`${nsPrefix}:logo`] ? 2 : 0">
              <img
                v-if="cwlObject[`${nsPrefix}:logo`]"
                :src="cwlObject[`${nsPrefix}:logo`]"
                alt="Logo Image" style="width: 60px"
              />
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </div>
    <div class="card-section" id="ap-meta-authors">
      <div class="title" v-b-toggle.collapse-authors v-b-tooltip.hover.window.html="getHelper('authors')">Authors</div>
      <b-collapse id="collapse-authors" visible>
        <empty class="m-0 p-0" v-if="authors?.length === 0" text="No Authors" no-icon></empty>
        <b-row class="mt-2" v-for="(author, index) in authors" :key="author._key">
          <b-col sm="3">
            <b-form-input
              placeholder="Author name..."
              type="text"
              v-model="authors[index][`${nsPrefix}:name`]"
            />
          </b-col>
          <b-col sm="4">
            <b-form-input
              placeholder="Author email..."
              type="email"
              v-model="authors[index][`${nsPrefix}:email`]"
              @keydown.space.prevent
            />
          </b-col>
          <b-col sm="4">
            <b-form-input
              placeholder="Author affiliation..."
              type="text"
              v-model="authors[index][`${nsPrefix}:affiliation`]"
            />
          </b-col>
          <b-col align="right">
            <b-btn class="float-right" variant="danger" @click="removeAuthor(index)" size="sm">
              <fa-icon icon="times"/>
            </b-btn>
          </b-col>
        </b-row>
        <b-row class="mt-4">
          <b-col align="right">
            <b-btn
              class="add-btn"
              variant="outline-success"
              @click="addAuthor()"
              size="sm"
            >
              <fa-icon icon="plus"></fa-icon>
              <span class="ml-2">Add Author</span>
            </b-btn>
          </b-col>
        </b-row>
      </b-collapse>
    </div>
    <div class="card-section" id="ap-meta-contributors">
      <div class="title" v-b-toggle.collapse-contributors v-b-tooltip.hover.window.html="getHelper('contributors')">
        Contributors
      </div>
      <b-collapse id="collapse-contributors" visible>
        <empty class="m-0 p-0" v-if="contributors?.length === 0" text="No Contributors" no-icon></empty>
        <b-row class="mt-2" v-for="(contributor, index) in contributors" :key="contributor._key">
          <b-col sm="3">
            <b-form-input
              placeholder="Contributor name..."
              type="text"
              v-model="contributors[index][`${nsPrefix}:name`]"
            />
            <b-form-invalid-feedback :state="contributorValidator(contributor[`${nsPrefix}:name`])">
              This field is mandatory
            </b-form-invalid-feedback>
          </b-col>
          <b-col sm="4">
            <b-form-input
              placeholder="Contributor email..."
              type="email"
              v-model="contributors[index][`${nsPrefix}:email`]"
              @keydown.space.prevent
            />
            <b-form-invalid-feedback :state="contributorValidator(contributor[`${nsPrefix}:email`])">
              This field is mandatory
            </b-form-invalid-feedback>
          </b-col>
          <b-col sm="4">
            <b-form-input
              placeholder="Contributor affiliation..."
              type="text"
              v-model="contributors[index][`${nsPrefix}:affiliation`]"
            />
            <b-form-invalid-feedback :state="contributorValidator(contributor[`${nsPrefix}:affiliation`])">
              This field is mandatory
            </b-form-invalid-feedback>
          </b-col>
          <b-col align="right">
            <b-btn class="float-right" variant="danger" @click="removeContributor(index)" size="sm">
              <fa-icon icon="times"/>
            </b-btn>
          </b-col>
        </b-row>
        <b-row class="mt-4">
          <b-col align="right">
            <b-btn
              class="add-btn"
              variant="outline-success"
              @click="addContributor()"
              size="sm"
            >
              <fa-icon icon="plus"></fa-icon>
              <span class="ml-2">Add Contributor</span>
            </b-btn>
          </b-col>
        </b-row>
      </b-collapse>
    </div>
    <div class="card-section" id="ap-meta-schemas">
      <div class="title" v-b-toggle.collapse-schemas v-b-tooltip.hover.window.html="getHelper('schemas')">Schemas</div>
      <b-collapse id="collapse-schemas" visible>
        <empty class="m-0 p-0" v-if="schemas?.length === 0" text="No Schemas" no-icon></empty>
        <b-row class="mt-2" v-for="(schema, index) in schemas" :key="schema._key">
          <b-col sm="11">
            <b-form-input
              placeholder="Enter your schema url here..."
              type="text"
              v-model="schemas[index]"
              @keydown.space.prevent
            />
          </b-col>
          <b-col align="right">
            <b-btn class="float-right" variant="danger" @click="removeSchema(index)" size="sm">
              <fa-icon icon="times"/>
            </b-btn>
          </b-col>
        </b-row>
        <b-row class="mt-4">
          <b-col align="right">
            <b-btn
              class="add-btn"
              variant="outline-success"
              @click="addSchema()"
              size="sm"
            >
              <fa-icon icon="plus"></fa-icon>
              <span class="ml-2">Add schema</span>
            </b-btn>
          </b-col>
        </b-row>
      </b-collapse>
    </div>
    <div class="card-section" id="ap-meta-namespaces">
      <div class="title" v-b-toggle.collapse-namespaces v-b-tooltip.hover.window.html="getHelper('namespaces')">
        Namespaces
      </div>
      <b-collapse id="collapse-namespaces" visible>
        <empty class="m-0 p-0" v-if="Object.entries(cwlObject.$namespaces).length === 0" text="No Namespaces" no-icon/>
        <b-row class="mt-2" v-for="nsPair in Object.entries(cwlObject.$namespaces)" :key="nsPair._key">
          <b-col sm="5">
            <b-form-input
              placeholder="Label..."
              type="text"
              @blur="handleLabelChange($event, nsPair)"
              :value="nsPair[0]"
              @keydown.space.prevent
            />
          </b-col>
          <b-col sm="6">
            <b-form-input
              placeholder="Value..."
              type="text"
              :value="nsPair[1]"
              @input="handleValueChange($event, nsPair)"
              :disabled="nsPair[0] === 's'"
              @keydown.space.prevent
            />
          </b-col>
          <b-col align="right">
            <b-btn
              class="float-right" variant="danger" @click="removeNamespace(nsPair[0])"
              :disabled="nsPair[0] === 's'" size="sm "
            >
              <fa-icon icon="times"/>
            </b-btn>
          </b-col>
        </b-row>
        <b-row class="mt-4">
          <b-col align="right">
            <b-btn
              class="add-btn"
              variant="outline-success"
              @click="addNamespace()"
              size="sm"
            >
              <fa-icon icon="plus"></fa-icon>
              <span class="ml-2">Add namespace</span>
            </b-btn>
          </b-col>
        </b-row>
      </b-collapse>
    </div>
  </div>
</template>

<script>
import Empty from "../Shared/Empty";
import {mapGetters} from "vuex";
import {ADD_NAMESPACE, EDIT_NAMESPACE, REMOVE_NAMESPACE} from "../../store/action-types";

export default {
  name: 'MetadataEditor',
  components: {Empty},
  methods: {
    removeSchema(index) {
      this.$delete(this.schemas, index);
    },
    addSchema() {
      this.schemas.push('');
    },
    removeContributor(index) {
      this.$delete(this.contributors, index);
    },
    removeAuthor(index) {
      this.$delete(this.authors, index);
    },
    addContributor() {
      this.contributors.push({...this.person});
    },
    addAuthor() {
      this.authors.push({...this.person});
    },
    removeNamespace(nsPrefix) {
      this.$store.dispatch(REMOVE_NAMESPACE, nsPrefix);
    },
    addNamespace() {
      this.$store.dispatch(ADD_NAMESPACE);
    },
    handleValueChange(nsValue, nsPairDef) {
      this.$store.dispatch(
        EDIT_NAMESPACE,
        {newName: nsPairDef[0], oldName: nsPairDef[0], newValue: nsValue, oldValue: nsPairDef[1]}
      );
    },
    handleLabelChange(event, nsPairDef) {
      this.$store.dispatch(
        EDIT_NAMESPACE,
        {newName: event.target.value, oldName: nsPairDef[0], newValue: nsPairDef[1], oldValue: nsPairDef[1]}
      );
    },
    versionValidator() {
      return this.cwlObject.cwlVersion !== undefined && this.cwlObject.cwlVersion.length > 0;
    },
    contributorValidator(value) {
      return value !== undefined && value?.length > 0;
    }
  },
  computed: {
    person() {
      return {
        [`${this.nsPrefix}:name`]: undefined,
        [`${this.nsPrefix}:email`]: undefined,
        [`${this.nsPrefix}:affiliation`]: undefined,
      };
    },
    ...mapGetters({
      cwlObject: 'cwlObject',
      nsPrefix: 'nsPrefix',
      contributors: 'contributors',
      authors: 'authors',
      schemas: 'schemas',
    })
  }
};
</script>

<style scoped>

</style>
