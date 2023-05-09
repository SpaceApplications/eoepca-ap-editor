# EOEPCA Application Package Editor

## Prerequisites

Create a virtual environment
`python3 -m venv venv`

Install fastapi and dependencies
`pip install -r requirements.txt`

Configure the path for storing the files in the `main.py` file:

```
FILE_SYSTEM_BASE_PATH = "/absolute/path/to/cwl/files/"
```

## Running the dev server

```
uvicorn main:app --reload
```

## Running the production server

```
uvicorn main:app --host 0.0.0.0 --port 80
```