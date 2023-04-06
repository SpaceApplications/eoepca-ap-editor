#!/usr/bin/env bash

source ./bash-styles.sh

echo -e "${YELLOW}Uninstalling EO Application Package Editor...${NO_COLOR}"
helm uninstall ap-editor --namespace ap-editor

echo -e "${YELLOW}Deleting ap-editor namespace...${NO_COLOR}"
kubectl delete namespace ap-editor
