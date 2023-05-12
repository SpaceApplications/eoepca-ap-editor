
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import os
import shutil

app = FastAPI()


FILE_SYSTEM_BASE_PATH = os.getenv(
    "AP_EDITOR_FILES_DIRECTORY",
    os.path.join(os.getcwd(), "files/")
)

# TODO This is only needed for development
ALLOWED_ORIGINS = [
    "http://localhost:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ApplicationVersion(BaseModel):
    version: str
    locked: bool
    lastModified: int

class ApplicationCWL(BaseModel):
    cwl: str
    version: str
    locked: bool
    lastModified: int

class CWL(BaseModel):
    cwl: str

@app.get("/aps/")
async def list_application_packages() -> List[str]:
    ap_slugs = [
            f.path[len(FILE_SYSTEM_BASE_PATH):] # Splice to remove BASE_PATH
            for f in os.scandir(FILE_SYSTEM_BASE_PATH) if f.is_dir()
        ]
    return ap_slugs


@app.get("/aps/{ap_slug}/versions/")
async def list_application_package_versions(ap_slug: str) -> List[ApplicationVersion]:
    ap_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug)
    if os.path.isdir(ap_path):
        versions =  [
            f.path # Splice to remove BASE_PATH
            for f in os.scandir(ap_path) 
        ]
        print(versions)
        version_list = []
        for v in versions:
            locked = False
            if v.endswith("__locked.cwl"):
                v_slug = v[:-12]
                locked = True
            else:
                v_slug = v[:-4]
            version_list.append({
                "version": v_slug[len(ap_path)+1:],
                "locked": locked,
                "lastModified": os.path.getmtime(v)
            })
     
        return version_list
    raise HTTPException(status_code=404, detail="Application package with given slug not found")


@app.get("/aps/{ap_slug}/versions/{version_slug}/")
async def get_application_package_version(ap_slug: str, version_slug: str) -> ApplicationCWL:
    ap_version_path = os.path.join(FILE_SYSTEM_BASE_PATH, ap_slug, version_slug)
    # Check if an unlocked or locked version exist
    if os.path.exists(ap_version_path + ".cwl"):
        with open(ap_version_path + ".cwl", 'r') as cwl_file:
            cwl = cwl_file.read()
            return {
                "cwl" : cwl,
                "version": version_slug,
                "locked": False,
                "lastModified": os.path.getmtime(ap_version_path + ".cwl")
            }
    if os.path.exists(ap_version_path + "__locked.cwl"):
        with open(ap_version_path + "__locked.cwl", 'r') as cwl_file:
            cwl = cwl_file.read()
            return {
                "cwl" : cwl,
                "version": version_slug,
                "locked": True,
                "lastModified": os.path.getmtime(ap_version_path + "__locked.cwl")
            }
    raise HTTPException(
        status_code=404,
        detail="Application package with given slug and version not found"
    )


@app.put("/aps/{ap_slug}/versions/{version_slug}/", status_code=201)
async def create_or_update_application_package_version(ap_slug: str, version_slug: str, cwl: CWL):
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
    
    # Write it to disk
    with open(cwl_path + ".cwl", 'w') as cwl_file:
        cwl_file.write(cwl.cwl)


@app.patch("/aps/{ap_slug}/versions/{version_slug}/lock", status_code=204)
async def lock_application_package_version(ap_slug: str, version_slug: str) -> None:
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
async def unlock_application_package_version(ap_slug: str, version_slug: str) -> None:
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
async def delete_application_package(ap_slug: str) -> None:
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
async def delete_application_package_version(ap_slug: str, version_slug: str) -> None:
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
