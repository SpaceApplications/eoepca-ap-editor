from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil

app = FastAPI()

# TODO make this an environment variable so it is configurable at deployment time
FILE_SYSTEM_BASE_PATH = "/home/jla/Documents/EOEPCA/ap-editor/backend/testfiles/"

# TODO This is only needed for development
ALLOWED_ORIGINS = [
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
)


@app.get("/aps/")
async def aps_list():
    ap_slugs = [
            f.path[len(FILE_SYSTEM_BASE_PATH):] # Splice to remove BASE_PATH
            for f in os.scandir(FILE_SYSTEM_BASE_PATH) if f.is_dir()
        ]
    return ap_slugs


@app.get("/aps/{ap_slug}/versions/")
async def get_ap_versions(ap_slug):
    ap_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug)
    if os.path.isdir(ap_path):
        versions =  [
            f.path[len(ap_path)+1:] # Splice to remove BASE_PATH
            for f in os.scandir(ap_path) 
        ]
        return versions
    raise HTTPException(status_code=404, detail="Application package with given slug not found")


@app.get("/aps/{ap_slug}/versions/{version_slug}/")
async def get_ap_version(ap_slug, version_slug):
    ap_version_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug, version_slug)
    # Check if an unlocked or locked version exist
    if os.path.exists(ap_version_path + ".cwl"):
        return FileResponse(ap_version_path + ".cwl")
    if os.path.exists(ap_version_path + "__locked.cwl"):
        return FileResponse(ap_version_path + "__locked.cwl")
    raise HTTPException(
        status_code=404,
        detail="Application package with given slug and version not found"
    )


@app.put("/aps/{ap_slug}/versions/{version_slug}/", status_code=201)
async def create_or_update_ap_version(ap_slug, version_slug, request: Request):
    ap_path =  os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug)
    cwl_path = os.path.join(ap_path, version_slug)
    print(f"Path for new file: {cwl_path}")

    # check if locked version exists
    if os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(
            status_code=400,
            detail="This version is locked and cannot be updated."
        )

    # Create directory if it does not yet exist
    if not os.path.isdir(ap_path):
        os.mkdir(ap_path)
    
    body = b''
    # Read in the file
    async for chunk in request.stream():
        body += chunk 
    # Write it to disk
    with open(cwl_path + ".cwl", 'w') as cwl_file:
        cwl_file.write(body.decode())


@app.patch("/aps/{ap_slug}/versions/{version_slug}/lock", status_code=204)
async def lock_ap_version(ap_slug, version_slug):
    # Check if file exists
    cwl_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug, version_slug)
    if os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(
            status_code=304,
            detail="This version is already locked."
        )
    if not os.path.exists(cwl_path + ".cwl"):
        raise HTTPException(
            status_code=404,
            detail="This version does not exist."
        )

    os.rename(cwl_path + ".cwl", cwl_path + "__locked.cwl")


@app.patch("/aps/{ap_slug}/versions/{version_slug}/unlock", status_code=204)
async def unlock_ap_version(ap_slug, version_slug):
    cwl_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug, version_slug)

    if os.path.exists(cwl_path + ".cwl"):
        raise HTTPException(
            status_code=304,
            detail="This version is not locked."
        )

    if not os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(
            status_code=404,
            detail="This version does not exist."
        )

    os.rename(cwl_path + "__locked.cwl", cwl_path + ".cwl")


@app.delete("/aps/{ap_slug}/")
async def delete_ap(ap_slug):
    ap_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug)
    if not os.path.isdir(ap_path):
        raise HTTPException(
            status_code=404,
            detail="Application slug not found."
        )
    versions =  [
        f.path[len(ap_path)+1:] # Splice to remove BASE_PATH
        for f in os.scandir(ap_path) 
    ]
    for version in versions:
        if version.endswith("__locked.cwl"):
            raise HTTPException(
                status_code=400,
                detail="Application has locked versions and cannot be deleted."
            )

    shutil.rmtree(ap_path)


@app.delete("/aps/{ap_slug}/versions/{version_slug}/")
async def delete_ap_version(ap_slug, version_slug):
    ap_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug)
    cwl_path =  os.path.join(ap_path, version_slug)
    if os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(
            status_code=400,
            detail="You cannot delete a locked version."
        )
    if os.path.exists(cwl_path + ".cwl"):
        os.remove(cwl_path + ".cwl")
        if len(os.listdir(ap_path)) == 0:
            os.rmdir(ap_path)
    else:
        raise HTTPException(
            status_code=404,
            detail="This version does not exist."
        )
