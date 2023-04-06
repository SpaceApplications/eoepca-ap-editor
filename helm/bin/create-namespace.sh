#!/usr/bin/env bash

# Namespaces provide a mechanism for isolating groups of resources within a single collection.
#
# Namespaces give names a scope. Names of resources need to be unique within a namespace,
# but not across namespaces. Namespaces cannot be nested inside one another and each Kubernetes
# resource can only be in one namespace.
#
# This script is a shortcut to create a namespace in the target cluster, if it does not exist.
#
# Example: ./create-namespace.sh ap-editor

source ./bash-styles.sh

ns=$1

function usage() {
  echo "USAGE: ./create-namespace.sh <NAMESPACE>"
}

if test -z "$ns"; then
  echo -e "${RED}ERROR: must supply a namespace.${NO_COLOR}"
  usage
  exit 1
fi

if ! kubectl get namespace -o name | grep -q "${ns}"; then
  echo -e "${YELLOW}Creating ${ns} namespace...${NO_COLOR}"
  kubectl create namespace "${ns}"
else
  echo -e "${YELLOW}Namespace ${ns} already exists.${NO_COLOR}"
fi
