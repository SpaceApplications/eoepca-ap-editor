<template>
  <div id="app">
    <notifications
      class="notification-group mb-1"
      classes="notifications"
      group="global"
      :max="3"
      width="500px"
      position="top right"
    />
    <ApplicationPackageEditor/>
  </div>
</template>

<script>
import ApplicationPackageEditor from "@/views/ApplicationPackageEditor";

export default {
  name: "App",
  components: {
    ApplicationPackageEditor
  },
};
</script>

<style lang="scss">
  @import "@/assets/scss/default/application-package-editor.scss";
  body {
    word-break: break-all;
  }
  .message {
    border-radius: 0;
    font-size: $font-size-base * 1.2;
  }

  .tab-pane {
    outline: none;
  }

  .notification-group {
    margin-top: $navbar-height * 1.1;
  }

  .notifications {
    padding: 15px 20px 15px 20px;
    margin: 5px 20px 5px 20px;
    font-size: $font-size-base * 1.05;
    color: black;
    border: 1px solid black;
    border-radius: 5px;
    -webkit-box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.1);
    -moz-box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.1);
    box-shadow: 0px 0px 15px 5px rgba(0, 0, 0, 0.1);

    &.success {
      border-color: theme-color("success");
      background: lighten(theme-color("success"), 47%);
    }
    &.warn {
      border-color: theme-color("warning");
      background: lighten(theme-color("warning"), 47%);
    }
    &.error {
      border-color: theme-color("danger");
      background: lighten(theme-color("danger"), 47%);
    }
  }

  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  *::-webkit-scrollbar-track {
    background: #eeeeee;
    border-radius: 10px;
  }

  *::-webkit-scrollbar-thumb {
    background-color: #c2c2c2;
    border-radius: 10px;
  }

  .multiselect__tag {
    font-size: 100%;
    padding: 0.1rem 1.7rem 0.1rem 0.25rem;
  }
</style>
