# EOEPCA Application Package Editor

EOEPCA Application Package Editor is an interactive editor for the Common Workflow Language that allow users to easily 
build an Application Package following the 
[OGC Best Practice for Earth Observation Application Package](https://docs.ogc.org/bp/20-089r1.html).

The editor uses FastAPI for the Backend to manage user workspace and application package version and VueJS for the 
Frontend.

## Development Environment

### Frontend
From the `frontend` folder, run:
1. Project setup: `yarn install`
2. Compiles and hot-reloads for development: `yarn serve`

### Backend
From the `backend` folder:
#### Prerequisites
1. Create a virtual environment: `python3 -m venv venv`
2. Install FastAPI and dependencies`pip install -r requirements.txt`

#### Running the dev server
```shell
uvicorn main:app --reload
```

## Docker & Kubernetes Environment
From the root folder of this project:

### Docker Environment
Build a docker image of the Application Package Editor and run it as a container:

```shell
docker build -t eo-application-package-editor .
docker run -it -p 8080:80 -p 8000:8000 --rm --name ap-editor eo-application-package-editor
```

### Kubernetes Environment
1. Build, Tag and Push the docker image version to Space Application Nexus Repository where `<version>` 
   should follow this format `[Build Date][a-z]`. The `[a-z]` is a one alphabetical character that allow to differentiate 
   between version build the same day. Example: `2023-05-22a`.

    ```shell
    docker build -t eo-application-package-editor .
    docker tag eo-application-package-editor nexus.spaceapplications.com/repository/docker-eoepca/ap-editor:<version>
    docker login nexus.spaceapplications.com
    docker push nexus.spaceapplications.com/repository/docker-eoepca/ap-editor:<version>
    ```

2. Deploy in a kubernetes cluster (from `helm` folder).
    ```shell
    helm upgrade --kubeconfig kubeconfig --install ap-editor eo-application-package-editor/ --values values/<environment>/values.yaml
    ```
## Documentation
See the documentation page for the latest docs.

## Useful links
1. [OGC Best Practice for Earth Observation Application Package](https://docs.ogc.org/bp/20-089r1.html)
2. [CWL Workflow](https://www.commonwl.org/v1.0/Workflow.html)
3. [CWL CommandLineTool](https://www.commonwl.org/v1.0/CommandLineTool.html)
