#!/usr/bin/env bash
source ./bash-styles.sh

./create-namespace.sh ap-editor

echo -e "${YELLOW}Installing EO Application Package Editor...${NO_COLOR}"
helm upgrade --install ap-editor ../charts/eo-application-package-editor/ \
  --namespace ap-editor \
  --values ../values/eo-application-package-editor/values.yaml
